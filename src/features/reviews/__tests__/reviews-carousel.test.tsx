import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewsCarouselSection } from "@/components/shared/reviews-carousel-section";
import { getReviewAvatar } from "@/features/reviews/avatars";
import type { CustomerReviewRow } from "@/lib/supabase/types";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/components/shared/toast-provider", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("@/features/reviews/actions", () => ({
  submitCustomerReviewAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const FOUR_REVIEWS: CustomerReviewRow[] = [
  {
    id: "rev-1",
    reviewer_name: "أم عمر",
    reviewer_age: "6 سنوات",
    rating: 5,
    comment: "التعليق الأول - رائد الفضاء",
    avatar_index: 0,
    status: "approved",
    created_at: "2026-11-20T10:00:00Z",
    approved_at: "2026-11-20T10:05:00Z",
  },
  {
    id: "rev-2",
    reviewer_name: "أم ليلى",
    reviewer_age: "7 سنوات",
    rating: 5,
    comment: "التعليق الثاني - البنت بالفيونكة",
    avatar_index: 1,
    status: "approved",
    created_at: "2026-11-20T11:00:00Z",
    approved_at: "2026-11-20T11:05:00Z",
  },
  {
    id: "rev-3",
    reviewer_name: "والد ياسين",
    reviewer_age: "8 سنوات",
    rating: 5,
    comment: "التعليق الثالث - الولد بالنظارة",
    avatar_index: 2,
    status: "approved",
    created_at: "2026-11-20T12:00:00Z",
    approved_at: "2026-11-20T12:05:00Z",
  },
  {
    id: "rev-4",
    reviewer_name: "أم سليم",
    reviewer_age: "5 سنوات",
    rating: 5,
    comment: "التعليق الرابع - رائد الفضاء مرة أخرى",
    avatar_index: 0,
    status: "approved",
    created_at: "2026-11-20T13:00:00Z",
    approved_at: "2026-11-20T13:05:00Z",
  },
];

describe("ReviewsCarouselSection & persistent avatars", () => {
  it("maps sequential avatar indices 0, 1, 2, 3 -> Astronaut, Girl Bow, Boy Glasses, Astronaut", () => {
    expect(getReviewAvatar(0).src).toBe("/images/review-avatar-astronaut.png");
    expect(getReviewAvatar(1).src).toBe("/images/review-avatar-girl-bow.png");
    expect(getReviewAvatar(2).src).toBe("/images/review-avatar-boy-glasses.png");
    expect(getReviewAvatar(3).src).toBe("/images/review-avatar-astronaut.png");
  });

  it("keeps each review bound to its own persistent avatar across carousel rotations (4 reviews)", () => {
    render(<ReviewsCarouselSection reviews={FOUR_REVIEWS} />);

    // Initially active: rev-1 (Astronaut)
    const getCenterImg = () => {
      const article = screen.getByRole("article");
      return article.querySelector("img");
    };

    expect(screen.getByRole("article")).toHaveTextContent("أم عمر");
    expect(getCenterImg()?.getAttribute("src")).toBe(
      "/images/review-avatar-astronaut.png",
    );

    // Advance to rev-2 (Girl with Bow)
    const nextBtn = screen.getByRole("button", { name: "الرأي التالي" });
    fireEvent.click(nextBtn);
    expect(screen.getByRole("article")).toHaveTextContent("أم ليلى");
    expect(getCenterImg()?.getAttribute("src")).toBe(
      "/images/review-avatar-girl-bow.png",
    );

    // Advance to rev-3 (Boy with Glasses)
    fireEvent.click(nextBtn);
    expect(screen.getByRole("article")).toHaveTextContent("والد ياسين");
    expect(getCenterImg()?.getAttribute("src")).toBe(
      "/images/review-avatar-boy-glasses.png",
    );

    // Advance to rev-4 (Astronaut — same as rev-1)
    fireEvent.click(nextBtn);
    expect(screen.getByRole("article")).toHaveTextContent("أم سليم");
    expect(getCenterImg()?.getAttribute("src")).toBe(
      "/images/review-avatar-astronaut.png",
    );

    // Loop back to rev-1 (Astronaut)
    fireEvent.click(nextBtn);
    expect(screen.getByRole("article")).toHaveTextContent("أم عمر");
    expect(getCenterImg()?.getAttribute("src")).toBe(
      "/images/review-avatar-astronaut.png",
    );
  });

  it("renders a single centered card with no arrows or pagination dots when only 1 review exists", () => {
    render(<ReviewsCarouselSection reviews={FOUR_REVIEWS.slice(0, 1)} />);

    expect(screen.getByRole("article")).toHaveTextContent("أم عمر");
    expect(
      screen.queryByRole("button", { name: "الرأي التالي" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "الرأي السابق" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("opens the existing review submission modal when clicking CTA", () => {
    render(<ReviewsCarouselSection reviews={FOUR_REVIEWS} />);

    fireEvent.click(screen.getByRole("button", { name: "قول رأيك في الكتاب" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
