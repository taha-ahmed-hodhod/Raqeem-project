"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import {
  CHILD_PHOTOS_BUCKET,
  generatePrivatePhotoPath,
  validateChildPhotoUpload,
} from "@/lib/security/upload-validation";
import {
  isSpamHoneypotTripped,
  orderSubmissionRateLimiter,
} from "@/lib/security/rate-limit";
import {
  orderRequestInputSchema,
  type OrderRequestInput,
} from "@/lib/validation/order-request";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import {
  calculateOrderPricing,
  createOrderPricingSnapshot,
  type OrderPricingSnapshot,
} from "@/features/pricing/pricing-engine";
import { dispatchNotificationOutbox } from "@/features/notifications/dispatcher";

export type UploadPhotoActionResult =
  | {
    ok: true;
    photoPath: string;
  }
  | {
    ok: false;
    errorCode:
    | "rate_limited"
    | "invalid_order_id"
    | "missing_file"
    | "empty_file"
    | "file_too_large"
    | "unsupported_mime"
    | "signature_mismatch"
    | "storage_upload_failed";
  };

export type SubmitOrderActionResult =
  | {
    ok: true;
    orderId: string;
    reference: string;
    deduplicated: boolean;
    snapshot: OrderPricingSnapshot;
  }
  | {
    ok: false;
    errorCode:
    | "spam_detected"
    | "rate_limited"
    | "validation_failed"
    | "submission_failed";
    message?: string;
  };

async function getClientRateLimitKey(prefix: string): Promise<string> {
  try {
    const hdrs = await headers();
    const forwardedFor = hdrs.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "local";
    return `${prefix}:${ip}`;
  } catch {
    return `${prefix}:local`;
  }
}

function getServerSupabaseForOrderMutations() {
  const env = getServerEnv();
  const url =
    env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ojdlkoqettqnlluqfnmt.supabase.co";
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZGxrb3FldHRxbmxsdXFmbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDEyOTYsImV4cCI6MjExMDYxNzI5Nn0.X2MLR-ywUe3GqtTfhapEQkWQvc3N9V46NYUk1XOe04o";

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server Action: Validates child image binary magic-byte signature, size (<= 2MB),
 * and MIME type, then stores it in the private `child-photos` bucket under a randomized UUID path.
 */
export async function uploadChildPhotoAction(
  formData: FormData,
): Promise<UploadPhotoActionResult> {
  const rateKey = await getClientRateLimitKey("upload_photo");
  const rateCheck = orderSubmissionRateLimiter.check(rateKey);
  if (!rateCheck.allowed) {
    return { ok: false, errorCode: "rate_limited" };
  }

  const orderId = formData.get("orderId");
  if (
    typeof orderId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId,
    )
  ) {
    return { ok: false, errorCode: "invalid_order_id" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, errorCode: "missing_file" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const validation = validateChildPhotoUpload({
    bytes,
    declaredMime: file.type || undefined,
  });

  if (!validation.valid) {
    return { ok: false, errorCode: validation.errorCode };
  }

  const photoPath = generatePrivatePhotoPath(orderId, validation.detectedMime);
  const supabase = getServerSupabaseForOrderMutations();

  const { error: uploadError } = await supabase.storage
    .from(CHILD_PHOTOS_BUCKET)
    .upload(photoPath, bytes, {
      contentType: validation.detectedMime,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, errorCode: "storage_upload_failed" };
  }

  return {
    ok: true,
    photoPath,
  };
}

/**
 * Server Action: Validates the order request, enforces guardian consent, rate limit,
 * and honeypot anti-spam, recalculates pricing server-side, and executes the atomic
 * `submit_order_request` database RPC with idempotency protection.
 */
export async function submitOrderRequestAction(
  rawInput: OrderRequestInput,
): Promise<SubmitOrderActionResult> {
  if (isSpamHoneypotTripped(rawInput?.honeypot)) {
    return { ok: false, errorCode: "spam_detected" };
  }

  const rateKey = await getClientRateLimitKey("submit_order");
  const rateCheck = orderSubmissionRateLimiter.check(rateKey);
  if (!rateCheck.allowed) {
    return { ok: false, errorCode: "rate_limited" };
  }

  const parsed = orderRequestInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: "validation_failed",
      message: parsed.error.issues[0]?.message ?? "invalid_input",
    };
  }

  const input = parsed.data;
  const catalog = await getPublicCatalogAndCmsData();
  const selectedGov =
    catalog.governorates.find((g) => g.code === input.governorate) ?? null;

  const serverEstimate = calculateOrderPricing({
    items: input.items.map((item) => ({
      pageCount: item.pageCount,
      quantity: item.quantity,
    })),
    bookVariants: catalog.bookVariants,
    promotions: catalog.promotions,
    governorate: selectedGov,
  });

  const snapshot = createOrderPricingSnapshot(serverEstimate);
  const depositSelectedPiastres =
    typeof input.depositSelectedEgp === "number"
      ? input.depositSelectedEgp * 100
      : null;

  // Reject negative remaining balance server-side (all arithmetic in integer piastres)
  if (
    depositSelectedPiastres !== null &&
    depositSelectedPiastres > snapshot.booksTotalPiastres
  ) {
    return {
      ok: false,
      errorCode: "validation_failed",
      message:
        "قيمة الديبوزت المختارة أكبر من قيمة الكتب. يرجى اختيار قيمة ديبوزت أقل.",
    };
  }

  try {
    const supabase = getServerSupabaseForOrderMutations();

    const rpcItems = input.items.map((item) => ({
      page_count: item.pageCount,
      quantity: item.quantity,
      child_name: item.childName,
      child_age: Math.min(Math.max(item.childAge, 1), 18),
      age_label: item.ageLabel ?? `${item.childAge} سنة`,
      interests: item.interests ?? null,
      notes: item.notes ?? null,
      photo_path: item.photoPath,
    }));

    const { data, error } = await supabase.rpc("submit_order_request_v2", {
      p_idempotency_key: input.idempotencyKey,
      p_customer_name: input.customerName,
      p_phone: input.phone,
      p_whatsapp_phone: input.whatsappPhone ?? null,
      p_governorate: input.governorate,
      p_address: input.address,
      p_notes: input.notes ?? null,
      p_consent_accepted: input.consentAccepted,
      p_deposit_selected_piastres: depositSelectedPiastres,
      p_items: rpcItems,
    });

    if (error || !data) {
      console.error("[submitOrderRequestAction] RPC failed:", error?.message);
      return {
        ok: false,
        errorCode: "submission_failed",
        message: "حصل خطأ ولم يتم إرسال الطلب. يرجى المحاولة مرة أخرى.",
      };
    }

    const result = data as {
      order_id: string;
      reference: string;
      deduplicated: boolean;
    };

    // Best-effort server-side notification dispatch (Web Push + Resend Email).
    // Order & in-app admin notification are already durably committed in Postgres,
    // so external push/email failures never block the customer's request.
    if (!result.deduplicated) {
      try {
        await dispatchNotificationOutbox({
          orderId: result.order_id,
          limit: 4,
        });
      } catch {
        // Outbox rows remain pending in DB for subsequent retry.
      }
    }

    return {
      ok: true,
      orderId: result.order_id,
      reference: result.reference,
      deduplicated: Boolean(result.deduplicated),
      snapshot,
    };
  } catch (err) {
    console.error("[submitOrderRequestAction] Unexpected error:", err);
    return {
      ok: false,
      errorCode: "submission_failed",
      message: "حصل خطأ ولم يتم إرسال الطلب. يرجى المحاولة مرة أخرى.",
    };
  }
}
