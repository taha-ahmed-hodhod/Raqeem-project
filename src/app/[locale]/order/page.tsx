import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import { OrderRequestForm } from "@/features/orders/order-request-form";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pages?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  setRequestLocale(locale);

  const [tOrder, cmsData] = await Promise.all([
    getTranslations("pages.order"),
    getPublicCatalogAndCmsData(),
  ]);

  const initialPageCount = resolvedSearch.pages === "24" ? 24 : 12;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-10 md:px-6 lg:px-10 lg:py-14">
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-600">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{tOrder("title")}</span>
        </div>
        <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
          {tOrder("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {tOrder("subtitle")}
        </p>
      </header>

      <OrderRequestForm
        initialPageCount={initialPageCount}
        bookVariants={cmsData.bookVariants}
        promotions={cmsData.promotions}
        governorates={cmsData.governorates}
      />
    </div>
  );
}
