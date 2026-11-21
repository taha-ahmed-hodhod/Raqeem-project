import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Cairo, Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { isRtlLocale, routing, type Locale } from "@/lib/i18n/routing";
import { AnnouncementBar } from "@/components/shared/announcement-bar";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ToastProvider } from "@/components/shared/toast-provider";
import { PublicLiveSync } from "@/components/shared/public-live-sync";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#6324C5",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/icons/admin-icon-192.png",
      apple: "/icons/admin-icon-192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: locale === "ar" ? "رقيم" : "Raqeem",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = isRtlLocale(locale as Locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} ${nunito.variable}`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-dvh flex-col bg-[#F8F5FF] text-[#1e182e] antialiased"
      >
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <PublicLiveSync />
            <div className="fixed inset-x-0 top-0 z-50">
              <AnnouncementBar />
              <SiteHeader />
            </div>
            <main className="min-h-screen w-full flex-1 bg-[#F8F5FF] pt-28">
              {children}
            </main>
            <SiteFooter />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
