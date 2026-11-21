"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "fade-in" | "scale-in";
}

/**
 * Lightweight, GPU-accelerated scroll reveal (Animate.css / Anime.js feel).
 * - Animates once on first viewport entry.
 * - Immediately visible when `prefers-reduced-motion: reduce` is enabled.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  variant = "fade-up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenClasses =
    variant === "scale-in"
      ? "opacity-0 scale-[0.96]"
      : variant === "fade-in"
        ? "opacity-0"
        : "opacity-0 translate-y-5";

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn(
        "raqeem-reveal transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible ? "translate-y-0 scale-100 opacity-100" : hiddenClasses,
        className,
      )}
    >
      {children}
    </div>
  );
}
