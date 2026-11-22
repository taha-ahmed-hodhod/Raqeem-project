import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  selectHomePortfolioItems,
  type PortfolioShowcaseItem,
} from "@/features/portfolio/portfolio-data";
import { PortfolioBookshelfSection } from "@/components/shared/portfolio-bookshelf-section";
import { PortfolioWorksGrid } from "@/components/shared/portfolio-works-grid";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeWork(
  idx: number,
  overrides: Partial<PortfolioShowcaseItem> = {},
): PortfolioShowcaseItem {
  return {
    id: `work-${idx}`,
    slug: `work-${idx}`,
    titleAr: `قصة البطل رقم ${idx}`,
    titleEn: `Hero Story #${idx}`,
    shortSummaryAr: `نبذة قصيرة للعمل رقم ${idx}`,
    shortSummaryEn: `Short summary #${idx}`,
    storyInterestsAr: `اهتمامات العمل ${idx}`,
    storyInterestsEn: `Interests ${idx}`,
    storyIdeaAr: `فكرة العمل ${idx}`,
    storyIdeaEn: `Idea ${idx}`,
    storyHeroAr: `بطل العمل ${idx}`,
    storyHeroEn: `Hero ${idx}`,
    childLabelAr: `بطل ${idx}`,
    childLabelEn: `Hero ${idx}`,
    themeAr: `ثيم ${idx}`,
    themeEn: `Theme ${idx}`,
    descriptionAr: `وصف ${idx}`,
    descriptionEn: `Desc ${idx}`,
    originalPhotoUrl: `https://example.com/cover-${idx}.png`,
    cartoonImageUrl: `https://example.com/cover-${idx}.png`,
    coloringPageUrl: `https://example.com/cover-${idx}.png`,
    bookMockupUrl: `https://example.com/cover-${idx}.png`,
    isDemo: false,
    guardianConsentVerified: true,
    pageCount: 24,
    showOnHome: false,
    homeSortOrder: 0,
    ...overrides,
  };
}

describe("Portfolio Bookshelf & Full Works Acceptance Tests", () => {
  it("caps Homepage shelf at 3 works max, respects custom homeSortOrder, and never duplicates when < 3", () => {
    const fiveWorks = [1, 2, 3, 4, 5].map((n) => makeWork(n));

    // Default first-run behavior: 3 works
    const defaultHome = selectHomePortfolioItems(fiveWorks);
    expect(defaultHome).toHaveLength(3);
    expect(defaultHome.map((w) => w.id)).toEqual(["work-1", "work-2", "work-3"]);

    // When admin selects 3 works with custom order (including #5 first)
    const withThreeSelected = fiveWorks.map((w) => {
      if (w.id === "work-5") return { ...w, showOnHome: true, homeSortOrder: 1 };
      if (w.id === "work-2") return { ...w, showOnHome: true, homeSortOrder: 2 };
      if (w.id === "work-4") return { ...w, showOnHome: true, homeSortOrder: 3 };
      return w;
    });

    const selectedHome = selectHomePortfolioItems(withThreeSelected);
    expect(selectedHome).toHaveLength(3);
    expect(selectedHome.map((w) => w.id)).toEqual([
      "work-5",
      "work-2",
      "work-4",
    ]);

    // When only 2 works exist: returns 2 without duplicating
    expect(selectHomePortfolioItems(fiveWorks.slice(0, 2))).toHaveLength(2);
  });

  it("syncs mobile arrows, active book title/summary/dot, and opens the exact Case Study modal", () => {
    const updatedCover = "https://example.com/updated-cover-1.png";
    const fiveWorks = [1, 2, 3, 4, 5].map((n) =>
      makeWork(n, n === 1 ? { originalPhotoUrl: updatedCover } : {}),
    );

    const homeItems = selectHomePortfolioItems(fiveWorks);
    const { unmount } = render(<PortfolioBookshelfSection items={homeItems} />);

    // Heading & "المزيد من الأعمال" link to /works
    expect(screen.getByText("أبطال من عالم رقيم")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "المزيد من الأعمال" }),
    ).toHaveAttribute("href", "/works");

    // 3 pagination dots + prev/next arrows on mobile
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    // Click next arrow -> moves to work-2, dot #2 becomes active
    fireEvent.click(screen.getByRole("button", { name: "الكتاب التالي" }));
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Click "اقرأ القصة" (mobile active CTA is the last one rendered) -> opens work-2 modal
    const readBtns = screen.getAllByRole("button", { name: "اقرأ القصة" });
    fireEvent.click(readBtns[readBtns.length - 1]!);
    expect(screen.getByRole("dialog")).toHaveTextContent("اهتمامات العمل 2");

    unmount();

    // Full /works page displays ALL 5 published works and reflects the updated cover
    render(<PortfolioWorksGrid items={fiveWorks} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getAllByText(`قصة البطل رقم ${i}`).length).toBeGreaterThan(0);
    }
    const worksImages = screen.getAllByAltText("قصة البطل رقم 1");
    expect(
      worksImages.some((img) => img.getAttribute("src") === updatedCover),
    ).toBe(true);
  });

  it("hides arrows and pagination dots when only 1 book is displayed on Homepage", () => {
    render(<PortfolioBookshelfSection items={[makeWork(1)]} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "الكتاب التالي" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "الكتاب السابق" }),
    ).not.toBeInTheDocument();
  });
});
