"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu, PenTool, User, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import {
  RAQEEM_WHATSAPP_BASE_URL,
  RAQEEM_WHATSAPP_LOCAL,
} from "@/lib/brand";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./whatsapp-icon";

interface NavItem {
  key: string;
  arLabel: string;
  enLabel: string;
  href: string;
  sectionId?: string;
  routePrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    arLabel: "الرئيسية",
    enLabel: "Home",
    href: "/",
    sectionId: "hero-section",
  },
  {
    key: "about",
    arLabel: "عن رقيم",
    enLabel: "About",
    href: "/about",
    routePrefix: "/about",
  },
  {
    key: "portfolio",
    arLabel: "أعمالنا",
    enLabel: "Portfolio",
    href: "/#portfolio-section",
    sectionId: "portfolio-section",
    routePrefix: "/portfolio",
  },
  {
    key: "track",
    arLabel: "تتبّع طلبك",
    enLabel: "Track Order",
    href: "/track",
    routePrefix: "/track",
  },
  {
    key: "pricing",
    arLabel: "الأسعار والعروض",
    enLabel: "Pricing & Offers",
    href: "/#pricing-section",
    sectionId: "pricing-section",
    routePrefix: "/pricing",
  },
  {
    key: "testimonials",
    arLabel: "آراء العملاء",
    enLabel: "Reviews",
    href: "/#testimonials-section",
    sectionId: "testimonials-section",
  },
];

function resolveActiveKeyFromLocation(pathname: string, hash: string): string {
  const cleanHash = hash.replace(/^#/, "");

  if (pathname === "/" || pathname === "") {
    if (cleanHash) {
      const matched = NAV_ITEMS.find((item) => item.sectionId === cleanHash);
      if (matched) return matched.key;
    }
    return "home";
  }

  for (const item of NAV_ITEMS) {
    if (item.routePrefix && pathname.startsWith(item.routePrefix)) {
      return item.key;
    }
  }

  return "";
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollSectionKey, setScrollSectionKey] = useState<string | null>(null);

  const nextLocale: Locale = isAr ? "en" : "ar";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromHash = () => {
      const hash = window.location.hash;
      if (pathname === "/" && hash) {
        const key = resolveActiveKeyFromLocation(pathname, hash);
        setScrollSectionKey(key);
      } else {
        setScrollSectionKey(null);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    if (pathname !== "/" || typeof IntersectionObserver === "undefined") {
      return () => {
        window.removeEventListener("hashchange", syncFromHash);
        window.removeEventListener("popstate", syncFromHash);
      };
    }

    const sectionItems = NAV_ITEMS.filter((item) => Boolean(item.sectionId));
    const observedElements = sectionItems
      .map((item) => ({
        key: item.key,
        el: document.getElementById(item.sectionId!),
      }))
      .filter((entry): entry is { key: string; el: HTMLElement } =>
        Boolean(entry.el),
      );

    if (observedElements.length === 0) {
      return () => {
        window.removeEventListener("hashchange", syncFromHash);
        window.removeEventListener("popstate", syncFromHash);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const match = observedElements.find(
            (item) => item.el === visible[0]!.target,
          );
          if (match) {
            setScrollSectionKey(match.key);
          }
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const item of observedElements) {
      observer.observe(item.el);
    }

    const handleScrollTop = () => {
      if (window.scrollY < 120) {
        setScrollSectionKey("home");
      }
    };
    window.addEventListener("scroll", handleScrollTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("scroll", handleScrollTop);
    };
  }, [pathname]);

  const activeKey =
    pathname === "/"
      ? (scrollSectionKey ?? "home")
      : resolveActiveKeyFromLocation(pathname, "");

  function handleLanguageSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <header className="bg-white/95 shadow-[0_1px_8px_rgba(99,36,197,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-[72px] lg:px-10">
        {/* Right: Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => setScrollSectionKey("home")}
            className="group flex items-center gap-2"
          >
            <Image
              src="/images/logo-raqeem.png"
              alt="شعار رقيم"
              width={148}
              height={44}
              priority
              className="h-10 w-auto object-contain md:h-12"
            />
          </Link>
        </div>

        {/* Center: Dynamic Active-State Nav Links */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-4 xl:flex"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => {
                  if (item.sectionId && pathname === "/") {
                    setScrollSectionKey(item.key);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-2 py-1.5 text-[14px] leading-[1.6] transition-colors",
                  isActive
                    ? "bg-[#F3EAFF] font-extrabold text-[#6324c5]"
                    : "font-medium text-[#4a4454] hover:text-[#1e182e]",
                )}
              >
                {isAr ? item.arLabel : item.enLabel}
              </Link>
            );
          })}
        </nav>

        {/* Left: Action Controls (Language, WhatsApp SVG, Order CTA, Admin Portal) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLanguageSwitch}
            aria-label={t("switchLanguageAria")}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-lg px-2.5 py-1 text-[14px] font-medium text-[#625B75] transition-colors hover:text-[#1e182e]"
          >
            {isAr ? "EN" : "AR"}
          </button>

          <a
            href={RAQEEM_WHATSAPP_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isAr
                ? `تواصل مع رقيم عبر واتساب ${RAQEEM_WHATSAPP_LOCAL}`
                : `Contact Raqeem on WhatsApp ${RAQEEM_WHATSAPP_LOCAL}`
            }
            title={
              isAr
                ? `واتساب رقيم (${RAQEEM_WHATSAPP_LOCAL})`
                : `Raqeem WhatsApp (${RAQEEM_WHATSAPP_LOCAL})`
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/15 text-[#16875D] transition-colors hover:bg-[#25D366]/25"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>

          <Link
            href="/order"
            className="hidden min-h-[44px] items-center gap-1.5 rounded-full bg-[#6324c5] px-5 py-2 text-[14px] font-bold whitespace-nowrap text-white shadow-[0_8px_24px_-4px_rgba(99,36,197,0.22)] transition-all hover:bg-[#541CA9] active:bg-[#43158C] sm:inline-flex"
          >
            <PenTool className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("orderCta")}</span>
          </Link>

          <NextLink
            href="/admin/login"
            title={isAr ? "تسجيل الدخول" : "Admin Login"}
            aria-label={isAr ? "تسجيل الدخول" : "Admin Login"}
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#4a00a2] text-white xl:flex"
          >
            <User className="h-4 w-4" aria-hidden="true" />
          </NextLink>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E8E1F2] bg-white text-[#4B149E] xl:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="border-t border-[#E8E1F2] bg-white px-6 py-4 shadow-lg xl:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => {
                    if (item.sectionId && pathname === "/") {
                      setScrollSectionKey(item.key);
                    }
                    setMobileOpen(false);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-xl px-3 text-base transition-colors",
                    isActive
                      ? "bg-[#F3EAFF] font-extrabold text-[#6324c5]"
                      : "font-semibold text-[#241747] hover:bg-[#F3EAFF] hover:text-[#6324c5]",
                  )}
                >
                  {isAr ? item.arLabel : item.enLabel}
                </Link>
              );
            })}

            {/* Mobile/Tablet CTA & Admin Login inside Nav Drawer */}
            <div className="mt-2 flex flex-col gap-2 border-t border-[#E8E1F2] pt-3">
              <Link
                href="/order"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#6324c5] px-4 py-2.5 text-base font-bold text-white shadow-sm sm:hidden"
              >
                <PenTool className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("orderCta")}</span>
              </Link>

              <NextLink
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#4a00a2] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3c0085]"
              >
                <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? "تسجيل الدخول" : "Admin Login"}</span>
              </NextLink>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
