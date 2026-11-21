"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectImageMimeFromBytes } from "@/lib/security/upload-validation";

const SITE_MEDIA_BUCKET = "site-media";
const MAX_SITE_MEDIA_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadPublicMediaResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string };

/**
 * Admin-only upload to the public `site-media` bucket (strictly separated from private `child-photos`).
 * Used for Hero image, Portfolio Case Study covers, and Promotional Poster Popup.
 */
export async function uploadPublicSiteMediaAction(
  formData: FormData,
): Promise<UploadPublicMediaResult> {
  await requireAdminAccess();

  const folderRaw = String(formData.get("folder") ?? "general");
  const folder = ["hero", "portfolio", "poster"].includes(folderRaw)
    ? folderRaw
    : "general";

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "يرجى اختيار صورة صالحة أولاً." };
  }

  if (file.size > MAX_SITE_MEDIA_BYTES) {
    return { ok: false, error: "حجم الصورة يتجاوز الحد الأقصى (5 ميجابايت)." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detectedMime = detectImageMimeFromBytes(bytes);
  if (!detectedMime) {
    return {
      ok: false,
      error: "صيغة الملف غير مدعومة. يرجى رفع صورة JPG أو PNG أو WebP.",
    };
  }

  const ext =
    detectedMime === "image/png"
      ? "png"
      : detectedMime === "image/webp"
        ? "webp"
        : "jpg";
  const storagePath = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(storagePath, bytes, {
      contentType: detectedMime,
      upsert: false,
    });

  if (error) {
    return { ok: false, error: `تعذر رفع الصورة: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return {
    ok: true,
    publicUrl: urlData.publicUrl,
    path: storagePath,
  };
}

export async function saveHeroImageAction(
  imageUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const clean = imageUrl.trim();
  if (
    !clean ||
    (!clean.startsWith("https://") && !clean.startsWith("/images/"))
  ) {
    return { ok: false, error: "رابط صورة الـ Hero غير صالح." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: "hero_image_url",
      value: clean,
      value_en: clean,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, error: "تعذر حفظ صورة الـ Hero." };
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function savePortfolioStoryAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  await requireAdminAccess();

  const id = String(formData.get("id") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || titleAr;
  const shortSummaryAr = String(formData.get("shortSummaryAr") ?? "").trim();
  const shortSummaryEn =
    String(formData.get("shortSummaryEn") ?? "").trim() || shortSummaryAr;
  const storyInterestsAr = String(formData.get("storyInterestsAr") ?? "").trim();
  const storyInterestsEn =
    String(formData.get("storyInterestsEn") ?? "").trim() || storyInterestsAr;
  const storyIdeaAr = String(formData.get("storyIdeaAr") ?? "").trim();
  const storyIdeaEn =
    String(formData.get("storyIdeaEn") ?? "").trim() || storyIdeaAr;
  const storyHeroAr = String(formData.get("storyHeroAr") ?? "").trim();
  const storyHeroEn =
    String(formData.get("storyHeroEn") ?? "").trim() || storyHeroAr;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const published = formData.get("published") === "true";

  if (!titleAr || titleAr.length < 2) {
    return { ok: false, error: "يرجى إدخال اسم القصة أو العمل." };
  }
  if (!imageUrl || !imageUrl.startsWith("https://")) {
    return {
      ok: false,
      error: "يرجى رفع صورة غلاف للقصة أولاً (أو إدخال رابط HTTPS صالح).",
    };
  }

  const supabase = await createSupabaseServerClient();

  const payload = {
    title: titleAr,
    title_ar: titleAr,
    title_en: titleEn,
    description_ar: shortSummaryAr || null,
    description_en: shortSummaryEn || null,
    short_summary_ar: shortSummaryAr || null,
    short_summary_en: shortSummaryEn || null,
    story_interests_ar: storyInterestsAr || null,
    story_interests_en: storyInterestsEn || null,
    story_idea_ar: storyIdeaAr || null,
    story_idea_en: storyIdeaEn || null,
    story_hero_ar: storyHeroAr || null,
    story_hero_en: storyHeroEn || null,
    image_url: imageUrl,
    kind: "sample" as const,
    guardian_consent_verified: true,
    published,
  };

  if (id) {
    const { error } = await supabase
      .from("portfolio")
      .update(payload)
      .eq("id", id);
    if (error) {
      return { ok: false, error: `تعذر تحديث القصة: ${error.message}` };
    }
  } else {
    const slug = `story-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
    const { error } = await supabase.from("portfolio").insert({
      ...payload,
      slug,
    });
    if (error) {
      return { ok: false, error: `تعذر إضافة القصة: ${error.message}` };
    }
  }

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/portfolio");
  revalidatePath("/en/portfolio");
  revalidatePath("/admin/portfolio");
  return { ok: true };
}

export async function togglePortfolioPublishAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const id = String(formData.get("id") ?? "").trim();
  const published = formData.get("published") === "true";
  if (!id) return { ok: false, error: "معرف غير صالح." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("portfolio")
    .update({ published })
    .eq("id", id);

  if (error) return { ok: false, error: "تعذر تحديث حالة النشر." };

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/portfolio");
  revalidatePath("/en/portfolio");
  revalidatePath("/admin/portfolio");
  return { ok: true };
}

export async function deletePortfolioItemAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "معرف غير صالح." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("portfolio").delete().eq("id", id);

  if (error) return { ok: false, error: "تعذر حذف القصة." };

  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/portfolio");
  revalidatePath("/en/portfolio");
  revalidatePath("/admin/portfolio");
  return { ok: true };
}
