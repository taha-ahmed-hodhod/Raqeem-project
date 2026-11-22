"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
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

const MAX_REVIEW_COMMENT_LENGTH = 160;

interface ReviewsCarouselSectionProps {
  reviews: CustomerReviewRow[];
}

function StorybookReviewCardInner({
  review,
  isCenter,
  isAr,
}: {
  review: CustomerReviewRow;
  isCenter: boolean;
  isAr: boolean;
}) {
  const avatar = getReviewAvatar(review.avatar_index);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center rounded-[28px] border-2 border-[#EEDBC3] bg-[#FFFDF7] p-3 text-center transition-shadow duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        isCenter
          ? "shadow-[0_6px_0_#F2DFC5,0_11px_0_#E6CCA9,0_22px_42px_-12px_rgba(99,36,197,0.22)]"
          : "shadow-[0_5px_0_#F2DFC5,0_9px_0_#E6CCA9,0_14px_28px_-12px_rgba(99,36,197,0.14)]",
      )}
    >
      {/* Inner decorative book-page frame (vertically centered so short & long comments look equally balanced) */}
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[20px] border border-[#E7D4F6] px-5 py-5 sm:px-7">
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

        {/* Persistent Review Avatar (always bound to review.avatar_index) */}
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#F5E7D2] bg-[#F3EAFF] shadow-md sm:h-28 sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar.src}
            alt={isAr ? avatar.altAr : avatar.altEn}
            width={112}
            height={112}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Reviewer Name & Age */}
        <h3 className="mt-3 text-xl font-extrabold text-[#3B126E] sm:text-2xl">
          {review.reviewer_name}
        </h3>
        <p className="mt-0.5 text-sm font-bold text-[#625B75]">
          {review.reviewer_age}
        </p>

        {/* Star Rating */}
        <div
          className="mt-2 flex items-center justify-center gap-1 text-[#FFC928]"
          aria-label={`${review.rating} / 5`}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={cn(
                "h-5 w-5",
                idx < review.rating
                  ? "fill-[#FFC928] text-[#FFC928]"
                  : "text-[#E2D6F0]",
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Review Quote (full text, sized cleanly for up to 160 chars with zero clipping) */}
        <blockquote className="mt-2.5 text-[14.5px] leading-[1.7] font-bold break-words text-[#241747] sm:text-[15px]">
          &ldquo;{review.comment}&rdquo;
        </blockquote>
      </div>
    </div>
  );
}

