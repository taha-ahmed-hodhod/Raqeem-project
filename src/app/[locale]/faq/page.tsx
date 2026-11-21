import { getTranslations, setRequestLocale } from "next-intl/server";
import { Send } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import { FaqAccordion } from "@/components/shared/faq-accordion";

export const dynamic = "force-dynamic";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tPage, tHome, cmsData] = await Promise.all([
    getTranslations("pages.faq"),
    getTranslations("home"),
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

      <div className="max-w-3xl">
        <FaqAccordion items={cmsData.faqs} />
      </div>

      <div className="pt-2">
        <Link
          href="/order"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>{tHome("primaryCta")}</span>
        </Link>
      </div>
    </div>
  );
}
