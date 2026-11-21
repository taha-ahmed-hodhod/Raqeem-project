"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BadgeCheck,
  BookOpen,
  Check,
  Heart,
  Images,
  Palette,
  PartyPopper,
  PenTool,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { BookVariantRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface HeroInteractiveSectionProps {
  bookVariants: BookVariantRow[];
  subtitleOverride?: string;
  heroImageUrl?: string;
}

export function HeroInteractiveSection({
  bookVariants,
  subtitleOverride,
  heroImageUrl,
}: HeroInteractiveSectionProps) {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const variant12 = bookVariants.find((v) => v.page_count === 12);
  const variant24 = bookVariants.find((v) => v.page_count === 24);
  const price12 = variant12?.price_egp ?? 250;
  const price24 = variant24?.price_egp ?? 350;

  const [selectedPages, setSelectedPages] = useState<12 | 24>(12);
  const selectedPrice = selectedPages === 24 ? price24 : price12;

  return (
    <>
      <div className="relative w-full overflow-hidden">
        {/* Top Decorative Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#c6b1f0] opacity-60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 -left-20 h-80 w-80 rounded-full bg-[#ffd9e2]/40 opacity-40 blur-3xl"
        />

        {/* 1. Hero Section */}
        <section
          id="hero-section"
          className="relative mx-auto max-w-7xl px-6 pt-6 pb-16 lg:px-10"
        >
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            {/* Right Column: Hero Content (RTL Leading) */}
            <div className="z-10 flex flex-col gap-4 text-start lg:col-span-6">
              {/* Doodle Tagline */}
              <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#FFF9DE] px-3 py-1 text-[14px] leading-[1.6] font-bold text-[#B76B00] shadow-sm">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("badge")}</span>
              </div>

              {/* Headline with Yellow Marker Highlight */}
              <h1 className="text-[30px] leading-[1.35] font-extrabold tracking-tight text-[#241747] lg:text-[44px] lg:leading-[1.3]">
                {isAr ? (
                  <>
                    مش مجرد كتاب تلوين...
                    <br />
                    طفلك هيبقى{" "}
                  </>
                ) : (
                  t("headlinePrefix")
                )}
                <span className="relative mr-1 inline-block px-2">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 -rotate-1 rounded-md bg-[#FFF9DE] shadow-sm"
                  />
                  <span className="relative text-[#6324c5]">
                    {t("headlineHighlight")}
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-[17px] leading-[1.7] font-medium text-[#625B75] lg:text-[18px]">
                {subtitleOverride ||
                  (isAr
                    ? "حوّل صورة طفلك الحقيقية لكتاب تلوين مخصوص باسمه وملامحه، مليان مغامرات ورسومات يدوية ممتعة، مطبوع بأعلى جودة ورق وبيوصلك لحد باب البيت."
                    : t("subtitle"))}
              </p>

              {/* Trust Chips Row */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[14px] font-medium text-[#241747] shadow-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3EAFF] text-[#6324c5]">
                    <PenTool className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    {isAr ? "تصميم مخصص 100%" : t("trustChips.customDesign")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[14px] font-medium text-[#241747] shadow-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0F6] text-[#b02360]">
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    {isAr
                      ? "طباعة فاخرة سميكة"
                      : t("trustChips.highQualityPrint")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[14px] font-medium text-[#241747] shadow-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2EEFA] text-[#16875D]">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    {isAr
                      ? "أمان تام لصور أطفالنا"
                      : t("trustChips.egyptDelivery")}
                  </span>
                </div>
              </div>

              {/* Quick Selection Card */}
              <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-4px_rgba(99,36,197,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[18px] font-bold text-[#241747]">
                    <BookOpen
                      className="h-5 w-5 shrink-0 text-[#6324c5]"
                      aria-hidden="true"
                    />
                    <span>{t("packageSelector.title")}</span>
                  </div>
                  <span className="text-[12px] font-medium text-[#625B75]">
                    {t("packageSelector.noPrepaymentNote")}
                  </span>
                </div>

                {/* Radio Options */}
                <div
                  role="radiogroup"
                  aria-label={t("packageSelector.title")}
                  id="hero-package-selector"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {/* 12 Pages */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedPages === 12}
                    onClick={() => setSelectedPages(12)}
                    className={cn(
                      "relative flex cursor-pointer items-center justify-between rounded-xl p-3 text-start transition-all",
                      selectedPages === 12
                        ? "bg-[#F3EAFF] shadow-sm"
                        : "bg-[#F2EEFA] hover:bg-[#F3EAFF]/60",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-[21px] leading-[1.4] font-bold text-[#241747]">
                        {t("packageSelector.pages12Title")}
                      </span>
                      <span className="text-[12px] font-medium text-[#625B75]">
                        {isAr
                          ? "مناسب للأعمار من 3 إلى 6 سنوات"
                          : t("packageSelector.pages12Desc")}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn(
                            "text-[26px] leading-[1.4] font-extrabold",
                            selectedPages === 12
                              ? "text-[#6324c5]"
                              : "text-[#241747]",
                          )}
                        >
                          {price12}
                        </span>
                        <span className="text-[12px] font-bold text-[#625B75]">
                          {t("packageSelector.currency")}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "mt-1 flex h-5 w-5 items-center justify-center rounded-full",
                          selectedPages === 12
                            ? "bg-[#6324c5] text-white"
                            : "bg-[#E8E1F2] text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </button>

                  {/* 24 Pages */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedPages === 24}
                    onClick={() => setSelectedPages(24)}
                    className={cn(
                      "relative flex cursor-pointer items-center justify-between rounded-xl p-3 text-start transition-all",
                      selectedPages === 24
                        ? "bg-[#F3EAFF] shadow-sm"
                        : "bg-[#F2EEFA] hover:bg-[#F3EAFF]/60",
                    )}
                  >
                    <span className="absolute -top-2.5 right-4 rounded-full bg-[#b02360] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {isAr ? "الأكثر طلباً ⭐" : "Most Popular ⭐"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[21px] leading-[1.4] font-bold text-[#241747]">
                        {t("packageSelector.pages24Title")}
                      </span>
                      <span className="text-[12px] font-medium text-[#625B75]">
                        {t("packageSelector.pages24Desc")}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn(
                            "text-[26px] leading-[1.4] font-extrabold",
                            selectedPages === 24
                              ? "text-[#6324c5]"
                              : "text-[#241747]",
                          )}
                        >
                          {price24}
                        </span>
                        <span className="text-[12px] font-bold text-[#625B75]">
                          {t("packageSelector.currency")}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "mt-1 flex h-5 w-5 items-center justify-center rounded-full",
                          selectedPages === 24
                            ? "bg-[#6324c5] text-white"
                            : "bg-[#E8E1F2] text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row">
                  <Link
                    href={`/order?pages=${selectedPages}`}
                    className="flex w-full transform items-center justify-center gap-2 rounded-xl bg-[#6324c5] px-6 py-3.5 text-[16px] font-bold text-white shadow-[0_8px_24px_-4px_rgba(99,36,197,0.25)] transition-all hover:bg-[#541CA9] active:translate-y-0.5 active:bg-[#43158C] sm:flex-1"
                  >
                    <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t("primaryCta")}</span>
                  </Link>
                  <a
                    href="#portfolio-section"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2EEFA] px-4 py-3.5 text-[14px] font-bold text-[#241747] transition-colors hover:bg-white sm:w-auto"
                  >
                    <Images className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? "شاهد النماذج" : t("secondaryCta")}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Left Column: Visual Showcase */}
            <div className="relative flex flex-col items-center lg:col-span-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 -right-6 z-10 flex h-16 w-16 -rotate-12 items-center justify-center rounded-full bg-[#FFF9DE] shadow-sm"
              >
                <Palette className="h-8 w-8 text-[#B76B00]" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-16 -left-4 z-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full bg-[#FFF0F6] shadow-sm"
              >
                <Heart className="h-6 w-6 text-[#b02360]" />
              </div>

              <div className="relative w-full max-w-md transform rounded-3xl bg-white p-3 shadow-[0_20px_40px_-8px_rgba(99,36,197,0.14),0_4px_12px_-2px_rgba(36,23,71,0.06)] transition-transform duration-300 hover:rotate-0 lg:rotate-1">
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#ede4ff] shadow-inner">
                  <div className="pointer-events-none relative z-10 flex items-center justify-between p-3">
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1 shadow-md backdrop-blur-md">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#16875D]" />
                      <span className="text-[12px] font-bold text-[#241747]">
                        {t("showcase.liveTag")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-[#FFF9DE] px-2.5 py-1 text-[12px] font-bold text-[#B76B00] shadow-sm">
                      <PartyPopper className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? "إصدار تذكاري خاص"
                          : t("showcase.specialEdition")}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex w-full items-center justify-center px-2 pb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageUrl || "/images/stitch/hero-main.png"}
                      alt="طفل سعيد يلون كتابه المخصص من رقيم"
                      className="aspect-[1/1] max-h-[480px] w-full rounded-xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-1 text-[12px] text-[#625B75]">
                  <div className="flex items-center gap-1.5 font-bold text-[#6324c5]">
                    <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t("showcase.handDrawnCaption")}</span>
                  </div>
                  <span className="rounded-md bg-[#F3EAFF] px-2 py-0.5 font-bold text-[#6324c5]">
                    {t("showcase.paperSpec")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky Request CTA Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8E1F2] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(36,23,71,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#625B75]">
              {selectedPages === 24
                ? t("packageSelector.pages24Title")
                : t("packageSelector.pages12Title")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#6324c5]">
                {selectedPrice}
              </span>
              <span className="text-xs font-bold text-[#6324c5]">
                {isAr ? "ج.م" : "EGP"}
              </span>
            </div>
          </div>

          <Link
            href={`/order?pages=${selectedPages}`}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#6324c5] px-5 py-2.5 text-sm font-bold text-white shadow-sm active:bg-[#43158C]"
          >
            <span>{t("primaryCta")}</span>
            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
