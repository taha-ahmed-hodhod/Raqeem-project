import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Mail,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getPublicEnv } from "@/lib/env";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { markNotificationReadAction } from "@/features/admin/actions";
import { getNotificationChannelsStatus } from "@/features/notifications/dispatcher";
import { dispatchOutboxNowAction } from "@/features/notifications/actions";
import { PushSubscriptionCard } from "@/features/notifications/push-subscription-card";

export default async function AdminNotificationsPage() {
  const { notifications, outbox, pushSubscriptionsCount } =
    await getAdminCommercialAndCmsData();
  const channels = getNotificationChannelsStatus();
  const publicEnv = getPublicEnv();
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const pendingOutboxCount = outbox.filter(
    (item) => item.status === "pending" || item.status === "failed",
  ).length;

  async function handleMarkRead(formData: FormData) {
    "use server";
    await markNotificationReadAction(formData);
  }

  async function handleDispatchOutbox() {
    "use server";
    await dispatchOutboxNowAction();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            إشعارات الطلبات للأدمن ({unreadCount} غير مقروء)
          </h1>
          <p className="text-sm text-muted-foreground">
            تنبيهات تلقائية موجهة للأدمن فقط فور حفظ أي طلب جديد من العميل:
            بريد إلكتروني بالتفاصيل الكاملة + إشعار فوري للموبايل (Web Push)
            بدون بيانات شخصية على شاشة القفل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pendingOutboxCount > 0 && (
            <form action={handleDispatchOutbox}>
              <button
                type="submit"
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-50 px-4 py-2 text-xs font-extrabold text-primary-700 hover:bg-primary-100"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>إعادة محاولة القناة الفاشلة ({pendingOutboxCount})</span>
              </button>
            </form>
          )}

          {unreadCount > 0 && (
            <form action={handleMarkRead}>
              <input type="hidden" name="notificationId" value="all" />
              <button
                type="submit"
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-primary-600"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                <span>تحديد الكل كمقروء</span>
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Channel Health Overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-success"
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-foreground">
              إشعارات اللوحة (In-App DB)
            </span>
            <span className="text-[11px] font-semibold text-success">
              مفعلة وتعمل دائماً مع كل طلب جديد
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          {channels.vapidConfigured ? (
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="h-5 w-5 shrink-0 text-warning"
              aria-hidden="true"
            />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-foreground">
              إشعارات المتصفح (VAPID Web Push)
            </span>
            <span
              className={`text-[11px] font-semibold ${channels.vapidConfigured ? "text-success" : "text-warning"
                }`}
            >
              {channels.vapidConfigured
                ? `جاهز (${pushSubscriptionsCount} جهاز مشترك)`
                : "بانتظار مفاتيح VAPID في البيئة"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          {channels.resendConfigured ? (
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="h-5 w-5 shrink-0 text-warning"
              aria-hidden="true"
            />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-foreground">
              البريد الإلكتروني (Resend)
            </span>
            <span
              className={`text-[11px] font-semibold ${channels.resendConfigured ? "text-success" : "text-warning"
                }`}
            >
              {channels.resendConfigured
                ? `مفعل (${channels.adminNotificationEmail})`
                : "بانتظار RESEND_API_KEY في البيئة"}
            </span>
          </div>
        </div>
      </section>

      {/* Opt-In Browser Web Push Subscription Management */}
      <PushSubscriptionCard
        vapidPublicKey={publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
        vapidServerConfigured={channels.vapidConfigured}
        savedDevicesCount={pushSubscriptionsCount}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* In-App Notifications Feed */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <Bell className="h-5 w-5 text-primary-500" aria-hidden="true" />
            <h2 className="text-lg font-extrabold text-foreground">
              إشعارات لوحة التحكم ({notifications.length})
            </h2>
          </div>

          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد إشعارات مسجلة حتى الآن.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {notifications.map((notif) => {
                const isUnread = !notif.read_at;
                return (
                  <li
                    key={notif.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${isUnread
                        ? "border-primary-500/40 bg-primary-50/50"
                        : "border-border bg-background"
                      }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="h-2.5 w-2.5 rounded-full bg-secondary-pink" />
                        )}
                        <span className="text-sm font-extrabold text-foreground">
                          {notif.title_ar}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleString("ar-EG")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {notif.order_id && (
                        <Link
                          href={`/admin/orders/${notif.order_id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-500 px-3 text-xs font-bold text-white hover:bg-primary-600"
                        >
                          <span>فتح الطلب</span>
                          <ExternalLink
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </Link>
                      )}

                      {isUnread && (
                        <form action={handleMarkRead}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notif.id}
                          />
                          <button
                            type="submit"
                            className="h-8 cursor-pointer rounded-lg border border-border bg-surface px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                          >
                            كمقروء
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Outbox Queue Status */}
        <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-500" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-foreground">
                سجل الإرسال التلقائي للأدمن
              </h2>
            </div>

            {pendingOutboxCount > 0 && (
              <form action={handleDispatchOutbox}>
                <button
                  type="submit"
                  className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[11px] font-bold text-foreground hover:bg-primary-50"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  <span>إعادة محاولة الفاشل</span>
                </button>
              </form>
            )}
          </div>

          {outbox.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              لا توجد مهام في طابور الإرسال حالياً.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-xs">
              {outbox.slice(0, 20).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">
                      {item.channel === "web_push"
                        ? "إشعار متصفح (Web Push)"
                        : "بريد إلكتروني (Resend Email)"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-bold ${item.status === "sent"
                          ? "bg-success/10 text-success"
                          : item.status === "failed"
                            ? "bg-error/10 text-error"
                            : "bg-accent-yellow-50 text-warning"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">محاولات: {item.attempts}</span>
                    {item.sent_at ? (
                      <span>
                        أُرسل:{" "}
                        {new Date(item.sent_at).toLocaleTimeString("ar-EG")}
                      </span>
                    ) : (
                      <span>
                        تاريخ:{" "}
                        {new Date(item.created_at).toLocaleTimeString("ar-EG")}
                      </span>
                    )}
                  </div>

                  {item.last_error && (
                    <p
                      dir="ltr"
                      className="truncate rounded-lg bg-error/5 px-2 py-1 font-mono text-[10px] text-error"
                      title={item.last_error}
                    >
                      {item.last_error}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
