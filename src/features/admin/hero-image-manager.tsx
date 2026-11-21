"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, RotateCcw, Save } from "lucide-react";
import { compressImageForUpload } from "@/lib/image-compression";
import { useToast } from "@/components/shared/toast-provider";
import {
  saveHeroImageAction,
  uploadPublicSiteMediaAction,
} from "./media-actions";

const DEFAULT_HERO_IMAGE = "/images/stitch/hero-main.png";

export function HeroImageManager({
  initialImageUrl,
}: {
  initialImageUrl: string;
}) {
  const { showToast } = useToast();
  const [previewUrl, setPreviewUrl] = useState(
    initialImageUrl || DEFAULT_HERO_IMAGE,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImageForUpload(file, {
        maxDimension: 1600,
        quality: 0.85,
      });
      const fd = new FormData();
      fd.append("folder", "hero");
      fd.append("file", compressed);

      const res = await uploadPublicSiteMediaAction(fd);
      if (!res.ok) {
        showToast({ variant: "error", title: res.error });
        return;
      }

      setPreviewUrl(res.publicUrl);
      showToast({
        variant: "info",
        title: "تم رفع الصورة للمعاينة",
        description: "اضغط «حفظ صورة الـ Hero» لنشرها في الصفحة الرئيسية.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveHeroImageAction(previewUrl);
      if (res.ok) {
        showToast({
          variant: "success",
          title: "تم حفظ صورة الـ Hero بنجاح",
          description: "ستظهر الصورة الجديدة فورًا على الصفحة الرئيسية.",
        });
      } else {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حفظ الصورة.",
        });
      }
    });
  }

  function handleResetDefault() {
    setPreviewUrl(DEFAULT_HERO_IMAGE);
    startTransition(async () => {
      const res = await saveHeroImageAction(DEFAULT_HERO_IMAGE);
      if (res.ok) {
        showToast({
          variant: "success",
          title: "تمت استعادة صورة الـ Hero الافتراضية",
        });
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">
            صورة القسم الرئيسي (Hero Image)
          </h2>
          <p className="text-xs text-muted-foreground">
            ارفع صورة جديدة وعاينها قبل الحفظ. تُحفظ في مساحة الوسائط العامة
            (`site-media`) بشكل منفصل تمامًا عن صور طلبات العملاء.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-primary-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="معاينة صورة القسم الرئيسي"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-7">
          <label className="inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isUploading ? "جاري الرفع..." : "اختيار صورة جديدة"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isUploading || isPending}
              className="sr-only"
            />
          </label>

          <p className="text-xs text-muted-foreground">
            الأبعاد المفضلة: أفقية (4:3 أو 16:10) بدقة واضحة. الصيغ المدعومة:
            JPG, PNG, WebP.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={isPending || isUploading}
              onClick={handleSave}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-primary-600 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              <span>حفظ صورة الـ Hero</span>
            </button>

            <button
              type="button"
              disabled={isPending || isUploading}
              onClick={handleResetDefault}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>استعادة الصورة الافتراضية</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
