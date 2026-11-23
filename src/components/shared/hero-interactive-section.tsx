"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { BookVariantRow } from "@/lib/supabase/types";
import { HeroOpenBookFrame } from "./hero-open-book-frame";
import { cn } from "@/lib/utils";

interface HeroInteractiveSectionProps {
  bookVariants: BookVariantRow[];
  titleOverride?: string;
  subtitleOverride?: string;
  heroImageUrl?: string;
}

const DEFAULT_HERO_IMAGE = "/images/stitch/hero-main.png";

export function HeroInteractiveSection({
  bookVariants,
  titleOverride,
  subtitleOverride,
  heroImageUrl,
}: HeroInteractiveSectionProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const variant12 = bookVariants.find((v) => v.page_count === 12);
  const variant24 = bookVariants.find((v) => v.page_count === 24);
  const price12 = variant12?.price_egp ?? 250;
  const price24 = variant24?.price_egp ?? 350;

  const [selectedPages, setSelectedPages] = useState<12 | 24>(12);
  const resolvedHeroImage =
    heroImageUrl && heroImageUrl.trim().length > 0
      ? heroImageUrl.trim()
      : DEFAULT_HERO_IMAGE;

  const subtitleText =
    subtitleOverride ||
    (isAr
      ? "من صورته واسمه، نصمّم له مغامرة يلوّنها بإيده."
      : "From their photo and name, we craft an adventure they color by hand.");

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#EDE1FF] via-[#F3EAFF] to-[#F8F5FF]">
      {/* Subtle paper-texture ambient light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 35%, rgba(255,255,255,0.6) 0%, transparent 52%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.45) 0%, transparent 48%)",
        }}
      />

      {/* Top-Right Paper-Cut Lavender Cloud (clipped cleanly at section bounds) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 320 120"
        className="pointer-events-none absolute top-0 right-0 z-0 h-auto w-[135px] drop-shadow-[0_6px_12px_rgba(116,74,178,0.12)] sm:w-[215px] lg:w-[300px]"
      >
        <path
          d="M 320,0 L 320,96 C 296,104 268,94 256,74 C 236,92 200,90 184,68 C 162,82 128,74 118,50 C 94,58 64,46 58,22 C 42,26 24,18 16,0 Z"
          fill="#FAF5FF"
        />
        <path
          d="M 320,0 L 320,82 C 298,88 274,80 264,62 C 246,76 216,74 202,56 C 182,68 152,62 142,42 C 122,48 96,38 90,18 C 76,22 60,14 54,0 Z"
          fill="#F4EBFF"
          opacity="0.7"
        />
      </svg>

      {/* Top-Left Paper-Cut Lavender Cloud (clipped cleanly at section bounds) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 320 120"
        className="pointer-events-none absolute top-0 left-0 z-0 h-auto w-[135px] drop-shadow-[0_6px_12px_rgba(116,74,178,0.12)] sm:w-[215px] lg:w-[300px]"
      >
        <path
          d="M 0,0 L 0,96 C 24,104 52,94 64,74 C 84,92 120,90 136,68 C 158,82 192,74 202,50 C 226,58 256,46 262,22 C 278,26 296,18 304,0 Z"
          fill="#FAF5FF"
        />
        <path
          d="M 0,0 L 0,82 C 22,88 46,80 56,62 C 74,76 104,74 118,56 C 138,68 168,62 178,42 C 198,48 224,38 230,18 C 244,22 260,14 266,0 Z"
          fill="#F4EBFF"
          opacity="0.7"
        />
      </svg>

      {/* Hero Content Container */}
      <section
        id="hero-section"
        className="relative z-10 mx-auto max-w-7xl px-5 pt-10 pb-14 sm:px-8 sm:pt-12 lg:px-10 lg:py-16"
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Column 1 (RTL Right on Desktop, Below image on Mobile): Headline, Subtitle, 12/24 Pills, CTA & Portfolio Link */}
          <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:col-span-6">
            {/* Main Heading with Yellow Crayon Underline under "بطل" (or custom Admin override) */}
            <h1 className="max-w-[16ch] text-[34px] leading-[1.3] font-black tracking-tight text-[#4B127A] sm:max-w-none sm:text-[42px] lg:text-[48px]">
              {titleOverride ? (
                titleOverride
              ) : isAr ? (
                <>
                  طفلك{" "}
                  <span className="relative inline-block">
                    <span>بطل</span>
                    {/* Hand-drawn golden crayon underline */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 18"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -bottom-1.5 left-0 h-3 w-full"
                    >
                      <path
                        d="M 4,12 C 32,6 84,5 116,10"
                        fill="none"
                        stroke="#FFC928"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{" "}
                  كتاب التلوين
                </>
              ) : (
                <>
                  Your Child Is the{" "}
                  <span className="relative inline-block">
                    <span>Hero</span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 18"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -bottom-1.5 left-0 h-3 w-full"
                    >
                      <path
                        d="M 4,12 C 32,6 84,5 116,10"
                        fill="none"
                        stroke="#FFC928"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{" "}
                  of Their Coloring Book
                </>
              )}
            </h1>

            {/* Concise Subtitle */}
            <p className="mt-4 max-w-md text-[16px] leading-[1.7] font-bold text-[#523970] sm:text-[18px]">
              {subtitleText}
            </p>

            {/* Interactive 12 / 24 Pages Package Selector Pills (Live DB Prices) */}
            <div
              role="radiogroup"
              aria-label={isAr ? "اختيار عدد الصفحات" : "Choose page count"}
              className="mt-7 grid w-full max-w-[440px] grid-cols-2 gap-3"
            >
              {/* 12 Pages Pill */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedPages === 12}
                onClick={() => setSelectedPages(12)}
                className={cn(
                  "flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-center transition-all sm:px-4",
                  selectedPages === 12
                    ? "border-[#6324C5] bg-[#EFE3FF] text-[#43158C] shadow-[0_6px_18px_-6px_rgba(99,36,197,0.3)]"
                    : "border-[#E5D8F2] bg-[#FFFDF8] text-[#4B2C71] hover:border-[#C7A8F2]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                    selectedPages === 12
                      ? "bg-[#6324C5] text-white"
                      : "border border-[#D5C3EB] bg-white text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="flex flex-col leading-tight sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-[14px] font-extrabold sm:text-[15px]">
                    {isAr ? "12 صفحة" : "12 Pages"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden text-[#9A7BC4] sm:inline"
                  >
                    •
                  </span>
                  <span className="text-[14px] font-black tabular-nums sm:text-[15px]">
                    {price12} {isAr ? "ج.م" : "EGP"}
                  </span>
                </span>
              </button>

              {/* 24 Pages Pill */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedPages === 24}
                onClick={() => setSelectedPages(24)}
                className={cn(
                  "flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-center transition-all sm:px-4",
                  selectedPages === 24
                    ? "border-[#6324C5] bg-[#EFE3FF] text-[#43158C] shadow-[0_6px_18px_-6px_rgba(99,36,197,0.3)]"
                    : "border-[#E5D8F2] bg-[#FFFDF8] text-[#4B2C71] hover:border-[#C7A8F2]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                    selectedPages === 24
                      ? "bg-[#6324C5] text-white"
                      : "border border-[#D5C3EB] bg-white text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="flex flex-col leading-tight sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-[14px] font-extrabold sm:text-[15px]">
                    {isAr ? "24 صفحة" : "24 Pages"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden text-[#9A7BC4] sm:inline"
                  >
                    •
                  </span>
                  <span className="text-[14px] font-black tabular-nums sm:text-[15px]">
                    {price24} {isAr ? "ج.م" : "EGP"}
                  </span>
                </span>
              </button>
            </div>

            {/* Primary CTA Button (routes to /order with selected package pre-filled) */}
            <div className="mt-5 flex w-full max-w-[380px] flex-col items-center gap-3">
              <Link
                href={`/order?pages=${selectedPages}`}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-b from-[#6C1EA6] to-[#4E117C] px-8 py-3 text-[17px] font-extrabold text-white shadow-[0_12px_28px_-6px_rgba(88,24,136,0.48)] transition-all hover:-translate-y-0.5 hover:from-[#7722B5] hover:to-[#5A158E] active:translate-y-0"
              >
                {isAr ? "اطلب كتابك الآن" : "Order Your Book Now"}
              </Link>

              {/* Secondary Underlined Link -> Full Works Gallery */}
              <Link
                href="/works"
                className="inline-flex min-h-[40px] items-center justify-center border-b-2 border-[#6324C5]/60 pb-0.5 text-[15px] font-extrabold text-[#5B1FA8] transition-colors hover:border-[#43158C] hover:text-[#43158C]"
              >
                {isAr ? "شاهد أبطالنا" : "View our Heros"}
              </Link>
            </div>
          </div>

          {/* Column 2 (RTL Left on Desktop, First on Mobile): Open-Book Framed Live Hero Image */}
          <div className="order-1 flex items-center justify-center lg:order-2 lg:col-span-6">
            <HeroOpenBookFrame
              imageUrl={resolvedHeroImage}
              alt={
                isAr
                  ? "طفل يستمتع بكتاب التلوين المخصص من رقيم"
                  : "Child enjoying their personalized Raqeem coloring book"
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
