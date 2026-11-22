"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { PortfolioShowcaseItem } from "@/features/portfolio/portfolio-data";
import { BookCoverFrame, WoodenShelfPlank } from "./portfolio-book-frame";
import { PortfolioCaseStudyModal } from "./portfolio-case-study-modal";
import { cn } from "@/lib/utils";

interface PortfolioBookshelfSectionProps {
  items: PortfolioShowcaseItem[];
}

export function PortfolioBookshelfSection({
  items,
}: PortfolioBookshelfSectionProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<PortfolioShowcaseItem | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const count = items.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;

  const navigateTo = useCallback(
    (nextIdx: number) => {
      if (count <= 1) return;
      const normalized = ((nextIdx % count) + count) % count;
      if (normalized === safeIndex) return;
      setPreviousIndex(safeIndex);
      setActiveIndex(normalized);
    },
    [count, safeIndex],
  );

  const goNext = useCallback(() => {
    navigateTo(safeIndex + 1);
  }, [navigateTo, safeIndex]);

  const goPrev = useCallback(() => {
    navigateTo(safeIndex - 1);
  }, [navigateTo, safeIndex]);

  const openItem = useCallback(
    (item: PortfolioShowcaseItem, el: HTMLElement | null) => {
      triggerRef.current = el;
      setSelectedItem(item);
    },
    [],
  );

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (count <= 1) return;
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    setIsDragging(true);
    setDragOffsetPx(0);
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (count <= 1 || touchStartXRef.current === null) return;
    const currentX = e.touches[0]?.clientX;
    if (typeof currentX !== "number") return;
    const rawDelta = currentX - touchStartXRef.current;
    // Soft rubber-band drag feedback
    const damped = Math.max(-56, Math.min(56, rawDelta * 0.35));
    setDragOffsetPx(damped);
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (count <= 1) return;
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(0);

    if (startX !== null && endX !== null) {
      const deltaX = endX - startX;
      if (Math.abs(deltaX) > 38) {
        if (isAr) {
          // RTL: swiping right brings the left/next book into center; swiping left brings right/prev book
          if (deltaX > 0) goNext();
          else goPrev();
        } else {
          // LTR: swiping left advances to next; swiping right goes to prev
          if (deltaX < 0) goNext();
          else goPrev();
        }
      }
    }
  }

  if (count === 0) {
    return null;
  }

  const activeMobileItem = items[safeIndex] ?? items[0];

  // Desktop: max 3 books centered neatly on a single wooden shelf row
  const desktopWrapperClass =
    count === 1
      ? "max-w-md"
      : count === 2
        ? "max-w-4xl"
        : "max-w-6xl";

  const desktopGridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  /**
   * Computes relative slot for each persistently-mounted mobile book:
   *  0  -> Active center upright (scale 1.0, rotateY 0deg, zIndex 30)
   * -1  -> Previous side book (scale 0.85, tilted inward toward center)
   * +1  -> Next side book (scale 0.85, tilted inward toward center)
   */
  function getMobileSlot(idx: number): -1 | 0 | 1 | 2 {
    if (idx === safeIndex) return 0;
    if (count === 2) return 1;
    const prevIdx = (safeIndex - 1 + count) % count;
    const nextIdx = (safeIndex + 1) % count;
    if (idx === prevIdx) return -1;
    if (idx === nextIdx) return 1;
    return 2;
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Section Heading: "أبطال من عالم رقيم" */}
      <div className="mb-10 flex flex-col items-center text-center sm:mb-12">
        <div className="flex items-center justify-center gap-2.5">
          <Sparkles
            className="h-5 w-5 shrink-0 text-[#FFC928]"
            aria-hidden="true"
          />
          <h2 className="text-[28px] leading-[1.3] font-extrabold text-[#43158C] sm:text-[38px] lg:text-[42px]">
            {isAr ? "أبطال من عالم رقيم" : "Heroes from Raqeem's World"}
          </h2>
          <Sparkles
            className="h-5 w-5 shrink-0 text-[#FFC928]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ================= DESKTOP VIEW (1–3 printed books standing on one wooden shelf) ================= */}
      <div className="hidden w-full flex-col items-center md:flex">
        <div className={cn("mx-auto w-full", desktopWrapperClass)}>
          {/* Books resting on uniform baseline */}
          <div
            className={cn(
              "grid items-end gap-8 px-8 lg:gap-10 lg:px-12",
              desktopGridClass,
            )}
          >
            {items.map((item) => {
              const title = isAr ? item.titleAr : item.titleEn;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => openItem(item, e.currentTarget)}
                  aria-label={
                    isAr ? `افتح قصة ${title}` : `Open story ${title}`
                  }
                  className="w-full cursor-pointer text-start transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6324C5] focus-visible:ring-offset-4 motion-reduce:transition-none"
                >
                  <BookCoverFrame imageUrl={item.originalPhotoUrl} alt={title} />
                </button>
              );
            })}
          </div>

          {/* Continuous honey-wood shelf plank directly under the books */}
          <WoodenShelfPlank className="-mt-[3px]" />

          {/* Titles, short summaries, and "اقرأ القصة" links aligned under each book */}
          <div
            className={cn(
              "mt-6 grid gap-8 px-6 text-center lg:gap-10 lg:px-8",
              desktopGridClass,
            )}
          >
            {items.map((item) => {
              const title = isAr ? item.titleAr : item.titleEn;
              const summary = isAr ? item.shortSummaryAr : item.shortSummaryEn;

              return (
                <div
                  key={`meta-${item.id}`}
                  className="flex flex-col items-center gap-2"
                >
                  <h3 className="text-[20px] leading-[1.35] font-extrabold text-[#3B126E] lg:text-[22px]">
                    {title}
                  </h3>
                  <p className="line-clamp-2 max-w-[260px] text-[14px] leading-[1.7] font-medium text-[#625B75]">
                    {summary}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => openItem(item, e.currentTarget)}
                    className="mt-1 inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 border-b-2 border-[#6324C5]/60 pb-0.5 text-[15px] font-extrabold text-[#6324C5] transition-colors hover:border-[#43158C] hover:text-[#43158C]"
                  >
                    <span>{isAr ? "اقرأ القصة" : "Read Story"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= MOBILE VIEW (3-Book 3D Perspective Shelf Stage + 450ms Smooth Coverflow) ================= */}
      <div
        className="flex w-full max-w-full flex-col items-center overflow-hidden touch-pan-y md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartXRef.current = null;
          setIsDragging(false);
          setDragOffsetPx(0);
        }}
      >
        {/* Fixed-height 3D stage on top of stationary wooden shelf */}
        <div className="relative w-full max-w-[390px] overflow-hidden pt-2">
          <div
            className="relative mx-auto h-[205px] w-full sm:h-[220px]"
            style={{
              perspective: "1100px",
              transform: isDragging
                ? `translate3d(${dragOffsetPx}px, 0, 0)`
                : "translate3d(0, 0, 0)",
              transition: isDragging
                ? "none"
                : "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {items.map((item, idx) => {
              const slot = getMobileSlot(idx);
              if (slot === 2) return null;

              const title = isAr ? item.titleAr : item.titleEn;
              const isCenter = slot === 0;
              const isOutgoing = previousIndex === idx && !isCenter;

              // RTL: prev (-1) sits to the RIGHT (+X), next (+1) sits to the LEFT (-X).
              // LTR: prev (-1) sits to the LEFT (-X), next (+1) sits to the RIGHT (+X).
              const sideDirection =
                slot === -1 ? (isAr ? 1 : -1) : slot === 1 ? (isAr ? -1 : 1) : 0;

              // Side books sit at 85% scale behind center, tilted slightly inward toward center
              const translateXPercent = sideDirection * 56;
              const rotateYDeg = sideDirection * -20;
              const scaleVal = isCenter ? 1 : 0.85;
              const zIndexVal = isCenter ? 30 : isOutgoing ? 20 : 12;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    if (isCenter) {
                      openItem(item, e.currentTarget);
                    } else {
                      navigateTo(idx);
                    }
                  }}
                  aria-label={
                    isCenter
                      ? isAr
                        ? `افتح قصة ${title}`
                        : `Open story ${title}`
                      : isAr
                        ? `عرض ${title}`
                        : `View ${title}`
                  }
                  aria-current={isCenter ? "true" : undefined}
                  className={cn(
                    "absolute bottom-0 left-1/2 w-[62%] max-w-[235px] origin-bottom cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6324C5]",
                    "transition-[transform,opacity,filter] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-150",
                  )}
                  style={{
                    zIndex: zIndexVal,
                    opacity: isCenter ? 1 : 0.96,
                    filter: isCenter ? "brightness(1)" : "brightness(0.95)",
                    transform: `translate3d(calc(-50% + ${translateXPercent}%), 0px, ${isCenter ? 0 : -40}px) scale(${scaleVal}) rotateY(${rotateYDeg}deg)`,
                  }}
                >
                  <BookCoverFrame imageUrl={item.originalPhotoUrl} alt={title} />
                </button>
              );
            })}
          </div>

          {/* Stationary honey-wood shelf plank */}
          <div className="px-2">
            <WoodenShelfPlank className="-mt-[3px]" />
          </div>
        </div>

        {/* Reserved-height active book details (synced by activeMobileItem.id, zero layout jump) */}
        {activeMobileItem && (
          <div
            key={activeMobileItem.id}
            className="mt-5 flex min-h-[132px] max-w-xs flex-col items-center justify-start gap-1.5 px-4 text-center"
          >
            <h3 className="text-[22px] leading-[1.35] font-extrabold text-[#3B126E]">
              {isAr ? activeMobileItem.titleAr : activeMobileItem.titleEn}
            </h3>
            <p className="line-clamp-2 text-[14px] leading-[1.7] font-medium text-[#625B75]">
              {isAr
                ? activeMobileItem.shortSummaryAr
                : activeMobileItem.shortSummaryEn}
            </p>
            <button
              type="button"
              onClick={(e) => openItem(activeMobileItem, e.currentTarget)}
              className="mt-1 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 border-b-2 border-[#6324C5]/65 pb-0.5 text-[15px] font-extrabold text-[#6324C5]"
            >
              <span>{isAr ? "اقرأ القصة" : "Read Story"}</span>
            </button>
          </div>
        )}

        {/* Arrows + Pagination Dots row (hidden when <= 1 book) */}
        {count > 1 && (
          <div className="mt-2 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={goPrev}
              aria-label={isAr ? "الكتاب السابق" : "Previous book"}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#6324C5] text-white shadow-[0_6px_16px_-4px_rgba(99,36,197,0.45)] transition-transform hover:scale-105 hover:bg-[#541CA9] active:scale-95"
            >
              {isAr ? (
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <div
              className="flex items-center justify-center gap-2.5"
              role="tablist"
              aria-label={isAr ? "تنقل بين الأعمال" : "Browse works"}
            >
              {items.map((item, idx) => {
                const isActive = item.id === activeMobileItem?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => navigateTo(idx)}
                    aria-label={
                      isAr
                        ? `عرض ${item.titleAr}`
                        : `View ${item.titleEn}`
                    }
                    className={cn(
                      "h-2.5 w-2.5 cursor-pointer rounded-full transition-all duration-300",
                      isActive
                        ? "scale-125 bg-[#6324C5]"
                        : "bg-[#C9B3EC] hover:bg-[#A685DF]",
                    )}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label={isAr ? "الكتاب التالي" : "Next book"}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#6324C5] text-white shadow-[0_6px_16px_-4px_rgba(99,36,197,0.45)] transition-transform hover:scale-105 hover:bg-[#541CA9] active:scale-95"
            >
              {isAr ? (
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Centered CTA: "المزيد من الأعمال" -> /works */}
      <div className="mt-7 flex justify-center sm:mt-10">
        <Link
          href="/works"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#6324C5] px-9 py-3 text-[16px] font-extrabold text-white shadow-[0_12px_28px_-6px_rgba(99,36,197,0.48)] transition-all hover:-translate-y-0.5 hover:bg-[#541CA9] active:translate-y-0"
        >
          <span>{isAr ? "المزيد من الأعمال" : "More Works"}</span>
        </Link>
      </div>

      {/* Case Study Popup Modal */}
      <PortfolioCaseStudyModal
        item={selectedItem}
        isAr={isAr}
        onClose={() => setSelectedItem(null)}
        restoreFocusRef={triggerRef}
      />
    </div>
  );
}
