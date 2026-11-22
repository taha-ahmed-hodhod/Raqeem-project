"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Heart, Lightbulb, Sparkles, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { PortfolioShowcaseItem } from "@/features/portfolio/portfolio-data";

interface PortfolioCaseStudyModalProps {
  item: PortfolioShowcaseItem | null;
  isAr: boolean;
  onClose: () => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

export function PortfolioCaseStudyModal({
  item,
  isAr,
  onClose,
  restoreFocusRef,
}: PortfolioCaseStudyModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!item) return;

    const restoreEl = restoreFocusRef?.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      restoreEl?.focus();
    };
  }, [item, onClose, restoreFocusRef]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-modal-title"
      className="raqeem-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-[#241747]/55 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="raqeem-modal-panel relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#E8E1F2] bg-white shadow-2xl">
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={isAr ? "إغلاق النافذة" : "Close modal"}
          className="absolute top-4 end-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#241747] shadow-md transition-colors hover:bg-[#F3EAFF] hover:text-[#6324c5]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="overflow-y-auto">
          {/* Cover Image */}
          <div className="relative aspect-[16/10] w-full bg-[#F8F5FF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.originalPhotoUrl}
              alt={isAr ? item.titleAr : item.titleEn}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Case Study Content */}
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <h3
                id="case-study-modal-title"
                className="text-2xl font-extrabold text-[#241747]"
              >
                {isAr ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#625B75]">
                {isAr ? item.shortSummaryAr : item.shortSummaryEn}
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="rounded-2xl border border-[#E8E1F2] bg-[#FAF8FF] p-4">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#6324c5]">
                  <Heart className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? "ما اهتمامات صاحب الكتاب؟"
                      : "What were their interests?"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#4a4454]">
                  {isAr ? item.storyInterestsAr : item.storyInterestsEn}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E1F2] bg-[#FFFDF2] p-4">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#B76B00]">
                  <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? "كيف حوّلناها إلى فكرة؟"
                      : "How did we turn it into a story idea?"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#4a4454]">
                  {isAr ? item.storyIdeaAr : item.storyIdeaEn}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E1F2] bg-[#FFF5FA] p-4">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#b02360]">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? "وكيف أصبح بطل القصة؟"
                      : "And how did they become the story hero?"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#4a4454]">
                  {isAr ? item.storyHeroAr : item.storyHeroEn}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] cursor-pointer rounded-xl border border-[#E8E1F2] bg-white px-5 py-2 text-sm font-bold text-[#625B75] hover:bg-[#F8F5FF]"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
              <Link
                href="/order"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#6324c5] px-6 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#541CA9]"
              >
                {isAr ? "اطلب كتاباً مشابهاً الآن" : "Request a Similar Book"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
