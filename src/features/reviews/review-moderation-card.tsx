"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  EyeOff,
  Loader2,
  MessageSquareHeart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { CustomerReviewRow } from "@/lib/supabase/types";
import { useToast } from "@/components/shared/toast-provider";
import {
  deleteCustomerReviewAction,
  moderateCustomerReviewAction,
} from "./actions";

const STATUS_LABELS: Record<
  CustomerReviewRow["status"],
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "بانتظار المراجعة",
    badgeClass: "bg-accent-yellow-50 text-warning",
  },
  approved: {
    label: "منشور للزوار",
    badgeClass: "bg-success/15 text-success",
  },
  hidden: {
    label: "مخفي",
    badgeClass: "bg-surface-muted text-muted-foreground",
  },
  rejected: {
    label: "مرفوض",
    badgeClass: "bg-error/10 text-error",
  },
};

export function ReviewModerationCard({
  review,
}: {
  review: CustomerReviewRow;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<CustomerReviewRow["status"]>(
    review.status,
  );
  const [reviewerName, setReviewerName] = useState(review.reviewer_name);
  const [reviewerAge, setReviewerAge] = useState(review.reviewer_age);
  const [rating, setRating] = useState(String(review.rating));
  const [comment, setComment] = useState(review.comment);
  const [isPending, startTransition] = useTransition();

  const meta = STATUS_LABELS[currentStatus];

  function handleAction(nextStatus: "approved" | "hidden" | "rejected") {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", review.id);
      fd.append("status", nextStatus);
      fd.append("reviewerName", reviewerName);
      fd.append("reviewerAge", reviewerAge);
      fd.append("rating", rating);
      fd.append("comment", comment);

      const res = await moderateCustomerReviewAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: "تعذر تحديث التقييم",
          description: res.error ?? "يرجى مراجعة الحقول والمحاولة مرة أخرى.",
        });
        if (res.requiresLogin) {
          router.push("/admin/login");
        }
        return;
      }

      setCurrentStatus(nextStatus);
      const successMsg =
        nextStatus === "approved"
          ? "تم اعتماد ونشر الرأي للزوار بنجاح!"
          : nextStatus === "hidden"
            ? "تم إخفاء الرأي من الواجهة العامة."
            : "تم رفض الرأي.";

      showToast({
        variant: "success",
        title: successMsg,
      });
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", review.id);
      const res = await deleteCustomerReviewAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? "تعذر حذف التقييم.",
        });
        if (res.requiresLogin) {
          router.push("/admin/login");
        }
        return;
      }
      showToast({
        variant: "success",
        title: "تم حذف التقييم نهائياً.",
      });
      router.refresh();
    });
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <MessageSquareHeart
            className="h-5 w-5 text-primary-500"
            aria-hidden="true"
          />
          <span className="text-sm font-extrabold text-foreground">
            {reviewerName} ({reviewerAge})
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#B76B00]">
            <Star className="h-3.5 w-3.5 fill-[#FFC928] text-[#FFC928]" />
            {rating}/5
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${meta.badgeClass}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            aria-label="اسم صاحب الرأي"
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
          />
          <input
            type="text"
            value={reviewerAge}
            onChange={(e) => setReviewerAge(e.target.value)}
            aria-label="السن"
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            aria-label="التقييم"
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
          />
        </div>

        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-label="نص التعليق"
          className="rounded-xl border border-border bg-background p-3 text-sm text-foreground"
        />

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {currentStatus !== "approved" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction("approved")}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl bg-success px-4 py-1.5 text-xs font-extrabold text-white hover:bg-success/90 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>اعتماد ونشر</span>
              </button>
            )}

            {currentStatus === "approved" ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction("hidden")}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-1.5 text-xs font-bold text-foreground hover:bg-primary-50 disabled:opacity-60"
              >
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إخفاء</span>
              </button>
            ) : (
              currentStatus !== "rejected" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAction("rejected")}
                  className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-error/30 bg-error/5 px-4 py-1.5 text-xs font-bold text-error hover:bg-error/15 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>رفض</span>
                </button>
              )
            )}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-error hover:underline disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>حذف نهائي</span>
          </button>
        </div>
      </div>
    </article>
  );
}
