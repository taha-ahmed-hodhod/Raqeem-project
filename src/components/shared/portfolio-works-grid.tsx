"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { PortfolioShowcaseItem } from "@/features/portfolio/portfolio-data";
import { BookCoverFrame, WoodenShelfPlank } from "./portfolio-book-frame";
import { PortfolioCaseStudyModal } from "./portfolio-case-study-modal";

interface PortfolioWorksGridProps {
  items: PortfolioShowcaseItem[];
}

function chunkItems<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}

/**
 * Full "أعمالنا" (/works) gallery displaying ALL published works using the
 * exact same reusable 3D BookCoverFrame + WoodenShelfPlank template as Homepage.
 */
export function PortfolioWorksGrid({ items }: PortfolioWorksGridProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const [selectedItem, setSelectedItem] =
    useState<PortfolioShowcaseItem | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openItem = useCallback(
    (item: PortfolioShowcaseItem, el: HTMLElement | null) => {
      triggerRef.current = el;
      setSelectedItem(item);
    },
    [],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E8E1F2] bg-white p-12 text-center shadow-xs">
        <p className="text-base font-bold text-[#625B75]">
          {isAr
            ? "سيتم إضافة أحدث أعمال رقيم هنا قريباً."
            : "Raqeem's latest works will appear here soon."}
        </p>
      </div>
    );
  }

  // Group works into clean rows of 3 books per wooden shelf on desktop
  const shelfRows = chunkItems(items, 3);

  return (
    <div className="flex flex-col gap-14">
      {shelfRows.map((rowItems, rowIdx) => (
        <div key={`shelf-row-${rowIdx}`} className="flex flex-col">
          {/* Desktop & Tablet Shelf Row */}
          <div className="hidden md:block">
            <div className="grid grid-cols-3 items-end gap-8 px-8">
              {rowItems.map((item, colIdx) => {
                const title = isAr ? item.titleAr : item.titleEn;
                const globalIdx = rowIdx * 3 + colIdx;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => openItem(item, e.currentTarget)}
                    aria-label={
                      isAr ? `افتح قصة ${title}` : `Open story ${title}`
                    }
                    className="w-full cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6324C5] focus-visible:ring-offset-4"
                  >
                    <BookCoverFrame
                      imageUrl={item.originalPhotoUrl}
                      alt={title}
                      accentIndex={globalIdx}
                    />
                  </button>
                );
              })}
            </div>

            <WoodenShelfPlank className="-mt-1" />

            <div className="mt-6 grid grid-cols-3 gap-8 px-6 text-center">
              {rowItems.map((item) => {
                const title = isAr ? item.titleAr : item.titleEn;
                const summary = isAr ? item.shortSummaryAr : item.shortSummaryEn;

                return (
                  <div
                    key={`meta-${item.id}`}
                    className="flex flex-col items-center gap-2"
                  >
                    <h2 className="text-[20px] leading-[1.35] font-extrabold text-[#3B126E]">
                      {title}
                    </h2>
                    <p className="line-clamp-2 max-w-[260px] text-[14px] leading-[1.7] font-medium text-[#625B75]">
                      {summary}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => openItem(item, e.currentTarget)}
                      className="mt-1 inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 border-b-2 border-[#6324C5]/60 pb-0.5 text-[15px] font-extrabold text-[#6324C5] transition-colors hover:border-[#43158C] hover:text-[#43158C]"
                    >
                      <span>{isAr ? "اقرأ القصة" : "Read Story"}</span>
                      {isAr ? (
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: Each book sits cleanly on its own wooden shelf */}
          <div className="flex flex-col gap-10 md:hidden">
            {rowItems.map((item, colIdx) => {
              const title = isAr ? item.titleAr : item.titleEn;
              const summary = isAr ? item.shortSummaryAr : item.shortSummaryEn;
              const globalIdx = rowIdx * 3 + colIdx;

              return (
                <article
                  key={`mobile-${item.id}`}
                  className="flex flex-col items-center"
                >
                  <div className="w-[80%] max-w-[280px]">
                    <button
                      type="button"
                      onClick={(e) => openItem(item, e.currentTarget)}
                      aria-label={
                        isAr ? `افتح قصة ${title}` : `Open story ${title}`
                      }
                      className="w-full cursor-pointer"
                    >
                      <BookCoverFrame
                        imageUrl={item.originalPhotoUrl}
                        alt={title}
                        accentIndex={globalIdx}
                      />
                    </button>
                  </div>

                  <WoodenShelfPlank className="-mt-1" />

                  <div className="mt-5 flex max-w-xs flex-col items-center gap-1.5 px-3 text-center">
                    <h2 className="text-[20px] leading-[1.35] font-extrabold text-[#3B126E]">
                      {title}
                    </h2>
                    <p className="line-clamp-2 text-[14px] leading-[1.7] font-medium text-[#625B75]">
                      {summary}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => openItem(item, e.currentTarget)}
                      className="mt-1 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 border-b-2 border-[#6324C5]/60 pb-0.5 text-[15px] font-extrabold text-[#6324C5]"
                    >
                      <span>{isAr ? "اقرأ القصة" : "Read Story"}</span>
                      {isAr ? (
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}

      <PortfolioCaseStudyModal
        item={selectedItem}
        isAr={isAr}
        onClose={() => setSelectedItem(null)}
        restoreFocusRef={triggerRef}
      />
    </div>
  );
}
