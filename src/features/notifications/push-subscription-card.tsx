"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  Loader2,
  Send,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
  sendTestPushAction,
} from "./actions";

export interface PushSubscriptionCardProps {
  vapidPublicKey: string | null;
  vapidServerConfigured: boolean;
  savedDevicesCount: number;
}

type PushBrowserState =
  | "checking"
  | "unsupported"
  | "ios_needs_install"
  | "denied"
  | "prompt"
  | "subscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIosNonStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return isIos && !isStandalone;
}

export function PushSubscriptionCard({
  vapidPublicKey,
  vapidServerConfigured,
  savedDevicesCount,
}: PushSubscriptionCardProps) {
  const [state, setState] = useState<PushBrowserState>("checking");
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function inspectSupport() {
      if (typeof window === "undefined") return;

      if (isIosNonStandalone()) {
        if (active) setState("ios_needs_install");
        return;
      }

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (active) setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (active) setState("denied");
        return;
      }

      try {
        const reg =
          (await navigator.serviceWorker.getRegistration("/")) ??
          (await navigator.serviceWorker.getRegistration("/sw.js"));
        const existingSub = reg
          ? await reg.pushManager.getSubscription()
          : null;

        if (active) {
          if (existingSub) {
            setCurrentEndpoint(existingSub.endpoint);
            setState("subscribed");
          } else {
            setState("prompt");
          }
        }
      } catch {
        if (active) setState("prompt");
      }
    }

    inspectSupport();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Explicitly triggered ONLY when the admin clicks the enable button.
   * Never auto-requests browser Notification permission on page load.
   */
  const handleEnablePush = () => {
    setFeedback(null);

    if (!vapidPublicKey || !vapidServerConfigured) {
      setFeedback({
        type: "error",
        text: "مفاتيح VAPID غير مضبوطة بعد في ملف البيئة (.env.local / Vercel).",
      });
      return;
    }

    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "denied" : "prompt");
          setFeedback({
            type: "error",
            text: "لم يتم منح إذن الإشعارات من المتصفح. الإشعارات داخل اللوحة والبريد الإلكتروني ستعمل كبديل تلقائي.",
          });
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setFeedback({
            type: "error",
            text: "تعذر استخراج مفاتيح الاشتراك من المتصفح.",
          });
          return;
        }

        const res = await savePushSubscriptionAction({
          endpoint: json.endpoint,
          expirationTime: json.expirationTime ?? null,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
          userAgent: navigator.userAgent.slice(0, 380),
        });

        if (!res.ok) {
          setFeedback({
            type: "error",
            text: res.error ?? "تعذر حفظ اشتراك الإشعارات.",
          });
          return;
        }

        setCurrentEndpoint(json.endpoint);
        setState("subscribed");
        setFeedback({
          type: "success",
          text: "تم تفعيل إشعارات المتصفح على هذا الجهاز بنجاح!",
        });
      } catch {
        setFeedback({
          type: "error",
          text: "حدث خطأ أثناء تفعيل إشعارات المتصفح. تأكد من فتح الموقع عبر HTTPS أو localhost.",
        });
      }
    });
  };

  const handleUnsubscribe = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration("/")) ??
          (await navigator.serviceWorker.getRegistration("/sw.js"));
        const existingSub = reg
          ? await reg.pushManager.getSubscription()
          : null;
        const endpointToDelete = existingSub?.endpoint ?? currentEndpoint;

        if (existingSub) {
          await existingSub.unsubscribe();
        }
        if (endpointToDelete) {
          await removePushSubscriptionAction(endpointToDelete);
        }

        setCurrentEndpoint(null);
        setState("prompt");
        setFeedback({
          type: "success",
          text: "تم إلغاء اشتراك إشعارات المتصفح من هذا الجهاز.",
        });
      } catch {
        setFeedback({
          type: "error",
          text: "تعذر إلغاء الاشتراك حالياً.",
        });
      }
    });
  };

  const handleTestPush = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await sendTestPushAction();
      if (res.ok) {
        setFeedback({
          type: "success",
          text: `تم إرسال إشعار تجريبي إلى ${res.delivered} جهاز بنجاح.`,
        });
      } else {
        setFeedback({
          type: "error",
          text:
            res.error === "vapid_not_configured"
              ? "مفاتيح VAPID غير مضبوطة في الخادم."
              : "تعذر إرسال الإشعار التجريبي. تأكد من وجود جهاز مشترك.",
        });
      }
    });
  };

  return (
    <section
      aria-labelledby="web-push-heading"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary-500" aria-hidden="true" />
          <h2
            id="web-push-heading"
            className="text-lg font-extrabold text-foreground"
          >
            إشعارات المتصفح الفورية (Web Push / PWA)
          </h2>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          <span>الأجهزة المسجلة: {savedDevicesCount}</span>
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        فعّل الإشعارات مرة واحدة على جهازك ليصلك تنبيه فوري بعنوان «رقيم — طلب
        جديد» فور إرسال أي عميل لطلب جديد (حتى لو المتصفح مقفول)، بدون عرض
        بيانات العميل أو صور الأطفال على شاشة القفل.
      </p>

      {!vapidServerConfigured && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-accent-yellow-50/70 p-3.5 text-xs text-warning"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-bold">مفاتيح VAPID غير مضافة بعد</p>
            <p className="mt-0.5 text-foreground/80">
              لتشغيل إشعارات المتصفح، أضف{" "}
              <code className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> و
              <code className="font-mono">VAPID_PRIVATE_KEY</code> و
              <code className="font-mono">VAPID_SUBJECT</code> في{" "}
              <code className="font-mono">.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {state === "ios_needs_install" && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-50/60 p-3.5 text-xs leading-relaxed text-foreground">
          <p className="font-bold text-primary-700">
            ملاحظة لأجهزة iPhone / iPad (iOS Safari):
          </p>
          <p className="mt-1 text-muted-foreground">
            يتطلب نظام iOS تثبيت لوحة التحكم على الشاشة الرئيسية أولاً عبر زر
            المشاركة ← <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>
            ، ثم فتح التطبيق من الأيقونة لتفعيل إشعارات Web Push.
          </p>
        </div>
      )}

      {state === "unsupported" && (
        <div className="rounded-xl border border-border bg-background p-3.5 text-xs text-muted-foreground">
          هذا المتصفح لا يدعم إشعارات Web Push أو أن الاتصال ليس عبر HTTPS.
          ستظل جميع التنبيهات محفوظة هنا في مركز الإشعارات وتُرسل عبر البريد
          الإلكتروني.
        </div>
      )}

      {state === "denied" && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/5 p-3.5 text-xs text-error"
        >
          <BellOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">تم حظر إذن الإشعارات في هذا المتصفح</p>
            <p className="mt-0.5 text-foreground/80">
              لإعادة التفعيل، افتح إعدادات الموقع من شريط العنوان واسمح
              بالإشعارات. لا تقلق: الإشعارات داخل لوحة التحكم والبريد الإلكتروني
              لا تزال تعمل تلقائياً.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {(state === "prompt" || state === "checking") && (
          <button
            type="button"
            disabled={isPending || state === "checking" || !vapidServerConfigured}
            onClick={handleEnablePush}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <BellRing className="h-4 w-4" aria-hidden="true" />
            )}
            <span>تفعيل إشعارات الطلبات على هذا الجهاز</span>
          </button>
        )}

        {state === "subscribed" && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-3.5 py-2 text-xs font-extrabold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>مُفعّلة على هذا الجهاز</span>
            </span>

            <button
              type="button"
              disabled={isPending}
              onClick={handleTestPush}
              className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-primary-500/30 bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>إرسال إشعار تجريبي</span>
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleUnsubscribe}
              className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:text-error disabled:opacity-60"
            >
              <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>إيقاف على هذا الجهاز</span>
            </button>
          </>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className={`rounded-xl px-3.5 py-2.5 text-xs font-bold ${feedback.type === "success"
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
            }`}
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}
