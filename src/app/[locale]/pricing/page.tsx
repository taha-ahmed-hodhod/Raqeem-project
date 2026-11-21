import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import { PackagesGrid } from "@/components/shared/packages-grid";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const [tPage, cmsData] = await Promise.all([
    getTranslations("pages.pricing"),
    getPublicCatalogAndCmsData(),
  ]);

  return (
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
        <header className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
            {tPage("title")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {tPage("subtitle")}
          </p>
        </header>

        <PackagesGrid
          locale={typedLocale}
          bookVariants={cmsData.bookVariants}
          promotions={cmsData.promotions}
        />
      </div>
      );
}
