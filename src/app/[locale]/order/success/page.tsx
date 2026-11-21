import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, MessageCircle, Palette, Truck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { RAQEEM_SLA_AR, RAQEEM_SLA_EN } from "@/lib/brand";
import { CopyReferenceButton } from "@/components/shared/copy-reference-button";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  setRequestLocale(locale);
  const isAr = (locale as Locale) === "ar";

  const t = await getTranslations("pages.orderSuccess");
  const safeRef =
    resolvedSearch.ref && /^RQM-[A-Z0-9-]{4,24}$/.test(resolvedSearch.ref)
      ? resolvedSearch.ref
      : null;

  const nextSteps = [
    {
      icon: MessageCircle,
      title: isAr
        ? "1. تواصل عبر واتساب أو الهاتف"
        : "1. Contact via WhatsApp or Phone",
      desc: isAr
        ? "يتواصل معك فريق رقيم لمراجعة صورة الطفل وتفاصيل القصة وتأكيد السعر ومصاريف الشحن لمحافظتك."
        : "Our team contacts you to review the photo and story details and confirm the final price and shipping fee.",
    },
    {
      icon: Palette,
      title: isAr
        ? "2. الرسم اليدوي والطباعة"
        : "2. Custom Illustration & Printing",
      desc: isAr
        ? "يرسم فنانو رقيم ملامح طفلك كبطل للقصة ويُطبع الكتاب على ورق سميك 150 جرام بتجليد سلك متين."
        : "Raqeem artists illustrate your child as the hero and print the book on thick 150gsm spiral-bound paper.",
    },
    {
      icon: Truck,
      title: isAr ? "3. التوصيل لباب البيت" : "3. Home Delivery",
      desc: isAr
        ? "يصلك الكتاب المطبوع مغلفاً بعناية حتى باب منزلك."
        : "Your finished printed book is delivered safely to your doorstep.",
    },
  ];

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center gap-8 px-4 py-14 text-center md:px-6 lg:py-20">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-8 shadow-sm md:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
        </div>

        <h1 className="text-2xl leading-relaxed font-extrabold text-foreground md:text-3xl">
          {t("title")}
        </h1>

        {safeRef && (
          <div
            data-testid="order-reference-box"
            className="flex flex-col items-center gap-3 rounded-2xl border border-primary-500/30 bg-primary-50/70 px-6 py-4 text-sm font-bold text-foreground shadow-2xs"
          >
              <div>
                <span className="text-muted-foreground">{t("referenceLabel")} </span>
                <span
                  dir="ltr"
                  className="font-mono text-lg font-extrabold text-primary-600"
                >
                  {safeRef}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <CopyReferenceButton reference={safeRef} isAr={isAr} />
                <Link
                  href={`/track?ref=${encodeURIComponent(safeRef)}`}
                  className="inline-flex min-h-[38px] items-center rounded-xl bg-primary-500 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-primary-600"
                >
                  {isAr ? "تتبّع حالة طلبك" : "Track Your Order"}
                </Link>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {isAr ? RAQEEM_SLA_AR : RAQEEM_SLA_EN}
              </span>
          </div>
        )}

        <div className="mt-2 grid w-full grid-cols-1 gap-4 text-start md:grid-cols-3">
          {nextSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background p-4"
              >
                <Icon
                  className="h-5 w-5 text-primary-500"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-extrabold text-foreground">
                  {step.title}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-500 px-7 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            {t("backHome")}
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-surface-muted px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-50"
          >
            {isAr ? "تصفح معرض الأعمال" : "Browse Portfolio"}
          </Link>
        </div>
      </div>
    </div>
  );
}
