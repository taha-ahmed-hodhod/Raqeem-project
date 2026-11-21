import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import {
  DEFAULT_BOOK_VARIANTS,
  DEFAULT_FAQS,
  DEFAULT_TESTIMONIALS,
} from "@/features/content/cms-data";
import { DEFAULT_PORTFOLIO_ITEMS } from "@/features/portfolio/portfolio-data";
import { HeroInteractiveSection } from "@/components/shared/hero-interactive-section";
import { PortfolioFilterGrid } from "@/components/shared/portfolio-filter-grid";
import { FaqAccordion } from "@/components/shared/faq-accordion";

function renderWithIntl(
  ui: React.ReactNode,
  locale: "ar" | "en" = "ar",
) {
  const messages = locale === "ar" ? arMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("M2 — Public UI and CMS", () => {
  it("renders Stitch-aligned HeroInteractiveSection with 12/24 package selector and routes to /order?pages=12|24", () => {
    renderWithIntl(
      <HeroInteractiveSection bookVariants={DEFAULT_BOOK_VARIANTS} />,
      "ar",
    );

    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent("بطل القصة!");

    const primaryLinks = screen.getAllByRole("link", {
      name: /اطلب كتاب طفلك الآن/,
    });
    expect(primaryLinks[0]?.getAttribute("href")).toContain("/order?pages=12");

    // Click 24-page radio option
    const radio24 = screen.getByRole("radio", { name: /24 صفحة تلوين/ });
    fireEvent.click(radio24);
    expect(radio24).toHaveAttribute("aria-checked", "true");
    expect(primaryLinks[0]?.getAttribute("href")).toContain("/order?pages=24");

    // Must never contain online payment / deposit UI
    expect(screen.queryByText(/Pay Now/i)).toBeNull();
    expect(screen.queryByText(/عربون/)).toBeNull();
  });

  it("renders PortfolioFilterGrid in English LTR and filters between demo and real items with explicit demo badges", () => {
    renderWithIntl(
      <PortfolioFilterGrid items={DEFAULT_PORTFOLIO_ITEMS} />,
      "en",
    );

    expect(
      screen.getByText("From Real Photo to Coloring Book Hero"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Demonstration Sample").length,
    ).toBeGreaterThanOrEqual(2);

    const demoTab = screen.getByRole("tab", { name: "Demo Samples" });
    fireEvent.click(demoTab);
    expect(demoTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByText("Little Astronaut Space Adventure"),
    ).toBeInTheDocument();
  });

  it("toggles FAQ accordion items accessibly", () => {
    renderWithIntl(<FaqAccordion items={DEFAULT_FAQS} />, "ar");

    const firstQuestion = DEFAULT_FAQS[0]!.questionAr;
    const secondQuestion = DEFAULT_FAQS[1]!.questionAr;

    const firstTrigger = screen.getByRole("button", { name: firstQuestion });
    const secondTrigger = screen.getByRole("button", { name: secondQuestion });

    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(secondTrigger);
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("marks all default testimonials and portfolio items as demo placeholders (no fabricated reviews or unconsented photos)", () => {
    expect(
      DEFAULT_TESTIMONIALS.every((t) => t.isDemoPlaceholder === true),
    ).toBe(true);
    expect(DEFAULT_PORTFOLIO_ITEMS.every((p) => p.isDemo === true)).toBe(true);
  });
});
