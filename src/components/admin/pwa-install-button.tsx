"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const emptySubscribe = () => () => {};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || "");
}

/**
 * Admin-Only PWA Install Control.
 * - Mounted ONLY inside `/admin/(protected)` (AdminShell), never on public pages.
 * - Registers `/sw.js` scoped strictly to `/admin`.
 * - Captures `beforeinstallprompt` and provides a one-click install button.
 */
export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedNow, setInstalledNow] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isStandalone = useSyncExternalStore(
    emptySubscribe,
    detectStandalone,
    () => false,
  );
  const isIos = useSyncExternalStore(emptySubscribe, detectIos, () => false);
  const isInstalled = isStandalone || installedNow;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register full-site Service Worker (scope: "/") from the dashboard
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Ignore registration errors in unsupported/non-HTTPS environments
        });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledNow(true);
      setDeferredPrompt(null);
      setShowHint(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalledNow(true);
      }
      setDeferredPrompt(null);
      return;
    }

    setShowHint((prev) => !prev);
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-bold text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>التطبيق مثبّت على جهازك</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-500/30 bg-primary-50 px-3 py-2 text-xs font-extrabold text-primary-700 transition-colors hover:bg-primary-100"
      >
        {isIos ? (
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>تثبيت تطبيق رقيم</span>
      </button>

      {showHint && (
        <p className="rounded-xl border border-border bg-background p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          {isIos
            ? "على iPhone/iPad: اضغط زر المشاركة في Safari ثم اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen)."
            : "لتثبيت التطبيق: اضغط على أيقونة التثبيت في شريط العنوان أعلى المتصفح (أو القائمة ← تثبيت التطبيق)."}
        </p>
      )}
    </div>
  );
}
