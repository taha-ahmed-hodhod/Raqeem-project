import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import {
  DEFAULT_PORTFOLIO_ITEMS,
  getPortfolioItemBySlug,
} from "@/features/portfolio/portfolio-data";

export function generateStaticParams() {
  return DEFAULT_PORTFOLIO_ITEMS.map((item) => ({ slug: item.slug }));
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const [t, tHome, item] = await Promise.all([
    getTranslations("pages.portfolio"),
    getTranslations("home.portfolioSection"),
    getPortfolioItemBySlug(slug),
  ]);

  if (!item) {
    notFound();
  }

  const title = typedLocale === "ar" ? item.titleAr : item.titleEn;
  const childLabel =
    typedLocale === "ar" ? item.childLabelAr : item.childLabelEn;
  const description =
    typedLocale === "ar" ? item.descriptionAr : item.descriptionEn;
  const badgeText =
  typedLocale === "ar" ? item.themeAr : item.themeEn;
  const BackIcon = typedLocale === "ar" ? ArrowRight : ArrowLeft;

  const stages = [
    {
      num: "1",
      label: tHome("stageOriginal"),
      src: item.originalPhotoUrl,
      grayscale: false,
    },
    {
      num: "2",
      label: tHome("stageCartoon"),
      src: item.cartoonImageUrl,
      grayscale: false,
    },
    {
      num: "3",
      label: tHome("stageColoring"),
      src: item.coloringPageUrl,
      grayscale: true,
    },
    {
      num: "4",
      label: t("stage4Mockup"),
      src: item.bookMockupUrl,
      grayscale: false,
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
      <div>
        <Link
          href="/portfolio"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-primary-500 hover:underline"
        >
          <BackIcon className="h-4 w-4" aria-hidden="true" />
          <span>{t("backToPortfolio")}</span>
        </Link>
      </div>

      <section className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 shadow-2xs md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-primary-500">
              {childLabel}
            </span>
            <h1 className="text-[28px] leading-tight font-extrabold text-foreground lg:text-[38px]">
              {title}
            </h1>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${item.isDemo
                ? "bg-accent-yellow-50 text-warning"
                : "bg-success/10 text-success"
              }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{badgeText}</span>
          </span>
        </div>

        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>

        <h2 className="pt-2 text-xl font-bold text-foreground">
          {t("transformationStagesTitle")}
        </h2>

        {/* 4-Stage Transformation Showcase (Photo -> Cartoon -> Line Art -> Printed Book) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => (
            <div
              key={stage.num}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3.5 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500 text-xs font-extrabold text-white">
                  {stage.num}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {stage.label}
                </span>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border/60 bg-surface">
                <Image
                  src={stage.src}
                  alt={`${stage.label} - ${title}`}
                  width={340}
                  height={425}
                  className={`h-full w-full object-cover ${stage.grayscale ? "grayscale contrast-125" : ""
                    }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Link
            href={`/order?pages=${item.pageCount}`}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{t("orderSimilarCta")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
