"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Loader2, MessageSquarePlus, Star, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { CustomerReviewRow } from "@/lib/supabase/types";
import { useToast } from "./toast-provider";
import { submitCustomerReviewAction } from "@/features/reviews/actions";
import { cn } from "@/lib/utils";

const RAQEEM_REVIEW_AVATARS = [
  "/images/stitch/review-um-yassin.png",
  "/images/stitch/farida-2-cartoon.png",
  "/images/stitch/selim-2-cartoon.png",
] as const;

interface ReviewsCarouselSectionProps {
  reviews: CustomerReviewRow[];
}

export function ReviewsCarouselSection({
  reviews,
}: ReviewsCarouselSectionProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const { showToast } = useToast();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [reviewerName, setReviewerName] = useState("");
  const [reviewerAge, setReviewerAge] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const triggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const count = reviews.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;

  // Auto-advance carousel (pauses on interaction, modal open, <=1 review, or prefers-reduced-motion)
  useEffect(() => {
    if (count <= 1 || isPaused || modalOpen) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [count, isPaused, modalOpen]);

  // Modal accessibility (Escape + focus restore)
  useEffect(() => {
    if (!modalOpen) return;
    const triggerEl = triggerBtnRef.current;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
      triggerEl?.focus();
    };
  }, [modalOpen]);

  function handleSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitCustomerReviewAction({
        reviewerName,
        reviewerAge,
        rating,
        comment,
      });

      if (!res.ok) {
        showToast({
          variant: "error",
          title: res.error ?? (isAr ? "تعذر إرسال رأيك" : "Could not submit review"),
        });
        return;
      }

      setModalOpen(false);
      setReviewerName("");
      setReviewerAge("");
      setRating(5);
      setComment("");
      showToast({
        variant: "success",
        title: isAr
          ? "وصل رأيك وهو قيد المراجعة"
          : "Your review was received and is under review",
        description: isAr
          ? "شكراً لمشاركتك! سيتم نشر رأيك بعد مراجعته من فريق رقيم."
          : "Thank you! It will appear publicly once approved by our team.",
      });
    });
  }

  const currentReview = reviews[safeIndex];

  return (
    <section
      id="testimonials-section"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        {/* Heading + Submit Review CTA */}
        <div className="mb-10 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-start">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9DE] px-3.5 py-1 text-xs font-extrabold text-[#B76B00]">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{isAr ? "آراء عملائنا" : "Customer Reviews"}</span>
            </span>
            <h2 className="mt-2 text-[28px] leading-[1.3] font-extrabold text-[#241747] md:text-[36px]">
              {isAr
                ? "آراء حقيقية من عائلة رقيم"
                : "What Families Say About Raqeem"}
            </h2>
          </div>

          <button
            ref={triggerBtnRef}
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-xl bg-[#6324c5] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(99,36,197,0.22)] transition-colors hover:bg-[#541CA9]"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            <span>{isAr ? "قول رأيك في الكتاب" : "Share Your Review"}</span>
          </button>
        </div>

        {/* Carousel Card */}
        {currentReview ? (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            className="mx-auto max-w-3xl rounded-[28px] border border-[#E8E1F2] bg-white p-7 shadow-[0_14px_36px_-10px_rgba(99,36,197,0.12)] sm:p-10"
          >
            <div className="flex flex-col items-center gap-5 text-center">
              {/* Persistent Raqeem Illustration Avatar */}
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-[#F3EAFF] bg-[#F8F5FF] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    RAQEEM_REVIEW_AVATARS[currentReview.avatar_index % 3] ??
                    RAQEEM_REVIEW_AVATARS[0]
                  }
                  alt={currentReview.reviewer_name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Stars */}
              <div
                aria-label={`${currentReview.rating} من 5 نجوم`}
                className="flex items-center gap-1 text-[#FFC928]"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < currentReview.rating
                        ? "fill-[#FFC928] text-[#FFC928]"
                        : "text-[#E8E1F2]",
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Comment */}
              <blockquote className="text-[17px] leading-[1.85] font-semibold text-[#241747] sm:text-[19px]">
                “{currentReview.comment}”
              </blockquote>

              {/* Reviewer Name & Age */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-base font-extrabold text-[#6324c5]">
                  {currentReview.reviewer_name}
                </span>
                <span className="text-xs font-semibold text-[#625B75]">
                  {currentReview.reviewer_age}
                </span>
              </div>
            </div>

            {/* Pagination Dots (hidden when <= 1 review) */}
            {count > 1 && (
              <div
                role="tablist"
                aria-label={isAr ? "التنقل بين الآراء" : "Review slides"}
                className="mt-7 flex items-center justify-center gap-2"
              >
                {reviews.map((rev, idx) => {
                  const isActive = idx === safeIndex;
                  return (
                    <button
                      key={rev.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={
                        isAr ? `عرض الرأي ${idx + 1}` : `View review ${idx + 1}`
                      }
                      onClick={() => {
                        setIsPaused(true);
                        setActiveIndex(idx);
                      }}
                      className={cn(
                        "h-2.5 cursor-pointer rounded-full transition-all",
                        isActive
                          ? "w-8 bg-[#6324c5]"
                          : "w-2.5 bg-[#E8E1F2] hover:bg-[#6324c5]/50",
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#E8E1F2] bg-white p-10 text-center text-sm text-[#625B75]">
            {isAr
              ? "كن أول من يشاركنا رأيه في كتاب رقيم!"
              : "Be the first to share your Raqeem book experience!"}
          </div>
        )}
      </div>

      {/* Animated Review Submission Popup */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-review-modal-title"
          className="raqeem-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-[#241747]/55 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="raqeem-modal-panel relative w-full max-w-lg rounded-[28px] border border-[#E8E1F2] bg-white p-6 shadow-2xl sm:p-8">
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label={isAr ? "إغلاق" : "Close"}
              className="absolute top-4 end-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F8F5FF] text-[#241747] hover:bg-[#F3EAFF] hover:text-[#6324c5]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h3
              id="submit-review-modal-title"
              className="text-xl font-extrabold text-[#241747]"
            >
              {isAr ? "قول رأيك في الكتاب" : "Share Your Book Review"}
            </h3>
            <p className="mt-1 text-xs text-[#625B75]">
              {isAr
                ? "رأيك يساعد غيرك يتعرف على جودة رقيم (يتم مراجعته قبل النشر)."
                : "Your feedback helps others discover Raqeem (reviewed before publishing)."}
            </p>

            <form
              onSubmit={handleSubmitReview}
              className="mt-5 flex flex-col gap-4"
            >
              {/* Star Rating Picker */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#241747]">
                  {isAr ? "التقييم (من 1 إلى 5 نجوم) *" : "Rating (1–5 Stars) *"}
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      aria-label={`${starVal} نجوم`}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] transition-transform hover:scale-105"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          starVal <= rating
                            ? "fill-[#FFC928] text-[#FFC928]"
                            : "text-[#D4CBE3]",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="review-name"
                    className="text-xs font-bold text-[#241747]"
                  >
                    {isAr ? "الاسم *" : "Name *"}
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder={isAr ? "مثال: أم ياسين" : "e.g. Sarah"}
                    className="h-11 rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] px-3.5 text-sm text-[#241747] focus:border-[#6324c5] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="review-age"
                    className="text-xs font-bold text-[#241747]"
                  >
                    {isAr ? "السن *" : "Age *"}
                  </label>
                  <input
                    id="review-age"
                    type="text"
                    required
                    minLength={1}
                    maxLength={40}
                    value={reviewerAge}
                    onChange={(e) => setReviewerAge(e.target.value)}
                    placeholder={isAr ? "مثال: 5 سنوات أو 25 سنة" : "e.g. 5 years"}
                    className="h-11 rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] px-3.5 text-sm text-[#241747] focus:border-[#6324c5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="review-comment"
                  className="text-xs font-bold text-[#241747]"
                >
                  {isAr ? "تعليقك عن الكتاب *" : "Your Comment *"}
                </label>
                <textarea
                  id="review-comment"
                  required
                  minLength={5}
                  maxLength={800}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isAr
                      ? "احكي لنا عن تجربتك مع كتاب رقيم..."
                      : "Tell us about your experience with Raqeem..."
                  }
                  className="rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] p-3.5 text-sm text-[#241747] focus:border-[#6324c5] focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6324c5] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#541CA9] disabled:opacity-60"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                <span>{isAr ? "إرسال الرأي" : "Submit Review"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
