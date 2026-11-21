import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  MAX_OUTBOX_ATTEMPTS,
  buildAdminOrderEmailPayload,
  buildSafeWebPushPayload,
  computeNextRetryAt,
  isExpiredPushSubscriptionError,
  type AdminEmailOrderDetails,
} from "@/features/notifications/payload";
import {
  dispatchNotificationOutboxWithDeps,
  type OutboxDispatcherDeps,
  type OutboxRecord,
} from "@/features/notifications/dispatcher";
import { PushSubscriptionCard } from "@/features/notifications/push-subscription-card";

vi.mock("@/features/notifications/actions", () => ({
  savePushSubscriptionAction: vi.fn(async () => ({ ok: true })),
  removePushSubscriptionAction: vi.fn(async () => ({ ok: true })),
  sendTestPushAction: vi.fn(async () => ({
    ok: true,
    delivered: 1,
    expiredRemoved: 0,
  })),
}));

const SAMPLE_ORDER_ID = "11111111-2222-4333-8444-555555555555";

const SAMPLE_ORDER_DETAILS: AdminEmailOrderDetails = {
  orderId: SAMPLE_ORDER_ID,
  reference: "RQM-AB12CD34",
  createdAt: "2026-11-20T18:00:00.000Z",
  customerName: "أحمد محمود",
  phone: "01012345678",
  whatsappPhone: "01198765432",
  governorateNameAr: "القاهرة",
  address: "مدينة نصر، شارع عباس العقاد، عمارة 12",
  notes: "التوصيل بعد الساعة 5 مساءً",
  subtotalPiastres: 60000,
  discountPercent: 10,
  discountPiastres: 6000,
  booksTotalPiastres: 54000,
  shippingPiastres: null,
  items: [
    {
      itemIndex: 0,
      pageCount: 12,
      quantity: 1,
      unitPricePiastres: 25000,
      childName: "سليم",
      childAge: 5,
      interests: "الفضاء والديناصورات",
      notes: "يحب اللون الأزرق",
      hasPhoto: true,
    },
    {
      itemIndex: 1,
      pageCount: 24,
      quantity: 1,
      unitPricePiastres: 35000,
      childName: "فريدة",
      childAge: 4,
      interests: "الفراشات والحدائق",
      notes: null,
      hasPhoto: true,
    },
  ],
};

