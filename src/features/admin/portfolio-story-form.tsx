"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, PlusCircle } from "lucide-react";
import { compressImageForUpload } from "@/lib/image-compression";
import { useToast } from "@/components/shared/toast-provider";
import {
  savePortfolioStoryAction,
  uploadPublicSiteMediaAction,
} from "./media-actions";

export function PortfolioStoryForm() {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [shortSummaryAr, setShortSummaryAr] = useState("");
  const [storyInterestsAr, setStoryInterestsAr] = useState("");
  const [storyIdeaAr, setStoryIdeaAr] = useState("");
  const [storyHeroAr, setStoryHeroAr] = useState("");
  const [published, setPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImageForUpload(file, {
        maxDimension: 1400,
        quality: 0.84,
      });
      const fd = new FormData();
      fd.append("folder", "portfolio");
      fd.append("file", compressed);

      const res = await uploadPublicSiteMediaAction(fd);
      if (!res.ok) {
        showToast({ variant: "error", title: res.error });
        return;
      }

      setImageUrl(res.publicUrl);
      showToast({
        variant: "success",
        title: "تم رفع صورة القصة بنجاح",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("titleAr", titleAr);
      fd.append("titleEn", titleEn);
      fd.append("shortSummaryAr", shortSummaryAr);
      fd.append("storyInterestsAr", storyInterestsAr);
      fd.append("storyIdeaAr", storyIdeaAr);
      fd.append("storyHeroAr", storyHeroAr);
      fd.append("imageUrl", imageUrl);
      fd.append("published", String(published));

      const res = await savePortfolioStoryAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حفظ القصة.",
        });
        return;
      }

      showToast({
        variant: "success",
        title: "تمت إضافة قصة العمل بنجاح!",
      });
      setImageUrl("");
      setTitleAr("");
      setTitleEn("");
      setShortSummaryAr("");
      setStoryInterestsAr("");
      setStoryIdeaAr("");
      setStoryHeroAr("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
    >
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <PlusCircle className="h-5 w-5 text-primary-500" aria-hidden="true" />
        <h2 className="text-lg font-extrabold text-foreground">
          إضافة قصة جديدة لمعرض الأعمال (Case Study)
        </h2>
      </div>

      <p className="rounded-xl bg-primary-50/70 p-3 text-xs leading-relaxed text-muted-foreground">
        تُرفع صور المعرض إلى مساحة الوسائط العامة (`site-media`) بشكل مستقل
        تمامًا عن صور الطلبات الخاصة (`child-photos`). لا يتم نشر أي صورة طلب
        تلقائيًا.
      </p>

      {/* Cover Image Upload */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-28 w-36 overflow-hidden rounded-xl border border-border bg-background">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt="معاينة صورة القصة"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              لا توجد صورة
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isUploading ? "جاري الرفع..." : "رفع صورة الغلاف"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading || isPending}
              className="sr-only"
            />
          </label>
          <span className="text-[11px] text-muted-foreground">
            صورة واحدة واضحة للكارت (JPG / PNG / WebP)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-foreground">
            اسم القصة / العمل (بالعربية) *
          </label>
          <input
            type="text"
            required
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="مثال: مغامرات في حديقة الفراشات"
            className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-foreground">
            الاسم بالإنجليزية (اختياري)
          </label>
          <input
            type="text"
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Butterfly Garden Adventures"
            className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-foreground">
          نبذة قصيرة تظهر تحت الصورة في الكارت *
        </label>
        <input
          type="text"
          required
          value={shortSummaryAr}
          onChange={(e) => setShortSummaryAr(e.target.value)}
          placeholder="مثال: رحلة مبهجة وسط الأزهار والفراشات الملونة في حديقة سحرية"
          className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
        />
      </div>

      {/* 3 Case Study Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-primary-700">
            1. ما اهتمامات صاحب الكتاب؟
          </label>
          <textarea
            rows={3}
            value={storyInterestsAr}
            onChange={(e) => setStoryInterestsAr(e.target.value)}
            placeholder="اشرح هوايات واهتمامات صاحب القصة..."
            className="rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-warning">
            2. كيف حوّلناها إلى فكرة؟
          </label>
          <textarea
            rows={3}
            value={storyIdeaAr}
            onChange={(e) => setStoryIdeaAr(e.target.value)}
            placeholder="كيف صمم فريق رقيم السيناريو والمشاهد..."
            className="rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-secondary-pink">
            3. وكيف أصبح بطل القصة؟
          </label>
          <textarea
            rows={3}
            value={storyHeroAr}
            onChange={(e) => setStoryHeroAr(e.target.value)}
            placeholder="كيف ظهر بملامحه كبطل في كل صفحة..."
            className="rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-foreground">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 accent-primary-500"
          />
          <span>نشر القصة مباشرة في المعرض العام</span>
        </label>

        <button
          type="submit"
          disabled={isPending || isUploading}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-xs hover:bg-primary-600 disabled:opacity-60"
        >
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <span>حفظ ونشر القصة</span>
        </button>
      </div>
    </form>
  );
}
