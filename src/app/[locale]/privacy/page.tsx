import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.privacy");

  const sections = [
    { title: t("s1Title"), body: t("s1Body") },
    { title: t("s2Title"), body: t("s2Body") },
    { title: t("s3Title"), body: t("s3Body") },
    { title: t("s4Title"), body: t("s4Body") },
  ];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-50 px-3.5 py-1 text-xs font-bold text-primary-500">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{t("title")}</span>
        </div>
        <h1 className="text-[28px] leading-tight font-extrabold text-foreground lg:text-[38px]">
          {t("title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {sections.map((sec) => (
          <section
            key={sec.title}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
          >
            <h2 className="text-lg font-extrabold text-foreground">
              {sec.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {sec.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
