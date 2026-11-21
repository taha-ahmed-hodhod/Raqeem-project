"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  PackageCheck,
  Printer,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { OrderLifecycleStage } from "@/lib/supabase/types";
import {
  RAQEEM_GIFT_AR,
  RAQEEM_GIFT_EN,
  RAQEEM_SLA_AR,
  RAQEEM_SLA_EN,
} from "@/lib/brand";
import {
  trackOrderByReferenceAction,
  type TrackOrderResult,
} from "./track-action";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "received",
    ar: "تم استلام الطلب",
    en: "Request Received",
    icon: PackageCheck,
  },
  {
    key: "confirmed",
    ar: "تم التأكيد",
    en: "Confirmed",
    icon: CheckCircle2,
  },
  {
    key: "printing",
    ar: "طباعة وتجليد",
    en: "Printing & Binding",
    icon: Printer,
  },
  {
    key: "delivered",
    ar: "تم التوصيل",
    en: "Delivered",
    icon: Truck,
  },
] as const;

function mapStageToStepIndex(stage: OrderLifecycleStage): number {
  switch (stage) {
    case "new":
    case "contacted":
      return 0;
    case "confirmed":
    case "designing":
      return 1;
    case "printing":
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

const STAGE_LABELS: Record<
  OrderLifecycleStage,
  { ar: string; en: string }
> = {
  new: { ar: "تم استلام الطلب (بانتظار التواصل)", en: "Request Received (Awaiting Contact)" },
  contacted: { ar: "تم التواصل معك", en: "Contacted" },
  confirmed: { ar: "تم تأكيد الطلب", en: "Order Confirmed" },
  designing: { ar: "جاري الرسم وتصميم الشخصية", en: "Illustrating & Designing" },
  printing: { ar: "قيد الطباعة والتجليد", en: "Printing & Binding" },
  shipped: { ar: "تم الشحن وفي الطريق إليك", en: "Shipped — On the Way" },
  delivered: { ar: "تم التوصيل بنجاح ✓", en: "Delivered Successfully ✓" },
  on_hold: { ar: "معلق مؤقتاً لحين التأكيد", en: "Temporarily On Hold" },
  cancelled: { ar: "تم إلغاء الطلب", en: "Order Cancelled" },
};

export function OrderTrackerClient({
  initialRef = "",
}: {
  initialRef?: string;
}) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [referenceInput, setReferenceInput] = useState(initialRef);
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = initialRef.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await trackOrderByReferenceAction(trimmed);
      setResult(res);
    });
  }, [initialRef]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await trackOrderByReferenceAction(referenceInput);
      setResult(res);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Box */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-[28px] border border-[#E8E1F2] bg-white p-6 shadow-[0_12px_32px_-8px_rgba(99,36,197,0.10)] sm:flex-row sm:items-center sm:p-7"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 start-4 h-5 w-5 -translate-y-1/2 text-[#625B75]"
            aria-hidden="true"
          />
          <input
            type="text"
            dir="ltr"
            required
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            placeholder="RQM-XXXXXXXX"
            aria-label={isAr ? "رقم تتبع الطلب" : "Order tracking reference"}
            className="h-13 w-full rounded-2xl border border-[#E8E1F2] bg-[#FAF8FF] pe-4 ps-12 text-start font-mono text-base font-bold uppercase text-[#241747] focus:border-[#6324c5] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#6324c5] px-7 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#541CA9] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isAr ? "تتبّع الطلب" : "Track Order"}</span>
        </button>
      </form>

      {/* Result State */}
      {result && !result.ok && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[#D92D4B]/30 bg-[#FFF5F7] p-5 text-sm font-bold text-[#D92D4B]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            {result.error === "rate_limited"
              ? isAr
                ? "تم إجراء عدة محاولات بحث خلال فترة قصيرة. يرجى الانتظار دقيقة والمحاولة مرة أخرى."
                : "Too many tracking attempts. Please wait a minute and try again."
              : isAr
                ? "صيغة رقم التتبع غير صحيحة. يجب أن يكون الرقم مثل RQM-XXXXXXXX."
                : "Invalid tracking reference format (expected e.g. RQM-XXXXXXXX)."}
          </p>
        </div>
      )}

      {result && result.ok && !result.found && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[#FFC928]/50 bg-[#FFFDF2] p-5 text-sm font-bold text-[#B76B00]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            {isAr
              ? "لم نتمكن من العثور على طلب بهذا الرقم. يرجى التأكد من نسخ رقم التتبع بشكل صحيح من رسالة تأكيد الطلب."
              : "No order found with this reference. Please double-check the tracking code from your confirmation screen."}
          </p>
        </div>
      )}

      {result && result.ok && result.found && (
        <div className="flex flex-col gap-6 rounded-[28px] border border-[#E8E1F2] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1F2] pb-4">
            <div>
              <span className="text-xs font-bold text-[#625B75]">
                {isAr ? "مرجع الطلب:" : "Order Reference:"}
              </span>
              <p dir="ltr" className="font-mono text-xl font-black text-[#6324c5]">
                {result.reference}
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-[#F3EAFF] px-3 py-1 text-xs font-extrabold text-[#6324c5]">
                {isAr ? "الحالة الحالية: " : "Current Stage: "}
                {isAr
                  ? (STAGE_LABELS[result.lifecycleStage]?.ar ?? result.lifecycleStage)
                  : (STAGE_LABELS[result.lifecycleStage]?.en ?? result.lifecycleStage)}
              </span>
            </div>

            {result.updatedAt && (
              <span className="text-xs font-semibold text-[#625B75]">
                {isAr ? "آخر تحديث: " : "Last updated: "}
                {new Date(result.updatedAt).toLocaleDateString(
                  isAr ? "ar-EG" : "en-US",
                  { dateStyle: "medium" },
                )}
              </span>
            )}
          </div>

          {/* Masked Customer Name & Masked Phone (privacy-safe verification) */}
          {(result.maskedCustomerName || result.maskedPhone) && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E8E1F2] bg-[#FAF8FF] p-4 sm:grid-cols-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-[#625B75]">
                  {isAr ? "صاحب الطلب:" : "Order Holder:"}
                </span>
                <span className="text-sm font-extrabold text-[#241747]">
                  {result.maskedCustomerName}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-[#625B75]">
                  {isAr ? "رقم الهاتف:" : "Phone Number:"}
                </span>
                <span
                  dir="ltr"
                  className="w-fit font-mono text-sm font-extrabold text-[#241747]"
                >
                  {result.maskedPhone}
                </span>
              </div>
            </div>
          )}

          {result.lifecycleStage === "cancelled" ? (
            <div className="flex items-center gap-3 rounded-2xl bg-[#FFF5F7] p-5 text-[#D92D4B]">
              <XCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-base font-extrabold">
                  {isAr ? "تم إلغاء الطلب" : "Order Cancelled"}
                </p>
                <p className="text-xs text-[#625B75]">
                  {isAr
                    ? "إذا كان لديك استفسار يمكنك التواصل مع فريق رقيم عبر واتساب."
                    : "If you have any questions, please reach out to our team on WhatsApp."}
                </p>
              </div>
            </div>
          ) : result.lifecycleStage === "on_hold" ? (
            <div className="flex items-center gap-3 rounded-2xl bg-[#FFF9DE] p-5 text-[#B76B00]">
              <Clock className="h-7 w-7 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-base font-extrabold">
                  {isAr
                    ? "الطلب معلق مؤقتاً لحين تأكيد التفاصيل"
                    : "Order Temporarily On Hold"}
                </p>
                <p className="text-xs text-[#625B75]">
                  {isAr
                    ? "سيتواصل معك فريق رقيم لاستكمال التفاصيل ومتابعة التنفيذ."
                    : "The Raqeem team will contact you to finalize details and resume production."}
                </p>
              </div>
            </div>
          ) : (
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {STEPS.map((step, idx) => {
                const currentIdx = mapStageToStepIndex(result.lifecycleStage);
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const Icon = step.icon;

                return (
                  <li
                    key={step.key}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all",
                      isCurrent
                        ? "border-[#6324c5] bg-[#F3EAFF] shadow-xs"
                        : isDone
                          ? "border-[#16875D]/30 bg-[#16875D]/5"
                          : "border-[#E8E1F2] bg-[#FAF8FF] opacity-65",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full",
                        isCurrent
                          ? "bg-[#6324c5] text-white"
                          : isDone
                            ? "bg-[#16875D] text-white"
                            : "bg-[#E8E1F2] text-[#625B75]",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-extrabold text-[#241747]">
                      {isAr ? step.ar : step.en}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* SLA & Gift Reminders */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E8E1F2] bg-white p-4 text-xs font-extrabold text-[#241747]">
          <Clock className="h-5 w-5 shrink-0 text-[#6324c5]" aria-hidden="true" />
          <span>{isAr ? RAQEEM_SLA_AR : RAQEEM_SLA_EN}</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#FFC928]/40 bg-[#FFF9DE] p-4 text-xs font-extrabold text-[#B76B00]">
          <Gift className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{isAr ? `مع كل أوردر ${RAQEEM_GIFT_AR}` : RAQEEM_GIFT_EN}</span>
        </div>
      </div>
    </div>
  );
}
