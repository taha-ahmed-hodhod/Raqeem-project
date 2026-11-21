"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { PosterPopupSettings } from "@/lib/supabase/types";

const SESSION_KEY = "raqeem_poster_dismissed_v1";

export function PromotionalPosterPopup({
  poster,
}: {
  poster: PosterPopupSettings;
}) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const hasValidPoster = Boolean(
    poster.enabled && poster.imageUrl && poster.imageUrl.trim().length > 0,
  );

  useEffect(() => {
    if (!hasValidPoster || typeof window === "undefined") return;

    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") {
        return;
      }
    } catch {
      // sessionStorage may be blocked
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [hasValidPoster]);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!open || !hasValidPoster || !poster.imageUrl) {
    return null;
  }

  const buttonText = isAr ? poster.buttonTextAr : poster.buttonTextEn;
  const isExternal = /^https?:\/\//i.test(poster.buttonUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "عرض خاص من رقيم" : "Raqeem Special Poster"}
      className="raqeem-modal-backdrop fixed inset-0 z-[95] flex items-center justify-center bg-[#241747]/65 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="raqeem-modal-panel relative flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={dismiss}
          aria-label={isAr ? "إغلاق البوستر" : "Close poster"}
          className="absolute top-3 end-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#241747] shadow-md transition-colors hover:bg-[#F3EAFF] hover:text-[#6324c5]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative w-full bg-[#F8F5FF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster.imageUrl}
            alt={buttonText}
            className="max-h-[65dvh] w-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <a
            href={poster.buttonUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={dismiss}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#6324c5] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#541CA9]"
          >
            {buttonText}
          </a>
        </div>
      </div>
    </div>
  );
}
