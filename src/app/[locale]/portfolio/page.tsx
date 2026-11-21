import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedPortfolioItems } from "@/features/portfolio/portfolio-data";
import { PortfolioFilterGrid } from "@/components/shared/portfolio-filter-grid";

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, items] = await Promise.all([
    getTranslations("pages.portfolio"),
    getPublishedPortfolioItems(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <PortfolioFilterGrid items={items} />
    </div>
  );
}
