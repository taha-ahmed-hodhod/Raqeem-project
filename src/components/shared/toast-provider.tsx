"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  actionHref?: string;
  actionLabel?: string;
}

interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op fallback for isolated unit tests rendered without ToastProvider
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      counterRef.current += 1;
      const id = `toast-${Date.now()}-${counterRef.current}`;
      const variant = input.variant ?? "info";
      const durationMs = input.durationMs ?? (variant === "error" ? 6500 : 5000);

      setToasts((prev) => [...prev.slice(-3), { ...input, id, variant }]);

      if (durationMs > 0 && typeof window !== "undefined") {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, durationMs);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Accessible Global Toast Viewport */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-24 z-[100] mx-auto flex max-w-md flex-col gap-2.5 sm:inset-x-auto sm:end-6 sm:top-6 sm:w-full"
      >
        {toasts.map((item) => {
          const Icon =
            item.variant === "success"
              ? CheckCircle2
              : item.variant === "error"
                ? AlertCircle
                : item.variant === "warning"
                  ? BellRing
                  : Info;

          const toneClass =
            item.variant === "success"
              ? "border-[#16875D]/30 bg-white text-[#241747] shadow-[0_12px_32px_-8px_rgba(22,135,93,0.22)]"
              : item.variant === "error"
                ? "border-[#D92D4B]/35 bg-white text-[#241747] shadow-[0_12px_32px_-8px_rgba(217,45,75,0.24)]"
                : item.variant === "warning"
                  ? "border-[#FFC928]/60 bg-white text-[#241747] shadow-[0_12px_32px_-8px_rgba(183,107,0,0.20)]"
                  : "border-[#6324C5]/25 bg-white text-[#241747] shadow-[0_12px_32px_-8px_rgba(99,36,197,0.18)]";

          const iconColor =
            item.variant === "success"
              ? "text-[#16875D]"
              : item.variant === "error"
                ? "text-[#D92D4B]"
                : item.variant === "warning"
                  ? "text-[#B76B00]"
                  : "text-[#6324C5]";

          return (
            <div
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
              className={cn(
                "raqeem-toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-md",
                toneClass,
              )}
            >
              <Icon
                className={cn("mt-0.5 h-5 w-5 shrink-0", iconColor)}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-extrabold leading-snug">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs leading-relaxed text-[#625B75]">
                    {item.description}
                  </p>
                )}
                {item.actionHref && item.actionLabel && (
                  <Link
                    href={item.actionHref}
                    onClick={() => dismissToast(item.id)}
                    className="mt-1 inline-flex w-fit items-center rounded-lg bg-[#6324C5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#541CA9]"
                  >
                    {item.actionLabel}
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="إغلاق التنبيه"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#625B75] hover:bg-[#F3EAFF] hover:text-[#241747]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
