import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const [tPage, tHome, tFooter, cmsData] = await Promise.all([
    getTranslations("pages.contact"),
    getTranslations("home"),
    getTranslations("footer"),
    getPublicCatalogAndCmsData(),
  ]);

  const workingHours =
    typedLocale === "ar"
      ? cmsData.contactSettings.workingHoursAr
      : cmsData.contactSettings.workingHoursEn;

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {tPage("channelsTitle")}
          </h2>
          {cmsData.contactSettings.whatsappNumber ||
          cmsData.contactSettings.phoneNumber ? (
            <div className="flex flex-col gap-1 text-sm font-semibold text-foreground">
              {cmsData.contactSettings.whatsappNumber && (
                <span>WhatsApp: {cmsData.contactSettings.whatsappNumber}</span>
              )}
              {cmsData.contactSettings.phoneNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {cmsData.contactSettings.phoneNumber}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tPage("orderDirectHint")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow-50 text-warning">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {tPage("workingHoursLabel")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {workingHours}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-pink-50 text-secondary-pink">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {tHome("trustChips.egyptDelivery")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tFooter("contactPending")}
          </p>
        </div>
      </div>

      <div>
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
