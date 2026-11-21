import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("pages.about");
  const tHome = await getTranslations("home");

  const values = [
    {
      title: t("v1Title"),
      body: t("v1Body"),
      icon: BookOpen,
      bg: "bg-primary-50 text-primary-500",
    },
    {
      title: t("v2Title"),
      body: t("v2Body"),
      icon: ShieldCheck,
      bg: "bg-accent-yellow-50 text-warning",
    },
    {
      title: t("v3Title"),
      body: t("v3Body"),
      icon: MessageCircle,
      bg: "bg-secondary-pink-50 text-secondary-pink",
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-12 md:px-6 lg:px-10 lg:py-16">
      {/* Hero Banner */}
      <section className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-border bg-surface p-6 shadow-2xs md:p-10 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
            {t("title")}
          </h1>
          <p className="text-lg leading-relaxed font-medium text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="pt-2">
            <h2 className="text-xl font-bold text-primary-600">
              {t("storyTitle")}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              {t("storyBody")}
            </p>
          </div>
          <div className="pt-3">
            <Link
              href="/order"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{tHome("primaryCta")}</span>
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-primary-50/60 p-3 shadow-xs">
            <Image
              src="/images/hero-child-coloring-1.png"
              alt={t("title")}
              width={440}
              height={440}
              className="h-auto w-full rounded-xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-extrabold text-foreground lg:text-3xl">
          {t("valuesTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${v.bg}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
