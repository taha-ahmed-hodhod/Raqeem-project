"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  evaluateAdminAccess,
  requireAdminAccess,
} from "@/lib/security/admin-auth";
import type { OrderLifecycleStage } from "@/lib/supabase/types";

const VALID_LIFECYCLE_STAGES: OrderLifecycleStage[] = [
  "new",
  "contacted",
  "confirmed",
  "designing",
  "printing",
  "shipped",
  "delivered",
  "on_hold",
  "cancelled",
];

function mapLifecycleToLegacyStatus(
  stage: OrderLifecycleStage,
): "new" | "confirmed" | "completed" | "cancelled" {
  switch (stage) {
    case "new":
    case "contacted":
    case "on_hold":
      return "new";
    case "confirmed":
    case "designing":
    case "printing":
    case "shipped":
      return "confirmed";
    case "delivered":
      return "completed";
    case "cancelled":
      return "cancelled";
  }
}

export async function adminSignInAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      ok: false,
      error: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    return {
      ok: false,
      error: "بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.",
    };
  }

  const env = getServerEnv();
  const access = await evaluateAdminAccess(supabase, env.ADMIN_ALLOWED_EMAIL);

  if (!access.authorized) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error:
        "هذا الحساب غير مُدرج في قائمة مسؤول النظام المعتمد (Single Admin Allowlist).",
    };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function adminSignOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateOrderStatusAndNotesAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const orderId = String(formData.get("orderId") ?? "").trim();
  const lifecycleStage = String(
    formData.get("lifecycleStage") ?? "",
  ).trim() as OrderLifecycleStage;
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();
  const shippingEgpRaw = String(formData.get("shippingEgp") ?? "").trim();
  const finalQuoteEgpRaw = String(formData.get("finalQuoteEgp") ?? "").trim();

  if (!orderId || !VALID_LIFECYCLE_STAGES.includes(lifecycleStage)) {
    return { ok: false, error: "بيانات تحديث الطلب غير صالحة." };
  }

  const shippingPiastres =
    shippingEgpRaw === ""
      ? null
      : Math.max(0, Math.round(Number(shippingEgpRaw) * 100));

  const finalQuotePiastres =
    finalQuoteEgpRaw === ""
      ? null
      : Math.max(0, Math.round(Number(finalQuoteEgpRaw) * 100));

  if (
    (shippingPiastres !== null && Number.isNaN(shippingPiastres)) ||
    (finalQuotePiastres !== null && Number.isNaN(finalQuotePiastres))
  ) {
    return { ok: false, error: "قيمة الشحن أو السعر النهائي غير صحيحة." };
  }

  const supabase = await createSupabaseServerClient();
  const legacyStatus = mapLifecycleToLegacyStatus(lifecycleStage);

  const { error } = await supabase
    .from("orders")
    .update({
      lifecycle_stage: lifecycleStage,
      status: legacyStatus,
      admin_notes: adminNotes || null,
      shipping_piastres: shippingPiastres,
      final_quote_piastres: finalQuotePiastres,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/ar/track");
  revalidatePath("/en/track");
  return { ok: true };
}

export async function confirmOrderDepositAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const orderId = String(formData.get("orderId") ?? "").trim();
  const nextStatus = String(formData.get("depositStatus") ?? "received").trim();

  if (!orderId || !["pending", "received"].includes(nextStatus)) {
    return { ok: false, error: "بيانات تأكيد الديبوزت غير صالحة." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({
      deposit_status: nextStatus,
      deposit_received_at:
        nextStatus === "received" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { ok: false, error: `تعذر تحديث حالة الديبوزت: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/ar/track");
  revalidatePath("/en/track");
  return { ok: true };
}

export async function updateBookVariantPriceAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const pages = Number(formData.get("pages"));
  const priceEgp = Number(formData.get("priceEgp"));
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const active = formData.get("active") === "true" || formData.get("active") === "on";

  if (
    (pages !== 12 && pages !== 24) ||
    !Number.isFinite(priceEgp) ||
    priceEgp < 1 ||
    priceEgp > 100000
  ) {
    return { ok: false, error: "سعر الكتاب غير صالح." };
  }

  const pricePiastres = Math.round(priceEgp * 100);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("book_prices")
    .update({
      price_piastres: pricePiastres,
      title_ar: titleAr || (pages === 12 ? "كتاب تلوين 12 صفحة" : "كتاب تلوين 24 صفحة"),
      title_en: titleEn || (pages === 12 ? "12-Page Coloring Book" : "24-Page Coloring Book"),
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("pages", pages);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/pricing");
  revalidatePath("/en/pricing");
  revalidatePath("/ar/order");
  revalidatePath("/en/order");
  return { ok: true };
}

export async function upsertPromotionTierAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const bookCount = Number(formData.get("bookCount"));
  const percent = Number(formData.get("percent"));
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const active = formData.get("active") === "true" || formData.get("active") === "on";

  if (
    !Number.isInteger(bookCount) ||
    bookCount < 2 ||
    bookCount > 50 ||
    !Number.isInteger(percent) ||
    percent < 0 ||
    percent > 90
  ) {
    return { ok: false, error: "بيانات عرض الخصم غير صالحة." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("discount_rules")
    .upsert({
      book_count: bookCount,
      percent,
      title_ar: titleAr || `خصم ${percent}% عند طلب ${bookCount} كتب أو أكثر`,
      title_en: titleEn || `${percent}% off when ordering ${bookCount}+ books`,
      active,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/pricing");
  revalidatePath("/en/pricing");
  revalidatePath("/ar/order");
  revalidatePath("/en/order");
  return { ok: true };
}

export async function updateGovernorateShippingAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const code = String(formData.get("code") ?? "").trim();
  const feeEgpRaw = String(formData.get("feeEgp") ?? "").trim();
  const active = formData.get("active") === "true" || formData.get("active") === "on";

  if (!code) {
    return { ok: false, error: "كود المحافظة غير صالح." };
  }

  let feePiastres: number | null = null;
  if (feeEgpRaw !== "") {
    const feeEgp = Number(feeEgpRaw);
    if (!Number.isFinite(feeEgp) || feeEgp < 0 || feeEgp > 100000) {
      return { ok: false, error: "قيمة مصاريف الشحن غير صالحة." };
    }
    feePiastres = Math.round(feeEgp * 100);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shipping_rates")
    .update({
      fee_piastres: feePiastres,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/shipping");
  revalidatePath("/ar/order");
  revalidatePath("/en/order");
  return { ok: true };
}

export async function createPortfolioEntryAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionAr = String(formData.get("descriptionAr") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const cartoonImageUrl = String(formData.get("cartoonImageUrl") ?? "").trim();
  const coloringPageUrl = String(formData.get("coloringPageUrl") ?? "").trim();
  const kind =
    formData.get("kind") === "authorized" ? "authorized" : "sample";
  const guardianConsentVerified =
    formData.get("guardianConsentVerified") === "true" ||
    formData.get("guardianConsentVerified") === "on";
  const published =
    formData.get("published") === "true" ||
    formData.get("published") === "on";

  if (!titleAr || !imageUrl.startsWith("https://")) {
    return {
      ok: false,
      error: "يرجى إدخال عنوان العمل ورابط صورة صالح يبدأ بـ https://",
    };
  }

  if (kind === "authorized" && published && !guardianConsentVerified) {
    return {
      ok: false,
      error:
        "لا يمكن نشر عمل حقيقي لطفل (authorized) إلا بعد تأكيد وتوثيق موافقة ولي الأمر المستقلة.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("portfolio").insert({
    title: titleAr,
    title_ar: titleAr,
    title_en: titleEn || titleAr,
    slug: slug || null,
    description_ar: descriptionAr || null,
    description_en: descriptionEn || null,
    image_url: imageUrl,
    cartoon_image_url: cartoonImageUrl.startsWith("https://")
      ? cartoonImageUrl
      : null,
    coloring_page_url: coloringPageUrl.startsWith("https://")
      ? coloringPageUrl
      : null,
    kind,
    guardian_consent_verified: guardianConsentVerified,
    published,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/portfolio");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/portfolio");
  revalidatePath("/en/portfolio");
  return { ok: true };
}

export async function updateSiteContentAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const key = String(formData.get("key") ?? "").trim();
  const valueAr = String(formData.get("valueAr") ?? "").trim();
  const valueEn = String(formData.get("valueEn") ?? "").trim();

  if (!key || !valueAr) {
    return { ok: false, error: "يرجى إدخال النص العربي على الأقل." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_content").upsert({
    key,
    value: valueAr,
    value_en: valueEn || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/content");
  revalidatePath("/ar");
  revalidatePath("/en");
  return { ok: true };
}

export async function updateContactSettingsAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const workingHoursAr = String(formData.get("workingHoursAr") ?? "").trim();
  const workingHoursEn = String(formData.get("workingHoursEn") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_settings").upsert({
    key: "contact",
    value: {
      whatsappNumber: whatsappNumber || null,
      phoneNumber: phoneNumber || null,
      email: email || null,
      workingHoursAr:
        workingHoursAr || "يومياً من 10 صباحاً حتى 10 مساءً (بتوقيت القاهرة)",
      workingHoursEn:
        workingHoursEn || "Daily from 10:00 AM to 10:00 PM (Cairo Time)",
    },
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/ar/contact");
  revalidatePath("/en/contact");
  return { ok: true };
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<{ ok: boolean }> {
  await requireAdminAccess();

  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  if (notificationId === "all") {
    await supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
  } else if (notificationId) {
    await supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
  return { ok: true };
}
