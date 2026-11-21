"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { Gift, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";

const SPEED_PX_PER_SEC = 22;

export function AnnouncementBar() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);

  const [tickerMetrics, setTickerMetrics] = useState<{
    startPx: number;
    endPx: number;
    durationSec: number;
  }>({
    startPx: 420,
    endPx: -420,
    durationSec: 38,
  });

  useEffect(() => {
    const containerEl = containerRef.current;
    const itemEl = itemRef.current;
    if (!containerEl || !itemEl) return;

    const updateMetrics = () => {
      const containerWidth = containerEl.getBoundingClientRect().width;
      const itemWidth = itemEl.getBoundingClientRect().width;
      if (containerWidth > 0 && itemWidth > 0) {
        const totalDistance = containerWidth + itemWidth;
        const durationSec = Number(
          Math.max(10, totalDistance / SPEED_PX_PER_SEC).toFixed(2),
        );
        setTickerMetrics({
          startPx: Math.ceil(containerWidth),
          endPx: -Math.ceil(itemWidth),
          durationSec,
        });
      }
    };

    updateMetrics();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateMetrics);
      observer.observe(containerEl);
      observer.observe(itemEl);
      return () => observer.disconnect();
    }
  }, [isAr]);

  const firstMsg = isAr
    ? "كتاب تلوين مخصوص لطفلك"
    : "Personalized coloring book for your child";
  const secondMsg = isAr
    ? "توصيل لكل محافظات مصر"
    : "Delivery across all of Egypt";

  const tickerStyle = {
    "--raqeem-ticker-start": `${tickerMetrics.startPx}px`,
    "--raqeem-ticker-end": `${tickerMetrics.endPx}px`,
    animationDuration: `${tickerMetrics.durationSec}s`,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={isAr ? "إعلانات رقيم" : "Raqeem announcements"}
      className="relative flex h-9 w-full max-w-full items-center overflow-hidden bg-[#4B149E] text-white select-none"
    >
      {/* Single non-repeating message gliding smoothly Right -> Left at ~22px/s */}
      <div
        dir="ltr"
        className="flex w-full items-center overflow-hidden motion-reduce:hidden"
      >
        <div
          ref={itemRef}
          dir={isAr ? "rtl" : "ltr"}
          className="raqeem-marquee-single items-center gap-4 px-2 sm:gap-6"
          style={tickerStyle}
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] leading-none font-bold text-white sm:text-[14px]">
            <Gift
              className="h-4 w-4 shrink-0 text-[#FFC928]"
              aria-hidden="true"
            />
            <span>{firstMsg}</span>
          </span>

          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B48CF2]"
          />

          <span className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] leading-none font-bold text-white sm:text-[14px]">
            <Truck
              className="h-4 w-4 shrink-0 text-[#FFC928]"
              aria-hidden="true"
            />
            <span>{secondMsg}</span>
          </span>
        </div>
      </div>

      {/* Static accessible fallback when prefers-reduced-motion is enabled */}
      <div className="hidden w-full items-center justify-center gap-3 px-4 motion-reduce:flex">
        <span className="inline-flex items-center gap-1.5 truncate text-[14px] font-bold text-white">
          <Gift
            className="h-4 w-4 shrink-0 text-[#FFC928]"
            aria-hidden="true"
          />
          <span>{firstMsg}</span>
        </span>
        <span
          aria-hidden="true"
          className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-[#B48CF2] sm:inline-block"
        />
        <span className="hidden items-center gap-1.5 truncate text-[14px] font-bold text-white sm:inline-flex">
          <Truck
            className="h-4 w-4 shrink-0 text-[#FFC928]"
            aria-hidden="true"
          />
          <span>{secondMsg}</span>
        </span>
      </div>
    </div>
  );
}
