"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleSwitch}
      aria-label={t("switchLanguageAria")}
      className="gap-1.5"
    >
      <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t("switchLanguage")}</span>
    </Button>
  );
}
