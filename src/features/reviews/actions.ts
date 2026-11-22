"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { orderSubmissionRateLimiter } from "@/lib/security/rate-limit";

const MAX_REVIEW_COMMENT_LENGTH = 160;

const submitReviewSchema = z.object({
  reviewerName: z.string().trim().min(2).max(80),
  reviewerAge: z.string().trim().min(1).max(40),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(MAX_REVIEW_COMMENT_LENGTH),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

async function getRateKey(): Promise<string> {
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    return `review:${ip}`;
  } catch {
    return "review:local";
  }
}

/**
 * Public Server Action: Saves a visitor's review with status = 'pending'
 * and sequential deterministic Raqeem avatar (0, 1, 2). Never publicly visible until Admin approves.
 */
export async function submitCustomerReviewAction(
  rawInput: SubmitReviewInput,
): Promise<{ ok: boolean; error?: string }> {
  const rateCheck = orderSubmissionRateLimiter.check(await getRateKey());
  if (!rateCheck.allowed) {
    return {
      ok: false,
      error: "تم إرسال عدة تقييمات خلال فترة قصيرة. يرجى المحاولة لاحقاً.",
    };
  }

  const parsed = submitReviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "يرجى استكمال الاسم والسن والتعليق والتقييم بشكل صحيح.",
    };
  }

  const env = getServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ok: false, error: "تعذر الاتصال بقاعدة البيانات حالياً." };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Let Postgres atomic sequence default assign avatar_index sequentially (0 -> 1 -> 2 -> 0 ...)
  // once at creation time, immune to deletions, edits, or concurrent inserts.
  const { error } = await supabase.from("customer_reviews").insert({
    reviewer_name: parsed.data.reviewerName,
    reviewer_age: parsed.data.reviewerAge,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    status: "pending",
    approved_at: null,
  });

  if (error) {
    return { ok: false, error: "تعذر حفظ التقييم حالياً. حاول مرة أخرى." };
  }

  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function moderateCustomerReviewAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; requiresLogin?: boolean }> {
  const access = await verifyAdminAccess();
  if (!access.authorized) {
    return {
      ok: false,
      requiresLogin: true,
      error: "انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.",
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const reviewerName = String(formData.get("reviewerName") ?? "").trim();
  const reviewerAge = String(formData.get("reviewerAge") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);

  if (
    !id ||
    !["pending", "approved", "rejected", "hidden"].includes(status) ||
    reviewerName.length < 2 ||
    comment.length < 5
  ) {
    return { ok: false, error: "بيانات التقييم غير صالحة." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_reviews")
    .update({
      reviewer_name: reviewerName,
      reviewer_age: reviewerAge || "—",
      comment,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: `تعذر تحديث التقييم: ${error.message}` };
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteCustomerReviewAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; requiresLogin?: boolean }> {
  const access = await verifyAdminAccess();
  if (!access.authorized) {
    return {
      ok: false,
      requiresLogin: true,
      error: "انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.",
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "معرف التقييم غير صالح." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_reviews")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: "تعذر حذف التقييم." };
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/reviews");
  return { ok: true };
}
