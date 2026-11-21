"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MessageSquareText,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { CustomerReviewRow } from "@/lib/supabase/types";
import { useToast } from "./toast-provider";
import { submitCustomerReviewAction } from "@/features/reviews/actions";
import { getReviewAvatar } from "@/features/reviews/avatars";
import { cn } from "@/lib/utils";

interface ReviewsCarouselSectionProps {
  reviews: CustomerReviewRow[];
}

function StorybookReviewCard({
  review,
  variant,
  isAr,
  onClick,
}: {
  review: CustomerReviewRow;
  variant: "center" | "prev" | "next";
  isAr: boolean;
  onClick?: () => void;
}) {
  const avatar = getReviewAvatar(review.avatar_index);
  const isCenter = variant === "center";

  // In RTL: "prev" sits on the right (tilted clockwise), "next" sits on the left (tilted counter-clockwise).
  // In LTR: "prev" sits on the left (-rotate), "next" sits on the right (+rotate).
  const tiltClass = isCenter
    ? "z-20 scale-100 rotate-0 opacity-100"
    : variant === "prev"
      ? isAr
        ? "z-10 scale-[0.88] rotate-[5deg] opacity-90 hover:opacity-100 hover:scale-[0.91]"
        : "z-10 scale-[0.88] -rotate-[5deg] opacity-90 hover:opacity-100 hover:scale-[0.91]"
      : isAr
        ? "z-10 scale-[0.88] -rotate-[5deg] opacity-90 hover:opacity-100 hover:scale-[0.91]"
        : "z-10 scale-[0.88] rotate-[5deg] opacity-90 hover:opacity-100 hover:scale-[0.91]";

  const cardInner = (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center rounded-[28px] border-2 border-[#EEDBC3] bg-[#FFFDF7] p-3 text-center transition-all duration-500 ease-out motion-reduce:transition-none",
        isCenter
          ? "shadow-[0_6px_0_#F2DFC5,0_11px_0_#E6CCA9,0_22px_42px_-12px_rgba(99,36,197,0.22)]"
          : "shadow-[0_5px_0_#F2DFC5,0_9px_0_#E6CCA9,0_14px_28px_-12px_rgba(99,36,197,0.14)]",
      )}
    >
      {/* Inner decorative book-page frame */}
      <div className="relative flex h-full w-full flex-col items-center rounded-[20px] border border-[#E7D4F6] px-5 pt-6 pb-7 sm:px-7">
        {/* Corner lavender leaf dots */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 start-2.5 h-2.5 w-2.5 rounded-full bg-[#C7A6F5]/60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 end-2.5 h-2.5 w-2.5 rounded-full bg-[#C7A6F5]/60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2.5 start-2.5 h-2.5 w-2.5 rounded-full bg-[#C7A6F5]/60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2.5 end-2.5 h-2.5 w-2.5 rounded-full bg-[#C7A6F5]/60"
        />

        {/* Persistent Review Avatar (bound to review.avatar_index) */}
        <div
          className={cn(
            "overflow-hidden rounded-full border-4 border-[#F5E7D2] bg-[#F3EAFF] shadow-md",
            isCenter ? "h-28 w-28 sm:h-32 sm:w-32" : "h-24 w-24 sm:h-28 sm:w-28",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar.src}
            alt={isAr ? avatar.altAr : avatar.altEn}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Reviewer Name & Age */}
        <h3
          className={cn(
            "mt-4 font-extrabold text-[#3B126E]",
            isCenter ? "text-xl sm:text-2xl" : "text-lg sm:text-xl",
          )}
        >
          {review.reviewer_name}
        </h3>
        <p className="mt-0.5 text-sm font-bold text-[#625B75]">
          {review.reviewer_age}
        </p>

        {/* Star Rating */}
        <div
          className="mt-3 flex items-center justify-center gap-1 text-[#FFC928]"
          aria-label={`${review.rating} / 5`}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={cn(
                isCenter ? "h-5 w-5" : "h-4 w-4",
                idx < review.rating
                  ? "fill-[#FFC928] text-[#FFC928]"
                  : "text-[#E2D6F0]",
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Review Quote */}
        <blockquote
          className={cn(
            "mt-3.5 leading-[1.8] font-bold text-[#241747]",
            isCenter
              ? "text-[15px] sm:text-[16px]"
              : "line-clamp-3 text-[13px] sm:text-[14px]",
          )}
        >
          &ldquo;{review.comment}&rdquo;
        </blockquote>
      </div>
    </div>
  );

  if (!isCenter && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={
          isAr
            ? `عرض رأي ${review.reviewer_name}`
            : `View review by ${review.reviewer_name}`
        }
        className={cn(
          "hidden w-full max-w-[310px] shrink-0 cursor-pointer text-start transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6324C5] motion-reduce:transition-none md:block",
          tiltClass,
        )}
      >
        {cardInner}
      </button>
    );
  }

  return (
    <article
      className={cn(
        "w-full max-w-[360px] shrink-0 transition-all duration-500 ease-out motion-reduce:transition-none sm:max-w-[390px]",
        tiltClass,
      )}
    >
      {cardInner}
    </article>
  );
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
  const touchStartXRef = useRef<number | null>(null);

  const count = reviews.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-advance every 5 seconds (pauses on interaction, modal open, <=1 review, or prefers-reduced-motion)
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

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;

    if (startX !== null && endX !== null && count > 1) {
      const deltaX = endX - startX;
      if (Math.abs(deltaX) > 45) {
        if (isAr) {
          // RTL swipe: swiping right advances to next, swiping left goes to prev
          if (deltaX > 0) goNext();
          else goPrev();
        } else {
          // LTR swipe: swiping left advances to next, swiping right goes to prev
          if (deltaX < 0) goNext();
          else goPrev();
        }
      }
    }

    setIsPaused(false);
  }

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
          title:
            res.error ??
            (isAr ? "تعذر إرسال رأيك" : "Could not submit review"),
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
        title: isAr ? "شكراً لرأيك الجميل!" : "Thank you for your review!",
        description: isAr
          ? "تم استلام تقييمك بنجاح، وسيظهر في الموقع بعد مراجعة فريق رقيم."
          : "Your review was received and will appear once approved by the Raqeem team.",
      });
    });
  }

  const centerReview = count > 0 ? reviews[safeIndex] : null;
  const prevIndex = count > 1 ? (safeIndex - 1 + count) % count : -1;
  const nextIndex = count > 2 ? (safeIndex + 1) % count : -1;
  const prevReview = prevIndex >= 0 ? reviews[prevIndex] : null;
  const nextReview = nextIndex >= 0 ? reviews[nextIndex] : null;

  return (
    <section
      id="testimonials-section"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden py-16 md:py-22"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 lg:px-10">
        {/* Centered Storybook Section Heading */}
        <div className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <div className="flex items-center justify-center gap-3">
            <Sparkles
              className="h-6 w-6 shrink-0 text-[#FFC928]"
              aria-hidden="true"
            />
            <h2
              id="testimonials-heading"
              className="text-[28px] leading-[1.3] font-extrabold text-[#3B126E] sm:text-[36px] lg:text-[40px]"
            >
              {isAr
                ? "آراء حقيقية من عائلة رقيم"
                : "What Families Say About Raqeem"}
            </h2>
            <Sparkles
              className="h-6 w-6 shrink-0 text-[#F65C96]"
              aria-hidden="true"
            />
          </div>
          {/* Soft purple underline accent matching reference */}
          <div
            aria-hidden="true"
            className="mt-2.5 h-1.5 w-36 rounded-full bg-gradient-to-r from-[#C7A6F5] via-[#6324C5] to-[#F65C96] opacity-75"
          />
        </div>

        {/* 3-Card Tilted Storybook Carousel */}
        {centerReview ? (
          <div
            className="w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative flex min-h-[380px] items-center justify-center gap-2 py-4 sm:min-h-[410px] md:gap-4 lg:gap-6">
              {/* Previous tilted side card (desktop when count >= 2) */}
              {prevReview && (
                <StorybookReviewCard
                  key={`prev-${prevReview.id}`}
                  review={prevReview}
                  variant="prev"
                  isAr={isAr}
                  onClick={goPrev}
                />
              )}

              {/* Active upright center card */}
              <StorybookReviewCard
                key={`center-${centerReview.id}`}
                review={centerReview}
                variant="center"
                isAr={isAr}
              />

              {/* Next tilted side card (desktop when count >= 3) */}
              {nextReview && (
                <StorybookReviewCard
                  key={`next-${nextReview.id}`}
                  review={nextReview}
                  variant="next"
                  isAr={isAr}
                  onClick={goNext}
                />
              )}
            </div>

            {/* Arrows & Pagination Dots below the cards (hidden when <= 1 review) */}
            {count > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={isAr ? goPrev : goPrev}
                  aria-label={isAr ? "الرأي السابق" : "Previous review"}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#6324C5] text-white shadow-[0_6px_18px_-4px_rgba(99,36,197,0.45)] transition-transform hover:scale-105 hover:bg-[#541CA9] active:scale-95"
                >
                  {isAr ? (
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label={isAr ? "تنقل بين الآراء" : "Review pagination"}
                >
                  {reviews.map((rev, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={rev.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveIndex(idx)}
                        aria-label={
                          isAr ? `رأي رقم ${idx + 1}` : `Review ${idx + 1}`
                        }
                        className={cn(
                          "h-3 cursor-pointer rounded-full transition-all duration-300",
                          isActive
                            ? "w-7 bg-[#6324C5]"
                            : "w-3 bg-[#D7C4F2] hover:bg-[#B494E8]",
                        )}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={isAr ? goNext : goNext}
                  aria-label={isAr ? "الرأي التالي" : "Next review"}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#6324C5] text-white shadow-[0_6px_18px_-4px_rgba(99,36,197,0.45)] transition-transform hover:scale-105 hover:bg-[#541CA9] active:scale-95"
                >
                  {isAr ? (
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-[28px] border-2 border-[#EEDBC3] bg-[#FFFDF7] p-8 text-center shadow-sm">
            <p className="text-base font-bold text-[#241747]">
              {isAr
                ? "كن أول من يشاركنا رأيه في كتاب رقيم!"
                : "Be the first to share your Raqeem book experience!"}
            </p>
          </div>
        )}

        {/* Centered CTA Button at Bottom of Section */}
        <div className="mt-7 flex justify-center">
          <button
            ref={triggerBtnRef}
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-full bg-[#6324C5] px-8 py-3 text-base font-extrabold text-white shadow-[0_10px_26px_-6px_rgba(99,36,197,0.5)] transition-all hover:-translate-y-0.5 hover:bg-[#541CA9] active:translate-y-0"
          >
            <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            <span>{isAr ? "قول رأيك في الكتاب" : "Share Your Review"}</span>
          </button>
        </div>
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
