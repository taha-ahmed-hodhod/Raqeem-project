"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, Heart, Lightbulb, Sparkles, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { PortfolioShowcaseItem } from "@/features/portfolio/portfolio-data";

interface PortfolioFilterGridProps {
  items: PortfolioShowcaseItem[];
}

/**
 * Single-Image Story Cards + Animated Accessible Case Study Popup.
 * - Each card displays ONE admin-uploaded cover image + title + short summary.
 * - Clicking a card opens an animated Case Study Popup (interests, story idea, hero transformation).
 * - Supports Escape key, backdrop click, explicit close button, and focus restoration.
 */
export function PortfolioFilterGrid({ items }: PortfolioFilterGridProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [selectedItem, setSelectedItem] =
    useState<PortfolioShowcaseItem | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selectedItem) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
            setSelectedItem(null);
      }
    };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

            return () => {
              document.body.style.overflow = previousOverflow;
              document.removeEventListener("keydown", handleKeyDown);
              triggerButtonRef.current?.focus();
            };
          }, [selectedItem]);

          return (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const title = isAr ? item.titleAr : item.titleEn;
                const summary = isAr ? item.shortSummaryAr : item.shortSummaryEn;

                return (
                    <button
              key={item.id}
                    type="button"
                    onClick={(e) => {
                      triggerButtonRef.current = e.currentTarget;
                      setSelectedItem(item);
                    }}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[#E8E1F2] bg-white text-start shadow-[0_8px_24px_-6px_rgba(36,23,71,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#6324c5]/40 hover:shadow-[0_18px_40px_-10px_rgba(99,36,197,0.16)]"
                  >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F5FF]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.originalPhotoUrl}
                            alt={title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#6324c5] shadow-sm backdrop-blur-sm">
                            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{isAr ? "اقرأ قصة العمل" : "Read Case Study"}</span>
                          </span>
                        </div>

                            <div className="flex flex-1 flex-col gap-2 p-5">
                              <h3 className="text-[19px] leading-[1.4] font-extrabold text-[#241747] transition-colors group-hover:text-[#6324c5]">
                                {title}
                              </h3>
                              <p className="line-clamp-2 text-[14px] leading-[1.7] text-[#625B75]">
                                {summary}
                              </p>
                            </div>
                          </button>
                          );
        })}
                        </div>

                        {/* Animated Accessible Case Study Popup */}
                        {selectedItem && (
                          <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="case-study-modal-title"
                            className="raqeem-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-[#241747]/55 p-4 backdrop-blur-xs"
                            onClick={(e) => {
                              if (e.target === e.currentTarget) {
                                setSelectedItem(null);
                              }
                            }}
                          >
                            <div className="raqeem-modal-panel relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#E8E1F2] bg-white shadow-2xl">
                              {/* Close Button */}
                              <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={() => setSelectedItem(null)}
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
                                    src={selectedItem.originalPhotoUrl}
                                    alt={isAr ? selectedItem.titleAr : selectedItem.titleEn}
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
                                      {isAr ? selectedItem.titleAr : selectedItem.titleEn}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium text-[#625B75]">
                                      {isAr
                                        ? selectedItem.shortSummaryAr
                                        : selectedItem.shortSummaryEn}
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
                                              {isAr
                                            ? selectedItem.storyInterestsAr
                        : selectedItem.storyInterestsEn}
                                          </p>
                                        </div>

                                        <div className="rounded-2xl border border-[#E8E1F2] bg-[#FFFDF2] p-4">
                                          <div className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#B76B00]">
                                            <Lightbulb
                                              className="h-4 w-4 shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {isAr
                                                ? "كيف حوّلناها إلى فكرة؟"
                                                : "How did we turn it into a story idea?"}
                                            </span>
                                          </div>
                                          <p className="text-sm leading-relaxed text-[#4a4454]">
                                            {isAr
                                              ? selectedItem.storyIdeaAr
                                              : selectedItem.storyIdeaEn}
                                          </p>
                                        </div>

                                        <div className="rounded-2xl border border-[#E8E1F2] bg-[#FFF5FA] p-4">
                                          <div className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-[#b02360]">
                                            <Sparkles
                                              className="h-4 w-4 shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {isAr
                                                ? "وكيف أصبح بطل القصة؟"
                                                : "And how did they become the story hero?"}
                                            </span>
                                          </div>
                                          <p className="text-sm leading-relaxed text-[#4a4454]">
                                            {isAr
                                              ? selectedItem.storyHeroAr
                                              : selectedItem.storyHeroEn}
                                          </p>
                                        </div>
                                      </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedItem(null)}
                                            className="min-h-[44px] cursor-pointer rounded-xl border border-[#E8E1F2] bg-white px-5 py-2 text-sm font-bold text-[#625B75] hover:bg-[#F8F5FF]"
                                          >
                                      {isAr ? "إغلاق" : "Close"}
                                    </button>
                                    <Link
                                      href="/order"
                                      onClick={() => setSelectedItem(null)}
                                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#6324c5] px-6 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#541CA9]"
                                    >
                                      {isAr ? "اطلب كتاباً مشابهاً الآن" : "Request a Similar Book"}
                                    </Link>
                                  </div>
                                </div>
                              </div>
                          </div>
        </div>
      )}
                  </div>
                );
              }
