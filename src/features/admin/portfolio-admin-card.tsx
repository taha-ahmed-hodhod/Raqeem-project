"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Home,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import type { PortfolioEntryRow } from "@/lib/supabase/types";
import { useToast } from "@/components/shared/toast-provider";
import {
  deletePortfolioItemAction,
  togglePortfolioHomeAction,
  togglePortfolioPublishAction,
  updatePortfolioCoverImageAction,
  updatePortfolioHomeOrderAction,
  uploadPublicSiteMediaAction,
} from "./media-actions";

interface PortfolioAdminCardProps {
  item: PortfolioEntryRow;
  totalHomeSelected: number;
}

export function PortfolioAdminCard({
  item,
  totalHomeSelected,
}: PortfolioAdminCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showOnHome, setShowOnHome] = useState(Boolean(item.show_on_home));
  const [homeOrder, setHomeOrder] = useState<number>(
    item.home_sort_order && item.home_sort_order > 0 ? item.home_sort_order : 1,
  );
  const [published, setPublished] = useState(Boolean(item.published));
  const [coverUrl, setCoverUrl] = useState(item.image_url);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleToggleHome() {
    const nextValue = !showOnHome;

    // Immediate friendly guidance if admin tries to select a 4th item
    if (nextValue && totalHomeSelected >= 3) {
      showToast({
        variant: "error",
        title: "الحد الأقصى للرئيسية 3 كتب فقط",
        description:
          "يرجى إزالة أحد الكتب الثلاثة المختارة للرئيسية أولاً قبل إضافة كتاب جديد.",
      });
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", item.id);
      fd.set("showOnHome", String(nextValue));
      const res = await togglePortfolioHomeAction(fd);

      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر تحديث اختيار الصفحة الرئيسية.",
        });
        return;
      }

      setShowOnHome(nextValue);
      showToast({
        variant: "success",
        title: nextValue
          ? "تمت إضافة الكتاب إلى الصفحة الرئيسية"
          : "تمت إزالة الكتاب من الصفحة الرئيسية",
      });
      router.refresh();
    });
  }

  function handleOrderChange(nextOrder: number) {
    setHomeOrder(nextOrder);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", item.id);
      fd.set("homeSortOrder", String(nextOrder));
      const res = await updatePortfolioHomeOrderAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حفظ الترتيب.",
        });
        return;
      }
      showToast({
        variant: "success",
        title: `تم تحديث الترتيب في الرئيسية إلى #${nextOrder}`,
      });
      router.refresh();
    });
  }

  function handleTogglePublish() {
    const nextPublished = !published;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", item.id);
      fd.set("published", String(nextPublished));
      const res = await togglePortfolioPublishAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر تحديث حالة النشر.",
        });
        return;
      }
      setPublished(nextPublished);
      showToast({
        variant: "success",
        title: nextPublished
          ? "تم نشر العمل في المعرض"
          : "تم تحويل العمل إلى مسودة (مخفي)",
      });
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", item.id);
      const res = await deletePortfolioItemAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حذف العمل.",
        });
        return;
      }
      showToast({
        variant: "success",
        title: "تم حذف العمل بنجاح",
      });
      router.refresh();
    });
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const uploadFd = new FormData();
      uploadFd.set("file", file);
      uploadFd.set("folder", "portfolio");
      const uploadRes = await uploadPublicSiteMediaAction(uploadFd);

      if (!uploadRes.ok) {
        showToast({
          variant: "error",
          title: uploadRes.error,
        });
        return;
      }

      const updateFd = new FormData();
      updateFd.set("id", item.id);
      updateFd.set("imageUrl", uploadRes.publicUrl);
      const updateRes = await updatePortfolioCoverImageAction(updateFd);

      if (!updateRes.ok) {
        showToast({
          variant: "error",
          title: updateRes.error ?? "تعذر حفظ صورة الغلاف.",
        });
        return;
      }

      setCoverUrl(uploadRes.publicUrl);
      showToast({
        variant: "success",
        title: "تم تحديث غلاف الكتاب بنجاح",
        description: "سيظهر الغلاف الجديد فورًا في الرئيسية وصفحة أعمالنا.",
      });
      router.refresh();
    });

    e.target.value = "";
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xs">
      <div className="relative aspect-[4/3] w-full bg-primary-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={item.title_ar}
          className="h-full w-full object-cover"
        />

        {/* Status & Home Badges */}
        <div className="absolute top-2.5 end-2.5 flex flex-wrap items-center gap-1.5">
          {showOnHome && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#6324C5] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              <Home className="h-3 w-3" aria-hidden="true" />
              <span>الرئيسية #{homeOrder}</span>
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              published
                ? "bg-success text-white"
                : "bg-foreground/75 text-white"
            }`}
          >
            {published ? "منشور" : "مسودة (مخفي)"}
          </span>
        </div>

        {/* Quick Cover Replace Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleCoverFileChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-2.5 start-2.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 text-[11px] font-extrabold text-[#241747] shadow-sm backdrop-blur-xs hover:bg-[#F3EAFF] hover:text-[#6324C5] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>تغيير الغلاف</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <h3 className="text-base font-extrabold text-foreground">
            {item.title_ar}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.short_summary_ar || item.description_ar || "—"}
          </p>
        </div>

        {/* Homepage Featured Toggle & Sort Order */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-surface p-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleHome}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors disabled:opacity-60 ${
              showOnHome
                ? "bg-[#6324C5] text-white hover:bg-[#541CA9]"
                : "border border-border bg-background text-foreground hover:bg-primary-50"
            }`}
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {showOnHome ? "معروض في الرئيسية" : "عرض في الرئيسية"}
            </span>
          </button>

          {showOnHome && (
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <span>الترتيب:</span>
              <select
                value={homeOrder}
                disabled={isPending}
                onChange={(e) => handleOrderChange(Number(e.target.value))}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-extrabold text-foreground"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Publish & Delete Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePublish}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-foreground hover:bg-primary-50 disabled:opacity-60"
          >
            {published ? (
              <>
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إخفاء</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>نشر</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            aria-label={`حذف ${item.title_ar}`}
            className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-error/10 px-3 text-xs font-bold text-error hover:bg-error/20 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>حذف</span>
          </button>
        </div>
      </div>
    </article>
  );
}
