import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CloudUpload,
  MessageCircle,
  PackageCheck,
  Palette,
  Send,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import { FaqAccordion } from "@/components/shared/faq-accordion";

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [tPage, tHome, cmsData] = await Promise.all([
    getTranslations("pages.howItWorks"),
    getTranslations("home"),
    getPublicCatalogAndCmsData(),
  ]);

  const steps = [
    { num: "1", key: "step1", icon: CloudUpload },
    { num: "2", key: "step2", icon: MessageCircle },
    { num: "3", key: "step3", icon: Palette },
    { num: "4", key: "step4", icon: PackageCheck },
  ] as const;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
      <header className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
          {tPage("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {tPage("subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-xl font-extrabold text-primary-500">
                  {step.num}
                </span>
                <Icon
                  className="h-6 w-6 text-primary-500"
                  aria-hidden="true"
                />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {tHome(`howItWorks.steps.${step.key}.title`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {tHome(`howItWorks.steps.${step.key}.description`)}
              </p>
              <span className="mt-auto pt-2 text-xs font-bold text-success">
                • {tHome(`howItWorks.steps.${step.key}.tag`)}
              </span>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-5">
        <FaqAccordion items={cmsData.faqs} />
      </section>

      <div className="flex justify-center">
        <Link
          href="/order"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span>{tHome("primaryCta")}</span>
        </Link>
      </div>
    </div>
  );
}
