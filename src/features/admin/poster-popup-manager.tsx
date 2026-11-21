"use client";

import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Megaphone, Save } from "lucide-react";
import type { PosterPopupSettings } from "@/lib/supabase/types";
import { compressImageForUpload } from "@/lib/image-compression";
import { useToast } from "@/components/shared/toast-provider";
import { uploadPublicSiteMediaAction } from "./media-actions";
import { savePosterPopupSettingsAction } from "@/features/social/actions";

export function PosterPopupManager({
  initialPoster,
}: {
  initialPoster: PosterPopupSettings;
}) {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(initialPoster.enabled);
  const [imageUrl, setImageUrl] = useState(initialPoster.imageUrl ?? "");
  const [buttonTextAr, setButtonTextAr] = useState(initialPoster.buttonTextAr);
  const [buttonTextEn, setButtonTextEn] = useState(initialPoster.buttonTextEn);
  const [buttonUrl, setButtonUrl] = useState(initialPoster.buttonUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImageForUpload(file, {
        maxDimension: 1400,
        quality: 0.85,
      });
      const fd = new FormData();
      fd.append("folder", "poster");
      fd.append("file", compressed);

      const res = await uploadPublicSiteMediaAction(fd);
      if (!res.ok) {
        showToast({ variant: "error", title: res.error });
        return;
      }

      setImageUrl(res.publicUrl);
      if (!imageUrl) {
        setEnabled(true);
      }
      showToast({
        variant: "info",
        title: "تم رفع صورة البوستر للمعاينة",
        description: "اضغط حفظ إعدادات البوستر لتطبيق التغييرات.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await savePosterPopupSettingsAction({
        enabled,
        imageUrl: imageUrl || null,
        buttonTextAr,
        buttonTextEn,
        buttonUrl,
      });

      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حفظ إعدادات البوستر.",
        });
        return;
      }

      showToast({
        variant: "success",
        title: "تم حفظ إعدادات البوستر الترويجي بنجاح!",
      });
    });
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary-500" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-foreground">
            البوستر الترويجي المنبثق (Poster Popup)
          </h2>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-50 px-3.5 py-2 text-xs font-extrabold text-primary-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary-500"
          />
          <span>{enabled ? "مُفعّل عند دخول الموقع" : "متوقف حالياً"}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-background">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="معاينة البوستر الترويجي"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                لا توجد صورة بوستر مرفوعة حالياً (لن تفتح نافذة فارغة للزوار)
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:col-span-8">
          <label className="inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isUploading ? "جاري الرفع..." : "رفع صورة البوستر"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading || isPending}
              className="sr-only"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">
                نص الزر (بالعربية)
              </label>
              <input
                type="text"
                value={buttonTextAr}
                onChange={(e) => setButtonTextAr(e.target.value)}
                placeholder="مثال: اطلب كتابك الآن"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">
                نص الزر (بالإنجليزية)
              </label>
              <input
                type="text"
                dir="ltr"
                value={buttonTextEn}
                onChange={(e) => setButtonTextEn(e.target.value)}
                placeholder="Order Your Book Now"
                className="h-11 rounded-xl border border-border bg-background px-3 text-start text-sm text-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">
              وجهة الزر (رابط داخلي مثل /ar/order أو رابط خارجي https://)
            </label>
            <input
              type="text"
              dir="ltr"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="/ar/order"
              className="h-11 rounded-xl border border-border bg-background px-3 text-start font-mono text-xs text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isUploading}
            className="inline-flex min-h-[44px] w-fit cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-xs hover:bg-primary-600 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            <span>حفظ إعدادات البوستر</span>
          </button>
        </div>
      </div>
    </form>
  );
}