export function ReviewsCarouselSection({
  reviews,
}: ReviewsCarouselSectionProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const { showToast } = useToast();

  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const [reviewerName, setReviewerName] = useState("");
  const [reviewerAge, setReviewerAge] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const triggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const ageInputRef = useRef<HTMLInputElement | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const count = reviews.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;

  const navigateTo = useCallback(
    (nextIdx: number) => {
      if (count <= 1) return;
      const normalized = ((nextIdx % count) + count) % count;
      if (normalized === safeIndex) return;
      setPreviousIndex(safeIndex);
      setActiveIndex(normalized);
    },
    [count, safeIndex],
  );

  const goNext = useCallback(() => {
    navigateTo(safeIndex + 1);
  }, [navigateTo, safeIndex]);

  const goPrev = useCallback(() => {
    navigateTo(safeIndex - 1);
  }, [navigateTo, safeIndex]);

  // Auto-advance every 5 seconds (pauses on interaction, modal open, <=1 review, or prefers-reduced-motion)
  useEffect(() => {
    if (count <= 1 || isPaused || modalOpen || isDragging) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const cur = ((prev % count) + count) % count;
        setPreviousIndex(cur);
        return (cur + 1) % count;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [count, isPaused, modalOpen, isDragging]);

  // Portal Modal accessibility: lock background scroll only, focus close button (no unwanted mobile keyboard), restore scroll & focus on close
  useEffect(() => {
    if (!modalOpen) return;

    const triggerEl = triggerBtnRef.current;
    const savedScrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Focus close button without scrolling so user chooses when to open mobile keyboard
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener("keydown", handleKey);
      window.scrollTo({ top: savedScrollY, behavior: "instant" as ScrollBehavior });
      triggerEl?.focus({ preventScroll: true });
    };
  }, [modalOpen]);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (count <= 1) return;
    setIsPaused(true);
    setIsDragging(true);
    setDragOffsetPx(0);
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (count <= 1 || touchStartXRef.current === null) return;
    const currentX = e.touches[0]?.clientX;
    if (typeof currentX !== "number") return;
    const rawDelta = currentX - touchStartXRef.current;
    const damped = Math.max(-64, Math.min(64, rawDelta * 0.4));
    setDragOffsetPx(damped);
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(0);

    if (startX !== null && endX !== null && count > 1) {
      const deltaX = endX - startX;
      if (Math.abs(deltaX) > 40) {
        if (isAr) {
          if (deltaX > 0) goNext();
          else goPrev();
        } else {
          if (deltaX < 0) goNext();
          else goPrev();
        }
      }
    }

    setIsPaused(false);
  }

  function handleFieldFocus(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    // Keep focused input visible when mobile virtual keyboard opens
    const target = e.target;
    window.setTimeout(() => {
      target.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }, 180);
  }

  function handleSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Client-side check that preserves all inputs and focuses the first invalid field inside modal
    if (reviewerName.trim().length < 2) {
      const msg = isAr
        ? "يرجى كتابة الاسم (حرفين على الأقل)."
        : "Please enter your name (at least 2 characters).";
      setFormError(msg);
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
      return;
    }

    if (reviewerAge.trim().length < 1) {
      const msg = isAr
        ? "يرجى كتابة السن (مثال: 6 سنوات)."
        : "Please enter the age.";
      setFormError(msg);
      ageInputRef.current?.focus();
      ageInputRef.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
      return;
    }

    if (comment.trim().length < 5) {
      const msg = isAr
        ? "يرجى كتابة تعليق لا يقل عن 5 أحرف."
        : "Please write a comment (at least 5 characters).";
      setFormError(msg);
      commentInputRef.current?.focus();
      commentInputRef.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
      return;
    }

    if (comment.trim().length > MAX_REVIEW_COMMENT_LENGTH) {
      const msg = isAr
        ? `الحد الأقصى للتعليق هو ${MAX_REVIEW_COMMENT_LENGTH} حرفًا.`
        : `Maximum comment length is ${MAX_REVIEW_COMMENT_LENGTH} characters.`;
      setFormError(msg);
      commentInputRef.current?.focus();
      commentInputRef.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitCustomerReviewAction({
        reviewerName,
        reviewerAge,
        rating,
        comment,
      });

      if (!res.ok) {
        const msg =
          res.error ?? (isAr ? "تعذر إرسال رأيك" : "Could not submit review");
        setFormError(msg);
        showToast({
          variant: "error",
          title: msg,
        });
        return;
      }

      setModalOpen(false);
      setFormError(null);
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

  const activeReview = count > 0 ? reviews[safeIndex] : null;

  /**
   * Computes relative slot for each persistently mounted review card:
   *  0 -> active center upright (scale 1, rotate 0)
   * -1 -> previous card (tilted on leading side)
   * +1 -> next card (tilted on trailing side)
   *  2 -> parked behind (hidden until rotated into view)
   */
  function getCardSlot(idx: number): -1 | 0 | 1 | 2 {
    if (idx === safeIndex) return 0;
    if (count === 2) return 1;
    const prevIdx = (safeIndex - 1 + count) % count;
    const nextIdx = (safeIndex + 1) % count;
    if (idx === prevIdx) return -1;
    if (idx === nextIdx) return 1;
    return 2;
  }

  const modalContent =
    modalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-review-modal-title"
            className="raqeem-modal-backdrop fixed inset-0 z-[120] flex items-end justify-center bg-[#241747]/60 backdrop-blur-xs sm:items-center sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <div className="raqeem-modal-panel flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-[#E8E1F2] bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-lg sm:rounded-[28px]">
              {/* Sticky Header (always visible above mobile keyboard & navbar) */}
              <div className="relative flex shrink-0 flex-col border-b border-[#E8E1F2]/80 bg-white px-5 pt-3 pb-4 sm:px-7 sm:pt-6">
                {/* Mobile Bottom-Sheet Drag Indicator */}
                <div
                  aria-hidden="true"
                  className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E2D6F0] sm:hidden"
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      id="submit-review-modal-title"
                      className="text-lg font-extrabold text-[#241747] sm:text-xl"
                    >
                      {isAr ? "قول رأيك في الكتاب" : "Share Your Book Review"}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#625B75]">
                      {isAr
                        ? "رأيك يساعد غيرك يتعرف على جودة رقيم (يتم مراجعته قبل النشر)."
                        : "Your feedback helps others discover Raqeem (reviewed before publishing)."}
                    </p>
                  </div>

                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={() => setModalOpen(false)}
                    aria-label={isAr ? "إغلاق" : "Close"}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F8F5FF] text-[#241747] transition-colors hover:bg-[#F3EAFF] hover:text-[#6324c5]"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body (min-h-0 + overflow-y-auto for smooth touch scroll with keyboard open) */}
              <form
                onSubmit={handleSubmitReview}
                noValidate
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] touch-pan-y sm:px-7 sm:pt-5 sm:pb-7"
              >
                <div className="flex flex-col gap-4">
                  {formError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#D92D4B]/30 bg-[#FFF1F3] px-3.5 py-2.5 text-xs font-bold text-[#D92D4B]"
                    >
                      {formError}
                    </div>
                  )}

                  {/* Star Rating Picker */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-[#241747]">
                      {isAr
                        ? "التقييم (من 1 إلى 5 نجوم) *"
                        : "Rating (1–5 Stars) *"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(starVal)}
                          aria-label={`${starVal} نجوم`}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] transition-transform hover:scale-105"
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
                        ref={nameInputRef}
                        id="review-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={reviewerName}
                        onFocus={handleFieldFocus}
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
                        ref={ageInputRef}
                        id="review-age"
                        type="text"
                        required
                        minLength={1}
                        maxLength={40}
                        value={reviewerAge}
                        onFocus={handleFieldFocus}
                        onChange={(e) => setReviewerAge(e.target.value)}
                        placeholder={
                          isAr ? "مثال: 5 سنوات أو 25 سنة" : "e.g. 5 years"
                        }
                        className="h-11 rounded-xl border border-[#E8E1F2] bg-[#FAF8FF] px-3.5 text-sm text-[#241747] focus:border-[#6324c5] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="review-comment"
                        className="text-xs font-bold text-[#241747]"
                      >
                        {isAr ? "تعليقك عن الكتاب *" : "Your Comment *"}
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold tabular-nums",
                          comment.length >= MAX_REVIEW_COMMENT_LENGTH
                            ? "text-[#D92D4B]"
                            : "text-[#625B75]",
                        )}
                      >
                        {comment.length} / {MAX_REVIEW_COMMENT_LENGTH}
                      </span>
                    </div>
                    <textarea
                      ref={commentInputRef}
                      id="review-comment"
                      required
                      minLength={5}
                      maxLength={MAX_REVIEW_COMMENT_LENGTH}
                      rows={4}
                      value={comment}
                      onFocus={handleFieldFocus}
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
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    <span>{isAr ? "إرسال الرأي" : "Submit Review"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section
      id="testimonials-section"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden py-16 md:py-22"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 lg:px-10">
        {/* Centered Storybook Section Heading */}
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
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
          <div
            aria-hidden="true"
            className="mt-2.5 h-1.5 w-36 rounded-full bg-gradient-to-r from-[#C7A6F5] via-[#6324C5] to-[#F65C96] opacity-75"
          />
        </div>

        {/* Continuous 3-Card Stage (every review stays mounted by key={review.id} for 450ms physical glide) */}
        {activeReview ? (
          <div
            className="w-full touch-pan-y"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
              touchStartXRef.current = null;
              setIsDragging(false);
              setDragOffsetPx(0);
              setIsPaused(false);
            }}
          >
            {/* Fixed-height stage sized cleanly for full 160-char reviews with zero clipping */}
            <div
              className="relative mx-auto h-[455px] w-full max-w-5xl sm:h-[465px]"
              style={{
                transform: isDragging
                  ? `translate3d(${dragOffsetPx}px, 0, 0)`
                  : "translate3d(0, 0, 0)",
                transition: isDragging
                  ? "none"
                  : "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {reviews.map((rev, idx) => {
                const slot = getCardSlot(idx);
                const isCenter = slot === 0;
                const isOutgoing = previousIndex === idx && !isCenter;

                // RTL: prev (-1) sits on RIGHT (+1), next (+1) sits on LEFT (-1).
                // LTR: prev (-1) sits on LEFT (-1), next (+1) sits on RIGHT (+1).
                const dirSign =
                  slot === -1 ? (isAr ? 1 : -1) : slot === 1 ? (isAr ? -1 : 1) : 0;

                const isParked = slot === 2;
                const translateXPercent = isParked ? 0 : dirSign * 96;
                const rotateDeg = isParked ? 0 : dirSign * 5;
                const scaleVal = isCenter ? 1 : isParked ? 0.78 : 0.87;
                const zIndexVal = isCenter
                  ? 30
                  : isOutgoing
                    ? 22
                    : isParked
                      ? 5
                      : 15;

                // Hide side cards smoothly on narrow mobile while keeping them mounted for glide transitions
                const mobileSideClass =
                  !isCenter && !isParked
                    ? "opacity-0 pointer-events-none md:opacity-92 md:pointer-events-auto"
                    : isParked
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100 pointer-events-auto";

                return (
                  <div
                    key={rev.id}
                    role={isCenter ? "article" : "button"}
                    tabIndex={isCenter || isParked ? undefined : 0}
                    onClick={!isCenter && !isParked ? () => navigateTo(idx) : undefined}
                    onKeyDown={
                      !isCenter && !isParked
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigateTo(idx);
                            }
                          }
                        : undefined
                    }
                    aria-label={
                      !isCenter && !isParked
                        ? isAr
                          ? `عرض رأي ${rev.reviewer_name}`
                          : `View review by ${rev.reviewer_name}`
                        : undefined
                    }
                    aria-hidden={isParked ? true : undefined}
                    className={cn(
                      "absolute top-1/2 left-1/2 h-[425px] w-[92%] max-w-[355px] sm:h-[435px] sm:w-[375px] md:max-w-[365px]",
                      "transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-150",
                      !isCenter && "cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6324C5]",
                      mobileSideClass,
                    )}
                    style={{
                      zIndex: zIndexVal,
                      transform: `translate3d(calc(-50% + ${translateXPercent}%), -50%, 0) scale(${scaleVal}) rotate(${rotateDeg}deg)`,
                    }}
                  >
                    <StorybookReviewCardInner
                      review={rev}
                      isCenter={isCenter}
                      isAr={isAr}
                    />
                  </div>
                );
              })}
            </div>

            {/* Arrows & Pagination Dots below the cards (hidden when <= 1 review) */}
            {count > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={goPrev}
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
                    const isActive = rev.id === activeReview.id;
                    return (
                      <button
                        key={rev.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => navigateTo(idx)}
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
                  onClick={goNext}
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
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="inline-flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-full bg-[#6324C5] px-8 py-3 text-base font-extrabold text-white shadow-[0_10px_26px_-6px_rgba(99,36,197,0.5)] transition-all hover:-translate-y-0.5 hover:bg-[#541CA9] active:translate-y-0"
          >
            <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            <span>{isAr ? "قول رأيك في الكتاب" : "Share Your Review"}</span>
          </button>
        </div>
      </div>

      {modalContent}
    </section>
  );
}
