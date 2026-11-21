"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_ICONS = [
  "whatsapp",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "globe",
] as const;

function isSafeExternalOrInternalUrl(raw: string, allowInternal = false): boolean {
  const clean = raw.trim();
  if (!clean || clean.length > 500) return false;
  if (allowInternal && clean.startsWith("/") && !clean.startsWith("//")) {
    return true;
  }
  try {
    const parsed = new URL(clean);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function saveSocialLinkAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const id = String(formData.get("id") ?? "").trim();
  const platform = String(formData.get("platform") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  const labelAr = String(formData.get("labelAr") ?? "").trim();
  const labelEn = String(formData.get("labelEn") ?? "").trim() || labelAr;
  const iconKeyRaw = String(formData.get("iconKey") ?? "globe").trim();
  const iconKey = ALLOWED_ICONS.includes(
    iconKeyRaw as (typeof ALLOWED_ICONS)[number],
  )
    ? iconKeyRaw
    : "globe";
  const urlRaw = String(formData.get("url") ?? "").trim();
  const activeRequested = formData.get("active") === "true";

  if (!labelAr || labelAr.length < 2) {
    return { ok: false, error: "يرجى إدخال اسم المنصة." };
  }

  if (urlRaw && !isSafeExternalOrInternalUrl(urlRaw, false)) {
    return {
      ok: false,
      error: "رابط المنصة غير صالح. يجب أن يبدأ بـ https:// أو http://",
    };
  }

  // Never allow activating a platform without a valid URL
  const finalActive = Boolean(activeRequested && urlRaw);

  const supabase = await createSupabaseServerClient();

  if (id) {
    const { error } = await supabase
      .from("social_links")
      .update({
        label_ar: labelAr,
        label_en: labelEn,
        icon_key: iconKey,
        url: urlRaw || null,
        active: finalActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { ok: false, error: `تعذر تحديث المنصة: ${error.message}` };
    }
  } else {
    const slugPlatform = platform || `social-${Date.now().toString(36)}`;
    const { error } = await supabase.from("social_links").insert({
      platform: slugPlatform,
      label_ar: labelAr,
      label_en: labelEn,
      icon_key: iconKey,
      url: urlRaw || null,
      active: finalActive,
      sort_order: 10,
    });

    if (error) {
      return { ok: false, error: `تعذر إضافة المنصة: ${error.message}` };
    }
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/social");
  return { ok: true };
}

export async function deleteSocialLinkAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "معرف غير صالح." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) return { ok: false, error: "تعذر حذف المنصة." };

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/social");
  return { ok: true };
}

export async function savePosterPopupSettingsAction(input: {
  enabled: boolean;
  imageUrl: string | null;
  buttonTextAr: string;
  buttonTextEn: string;
  buttonUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const cleanImage = input.imageUrl?.trim() || null;
  const cleanButtonUrl = input.buttonUrl.trim() || "/ar/order";

  if (cleanImage && !isSafeExternalOrInternalUrl(cleanImage, true)) {
    return { ok: false, error: "رابط صورة البوستر غير صالح." };
  }
  if (!isSafeExternalOrInternalUrl(cleanButtonUrl, true)) {
    return {
      ok: false,
      error: "رابط زر البوستر غير صالح (يجب أن يكون رابطاً داخلياً أو https://).",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "poster_popup",
      value: {
        enabled: Boolean(input.enabled && cleanImage),
        imageUrl: cleanImage,
        buttonTextAr: input.buttonTextAr.trim() || "اطلب كتابك الآن",
        buttonTextEn: input.buttonTextEn.trim() || "Order Your Book Now",
        buttonUrl: cleanButtonUrl,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, error: "تعذر حفظ إعدادات البوستر الترويجي." };
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/social");
  return { ok: true };
}