function createMockOutboxDeps(
  overrides: Partial<OutboxDispatcherDeps> = {},
): OutboxDispatcherDeps {
  return {
    fetchDueOutbox: vi.fn(async () => []),
    fetchOrderDetails: vi.fn(async () => SAMPLE_ORDER_DETAILS),
    fetchPushSubscriptions: vi.fn(async () => [
      {
        endpoint: "https://push.example.com/sub-1",
        subscription: {
          endpoint: "https://push.example.com/sub-1",
          keys: { p256dh: "key-p256dh-1", auth: "key-auth-1" },
        },
      },
    ]),
    deletePushSubscription: vi.fn(async () => { }),
    updateOutboxRow: vi.fn(async () => { }),
    sendWebPush: vi.fn(async () => { }),
    sendEmail: vi.fn(async () => { }),
    config: {
      appUrl: "https://raqeem.example.com",
      vapidPublicKey: "BPublicVapidKeyExample",
      vapidPrivateKey: "PrivateVapidKeyExample",
      vapidSubject: "mailto:admin@raqeem.example.com",
      resendApiKey: "re_test_key",
      resendFromEmail: "alerts@raqeem.example.com",
      adminNotificationEmail: "admin@raqeem.example.com",
    },
    ...overrides,
  };
}

  describe("M5 — Admin-Only Automatic Notifications (Email + Web Push + PWA)", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

        describe("Lock-Screen-Safe Web Push & Detailed Admin Email Payloads", () => {
          it("builds strictly PII-free Web Push payload with exact Arabic title/body and order link", () => {
            const push = buildSafeWebPushPayload({
              orderId: SAMPLE_ORDER_ID,
              reference: "RQM-AB12CD34",
            });

            expect(push.title).toBe("رقيم — طلب جديد");
            expect(push.body).toBe("وصل طلب جديد. اضغط لعرض التفاصيل");
            expect(push.url).toBe(`/admin/orders/${SAMPLE_ORDER_ID}`);
            expect(push.tag).toBe(`raqeem-order-${SAMPLE_ORDER_ID}`);

      // Must NEVER contain customer or child PII on lock screen
      const serialized = JSON.stringify(push);
            expect(serialized).not.toContain("أحمد محمود");
            expect(serialized).not.toContain("01012345678");
            expect(serialized).not.toContain("سليم");
            expect(serialized).not.toContain("مدينة نصر");
          });

          it("builds detailed admin email with full order snapshot, EGP pricing, pending shipping label, and private dashboard link", () => {
            const email = buildAdminOrderEmailPayload(
              SAMPLE_ORDER_DETAILS,
              "https://raqeem.eg/",
            );

            expect(email.subject).toBe("طلب جديد في رقيم — RQM-AB12CD34");
            expect(email.adminOrderUrl).toBe(
              `https://raqeem.eg/admin/orders/${SAMPLE_ORDER_ID}`,
            );

            // Customer & delivery details
            expect(email.html).toContain("أحمد محمود");
            expect(email.html).toContain("01012345678");
            expect(email.html).toContain("01198765432");
            expect(email.html).toContain("القاهرة");
            expect(email.html).toContain("مدينة نصر، شارع عباس العقاد، عمارة 12");
            expect(email.html).toContain("التوصيل بعد الساعة 5 مساءً");

            // Book items & child customization details
            expect(email.html).toContain("باقة 12 صفحة × 1");
            expect(email.html).toContain("باقة 24 صفحة × 1");
            expect(email.html).toContain("سليم");
            expect(email.html).toContain("الفضاء والديناصورات");
            expect(email.html).toContain("فريدة");

            // EGP pricing snapshot & pending shipping wording
            expect(email.html).toContain("600 ج.م");
            expect(email.html).toContain("-60 ج.م");
            expect(email.html).toContain("الشحن بانتظار التأكيد");
            expect(email.html).toContain("540 ج.م");

            // Private photo link goes ONLY to protected dashboard, no raw storage URL
            expect(email.html).toContain(email.adminOrderUrl);
            expect(email.html).not.toContain("child-photos/");
            expect(email.text).toContain("الشحن بانتظار التأكيد");
          });

          it("detects expired 404/410 push errors and computes increasing retry backoff", () => {
            expect(isExpiredPushSubscriptionError({ statusCode: 410 })).toBe(true);
            expect(isExpiredPushSubscriptionError({ statusCode: 404 })).toBe(true);
            expect(isExpiredPushSubscriptionError({ statusCode: 500 })).toBe(false);

            const base = new Date("2026-11-20T12:00:00.000Z");
            const retry1 = new Date(computeNextRetryAt(1, base)).getTime();
            const retry2 = new Date(computeNextRetryAt(2, base)).getTime();
            const retry3 = new Date(computeNextRetryAt(3, base)).getTime();
            expect(retry2).toBeGreaterThan(retry1);
            expect(retry3).toBeGreaterThan(retry2);
          });
        });

            describe("Independent Outbox Channels, Retry & Expired Subscription Cleanup", () => {
              it("delivers Web Push even if Email fails, and retries ONLY the failed channel", async () => {
                const rows: OutboxRecord[] = [
                  {
                    id: "outbox-push-1",
                    event_key: `order_created:${SAMPLE_ORDER_ID}:web_push`,
                    order_id: SAMPLE_ORDER_ID,
                    channel: "web_push",
                    status: "pending",
                    attempts: 0,
                    last_error: null,
                    next_retry_at: "2026-11-20T18:00:00.000Z",
                    sent_at: null,
                    created_at: "2026-11-20T18:00:00.000Z",
                  },
                  {
                    id: "outbox-email-1",
                    event_key: `order_created:${SAMPLE_ORDER_ID}:email`,
                    order_id: SAMPLE_ORDER_ID,
                    channel: "email",
                    status: "pending",
                    attempts: 0,
                    last_error: null,
                    next_retry_at: "2026-11-20T18:00:00.000Z",
                    sent_at: null,
                    created_at: "2026-11-20T18:00:00.000Z",
                  },
                ];

                const deps = createMockOutboxDeps({
                  fetchDueOutbox: vi.fn(async () => rows),
                  sendEmail: vi.fn(async () => {
                    throw new Error("resend_temporary_503");
                  }),
                });

                const summary = await dispatchNotificationOutboxWithDeps(deps);

                expect(summary.processed).toBe(2);
                expect(summary.sent).toBe(1);
                expect(summary.failed).toBe(1);
                expect(deps.sendWebPush).toHaveBeenCalledTimes(1);
                expect(deps.updateOutboxRow).toHaveBeenCalledWith(
                  "outbox-push-1",
                  expect.objectContaining({ status: "sent", attempts: 1, last_error: null }),
                );
                expect(deps.updateOutboxRow).toHaveBeenCalledWith(
                  "outbox-email-1",
                  expect.objectContaining({
                    status: "pending",
                    attempts: 1,
                    last_error: "resend_temporary_503",
                  }),
                );
              });

              it("removes expired (410 Gone) push subscriptions automatically while still delivering to healthy devices", async () => {
                const rows: OutboxRecord[] = [
                  {
                    id: "outbox-push-2",
                    event_key: `order_created:${SAMPLE_ORDER_ID}:web_push`,
                    order_id: SAMPLE_ORDER_ID,
                    channel: "web_push",
                    status: "pending",
                    attempts: 0,
                    last_error: null,
                    next_retry_at: "2026-11-20T18:00:00.000Z",
                    sent_at: null,
                    created_at: "2026-11-20T18:00:00.000Z",
                  },
                ];

                const deps = createMockOutboxDeps({
                  fetchDueOutbox: vi.fn(async () => rows),
                  fetchPushSubscriptions: vi.fn(async () => [
                    {
                      endpoint: "https://push.example.com/expired",
                      subscription: {
                        endpoint: "https://push.example.com/expired",
                        keys: { p256dh: "old", auth: "old" },
                      },
                    },
                    {
                      endpoint: "https://push.example.com/active",
                      subscription: {
                        endpoint: "https://push.example.com/active",
                        keys: { p256dh: "new", auth: "new" },
                      },
                    },
                  ]),
                  sendWebPush: vi.fn(async (sub) => {
                    if (sub.endpoint.includes("expired")) {
                      const err = new Error("Gone") as Error & { statusCode: number };
                      err.statusCode = 410;
                      throw err;
                    }
                  }),
                });

                const summary = await dispatchNotificationOutboxWithDeps(deps);

                expect(summary.sent).toBe(1);
                expect(summary.expiredSubscriptionsRemoved).toBe(1);
                expect(deps.deletePushSubscription).toHaveBeenCalledWith(
                  "https://push.example.com/expired",
                );
              });

                it("skips already-sent rows (idempotency) and marks permanently failed after MAX_OUTBOX_ATTEMPTS", async () => {
                  const rows: OutboxRecord[] = [
                    {
                      id: "outbox-already-sent",
                      event_key: `order_created:${SAMPLE_ORDER_ID}:web_push`,
                      order_id: SAMPLE_ORDER_ID,
                      channel: "web_push",
                      status: "sent",
                      attempts: 1,
                      last_error: null,
                      next_retry_at: "2026-11-20T18:00:00.000Z",
                      sent_at: "2026-11-20T18:01:00.000Z",
                      created_at: "2026-11-20T18:00:00.000Z",
                    },
                    {
                      id: "outbox-final-fail",
                      event_key: `order_created:${SAMPLE_ORDER_ID}:email:2`,
                      order_id: SAMPLE_ORDER_ID,
                      channel: "email",
                      status: "pending",
                      attempts: MAX_OUTBOX_ATTEMPTS - 1,
                      last_error: "timeout",
                      next_retry_at: "2026-11-20T18:00:00.000Z",
                      sent_at: null,
                      created_at: "2026-11-20T18:00:00.000Z",
                    },
                  ];

                  const deps = createMockOutboxDeps({
                    fetchDueOutbox: vi.fn(async () => rows),
                    sendEmail: vi.fn(async () => {
                      throw new Error("resend_permanent_failure");
                    }),
                  });

                  const summary = await dispatchNotificationOutboxWithDeps(deps);

                  expect(summary.skipped).toBe(1);
                  expect(summary.failed).toBe(1);
                  expect(deps.sendWebPush).not.toHaveBeenCalled();
                  expect(deps.updateOutboxRow).toHaveBeenCalledWith(
                    "outbox-final-fail",
                    expect.objectContaining({
                      status: "failed",
                      attempts: MAX_OUTBOX_ATTEMPTS,
                      last_error: "resend_permanent_failure",
                    }),
                  );
                });
              });

              describe("PushSubscriptionCard UI (Opt-In & Permission Denied Fallback)", () => {
                it("never auto-prompts for Notification permission on mount and shows denied fallback when blocked", async () => {
                  const requestPermissionMock = vi.fn(async () => "denied");

                  Object.defineProperty(window, "Notification", {
                    configurable: true,
                    value: {
                      permission: "denied",
                      requestPermission: requestPermissionMock,
                    },
                  });
                  Object.defineProperty(window, "PushManager", {
                    configurable: true,
                    value: class { },
                  });
                  Object.defineProperty(navigator, "serviceWorker", {
                    configurable: true,
                    value: {
                      getRegistration: vi.fn(async () => null),
                    },
                  });

                  render(
                    <PushSubscriptionCard
                      vapidPublicKey="BPublicKey"
                      vapidServerConfigured={true}
                      savedDevicesCount={0}
                    />,
                  );

                  await waitFor(() => {
                    expect(
                      screen.getByText(/تم حظر إذن الإشعارات في هذا المتصفح/),
                    ).toBeInTheDocument();
                  });

                  expect(requestPermissionMock).not.toHaveBeenCalled();
                });
              });

              describe("Service Worker (public/sw.js) Push Display & Click Routing", () => {
                  it("displays lock-screen-safe Arabic notification on push and routes click to /admin/orders/[id]", async () => {
                    const swSource = fs.readFileSync(
                      path.join(process.cwd(), "public", "sw.js"),
                      "utf8",
                    );

                    const listeners: Record<string, (event: unknown) => void> = {};
                    const showNotification = vi.fn(async () => { });
                    const openWindow = vi.fn(async () => null);
                    const matchAll = vi.fn(async () => []);

                    const sandbox = {
                      URL,
                      self: {
                        location: { origin: "https://raqeem.eg" },
                        skipWaiting: vi.fn(async () => { }),
                        clients: {
                          claim: vi.fn(async () => { }),
                          matchAll,
                          openWindow,
                        },
                        registration: {
                          showNotification,
                        },
                        addEventListener: (name: string, cb: (event: unknown) => void) => {
                          listeners[name] = cb;
                        },
                      },
                    };

                    vm.runInNewContext(swSource, sandbox);

                    let pushPromise: Promise<unknown> = Promise.resolve();
                    listeners.push?.({
                      data: {
                        json: () => ({
                          title: "رقيم — طلب جديد",
                          body: "وصل طلب جديد. اضغط لعرض التفاصيل",
                          url: `/admin/orders/${SAMPLE_ORDER_ID}`,
                          tag: `raqeem-order-${SAMPLE_ORDER_ID}`,
                        }),
                      },
                      waitUntil: (p: Promise<unknown>) => {
                        pushPromise = p;
                      },
                    });
                    await pushPromise;

                    expect(showNotification).toHaveBeenCalledWith(
                      "رقيم — طلب جديد",
                      expect.objectContaining({
                        body: "وصل طلب جديد. اضغط لعرض التفاصيل",
                        dir: "rtl",
                        lang: "ar",
                        data: { url: `/admin/orders/${SAMPLE_ORDER_ID}` },
                      }),
                    );

                    let clickPromise: Promise<unknown> = Promise.resolve();
                    const closeMock = vi.fn();
                    listeners.notificationclick?.({
                      notification: {
                        close: closeMock,
                        data: { url: `/admin/orders/${SAMPLE_ORDER_ID}` },
                      },
                      waitUntil: (p: Promise<unknown>) => {
                        clickPromise = p;
                      },
                    });
                    await clickPromise;

                    expect(closeMock).toHaveBeenCalledTimes(1);
                    expect(openWindow).toHaveBeenCalledWith(
                      `https://raqeem.eg/admin/orders/${SAMPLE_ORDER_ID}`,
                    );
                  });
                });
              });
