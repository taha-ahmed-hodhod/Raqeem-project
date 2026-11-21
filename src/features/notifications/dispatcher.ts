import * as webpush from "web-push";
import type { PushSubscription as WebPushSubscription } from "web-push";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  MAX_OUTBOX_ATTEMPTS,
  buildAdminOrderEmailPayload,
  buildSafeWebPushPayload,
  computeNextRetryAt,
  isExpiredPushSubscriptionError,
  type AdminEmailOrderDetails,
} from "./payload";

export interface OutboxRecord {
  id: string;
  event_key: string;
  order_id: string | null;
  channel: "web_push" | "email";
  status: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  next_retry_at: string;
  sent_at: string | null;
  created_at: string;
}

export interface StoredPushSubscription {
  endpoint: string;
  subscription: WebPushSubscription;
}

export interface OutboxDispatchSummary {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  expiredSubscriptionsRemoved: number;
  errors: Array<{ outboxId: string; channel: string; error: string }>;
}

export interface NotificationChannelsStatus {
  vapidConfigured: boolean;
  resendConfigured: boolean;
  serviceRoleConfigured: boolean;
  adminNotificationEmail: string | null;
}

export function getNotificationChannelsStatus(): NotificationChannelsStatus {
  const env = getServerEnv();
  return {
    vapidConfigured: Boolean(
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      env.VAPID_PRIVATE_KEY &&
      env.VAPID_SUBJECT,
    ),
    resendConfigured: Boolean(
      env.RESEND_API_KEY &&
      env.RESEND_FROM_EMAIL &&
      (env.ADMIN_NOTIFICATION_EMAIL || env.ADMIN_ALLOWED_EMAIL),
    ),
    serviceRoleConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    adminNotificationEmail:
      env.ADMIN_NOTIFICATION_EMAIL ?? env.ADMIN_ALLOWED_EMAIL ?? null,
  };
}

export interface OutboxDispatcherDeps {
  fetchDueOutbox: (params: {
    orderId?: string;
    limit: number;
    forceRetry?: boolean;
  }) => Promise<OutboxRecord[]>;
  fetchOrderDetails: (
    orderId: string,
  ) => Promise<AdminEmailOrderDetails | null>;
  fetchPushSubscriptions: () => Promise<StoredPushSubscription[]>;
  deletePushSubscription: (endpoint: string) => Promise<void>;
  updateOutboxRow: (
    id: string,
    patch: {
      status: "pending" | "processing" | "sent" | "failed";
      attempts: number;
      last_error: string | null;
      next_retry_at?: string;
      sent_at?: string | null;
    },
  ) => Promise<void>;
  sendWebPush: (
    subscription: WebPushSubscription,
    payloadJson: string,
  ) => Promise<void>;
  sendEmail: (params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<void>;
  config: {
    appUrl: string;
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    vapidSubject?: string;
    resendApiKey?: string;
    resendFromEmail?: string;
    adminNotificationEmail?: string;
  };
}

function createSupabaseOutboxDeps(
  supabase: SupabaseClient,
): OutboxDispatcherDeps {
  const env = getServerEnv();

  return {
    async fetchDueOutbox({ orderId, limit, forceRetry }) {
      let query = supabase
        .from("notification_outbox")
        .select(
          "id, event_key, order_id, channel, status, attempts, last_error, next_retry_at, sent_at, created_at",
        )
        .in("status", ["pending", "failed"])
        .lt("attempts", MAX_OUTBOX_ATTEMPTS)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (orderId) {
        query = query.eq("order_id", orderId);
      }

      if (!forceRetry) {
        query = query.lte("next_retry_at", new Date().toISOString());
      }

      const { data, error } = await query;
      if (error || !data) {
        return [];
      }
      return data as OutboxRecord[];
    },

    async fetchOrderDetails(orderId) {
      const [orderRes, itemsRes] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, reference, created_at, customer_name, phone, whatsapp_phone, governorate, address, notes, subtotal_piastres, discount_percent, discount_piastres, books_subtotal_piastres, books_discount_piastres, books_total_piastres, shipping_piastres, deposit_selected_piastres, deposit_status",
          )
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("order_items")
          .select(
            "item_index, page_count, quantity, unit_price_piastres, child_name, child_age, age_label, interests, notes, photo_path",
          )
          .eq("order_id", orderId)
          .order("item_index", { ascending: true }),
      ]);

      if (orderRes.error || !orderRes.data) {
        return null;
      }

      const ord = orderRes.data;
      const { data: govData } = await supabase
        .from("shipping_rates")
        .select("name_ar")
        .eq("code", ord.governorate)
        .maybeSingle();

      const subtotalPiastres =
        ord.books_subtotal_piastres && ord.books_subtotal_piastres > 0
          ? ord.books_subtotal_piastres
          : (ord.subtotal_piastres ?? 0);
      const discountPiastres =
        ord.books_discount_piastres !== null &&
          ord.books_discount_piastres !== undefined
          ? ord.books_discount_piastres
          : (ord.discount_piastres ?? 0);
      const booksTotalPiastres =
        ord.books_total_piastres && ord.books_total_piastres > 0
          ? ord.books_total_piastres
          : subtotalPiastres - discountPiastres;

      return {
        orderId: ord.id,
        reference: ord.reference ?? `RQM-${ord.id.slice(0, 8).toUpperCase()}`,
        createdAt: ord.created_at,
        customerName: ord.customer_name,
        phone: ord.phone,
        whatsappPhone: ord.whatsapp_phone ?? null,
        governorateNameAr: govData?.name_ar ?? ord.governorate,
        address: ord.address,
        notes: ord.notes ?? null,
        subtotalPiastres,
        discountPercent: ord.discount_percent ?? 0,
        discountPiastres,
        booksTotalPiastres,
        shippingPiastres: ord.shipping_piastres ?? null,
        depositSelectedPiastres: ord.deposit_selected_piastres ?? null,
        depositStatus:
          (ord.deposit_status as "not_specified" | "pending" | "received") ??
          "not_specified",
        items: (itemsRes.data ?? []).map((item) => ({
          itemIndex: item.item_index,
          pageCount: item.page_count,
          quantity: item.quantity,
          unitPricePiastres: item.unit_price_piastres,
          childName: item.child_name,
          childAge: item.child_age,
          ageLabel: item.age_label ?? null,
          interests: item.interests ?? null,
          notes: item.notes ?? null,
          hasPhoto: Boolean(item.photo_path),
        })),
      };
    },

    async fetchPushSubscriptions() {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, subscription");

      if (error || !data) {
        return [];
      }

      return data
        .filter((row) => row.endpoint && row.subscription)
        .map((row) => ({
          endpoint: String(row.endpoint),
          subscription: row.subscription as WebPushSubscription,
        }));
    },

    async deletePushSubscription(endpoint) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
    },

    async updateOutboxRow(id, patch) {
      await supabase.from("notification_outbox").update(patch).eq("id", id);
    },

    async sendWebPush(subscription, payloadJson) {
      if (
        !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        !env.VAPID_PRIVATE_KEY ||
        !env.VAPID_SUBJECT
      ) {
        throw new Error("vapid_not_configured");
      }

      webpush.setVapidDetails(
        env.VAPID_SUBJECT,
        env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
      );

      await webpush.sendNotification(subscription, payloadJson, {
        TTL: 3600,
      });
    },

    async sendEmail({ from, to, subject, html, text }) {
      if (!env.RESEND_API_KEY) {
        throw new Error("resend_not_configured");
      }
      const resend = new Resend(env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });
      if (error) {
        throw new Error(error.message || "resend_send_failed");
      }
    },

    config: {
      appUrl: env.NEXT_PUBLIC_APP_URL,
      vapidPublicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      vapidPrivateKey: env.VAPID_PRIVATE_KEY,
      vapidSubject: env.VAPID_SUBJECT,
      resendApiKey: env.RESEND_API_KEY,
      resendFromEmail: env.RESEND_FROM_EMAIL,
      adminNotificationEmail:
        env.ADMIN_NOTIFICATION_EMAIL ?? env.ADMIN_ALLOWED_EMAIL,
    },
  };
}

/**
 * Core outbox dispatcher:
 * - Processes pending/retryable `web_push` and `email` outbox records INDEPENDENTLY
 *   so failure on one channel never blocks the other.
 * - Web Push payload is strictly PII-free (lock-screen safe).
 * - Admin Email contains full order details + protected link to private child photos.
 * - Automatically deletes expired (404/410) push subscriptions.
 * - Retries ONLY the failed channel up to `MAX_OUTBOX_ATTEMPTS`.
 */
export async function dispatchNotificationOutboxWithDeps(
  deps: OutboxDispatcherDeps,
  options: {
    orderId?: string;
    limit?: number;
    forceRetry?: boolean;
  } = {},
): Promise<OutboxDispatchSummary> {
  const summary: OutboxDispatchSummary = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    expiredSubscriptionsRemoved: 0,
    errors: [],
  };

  const rows = await deps.fetchDueOutbox({
    orderId: options.orderId,
    limit: options.limit ?? 20,
    forceRetry: options.forceRetry,
  });

  if (rows.length === 0) {
    return summary;
  }

  // Cache order details per order_id within this batch to avoid duplicate reads
  const orderDetailsCache = new Map<string, AdminEmailOrderDetails | null>();
  async function getOrderDetailsCached(orderId: string | null) {
    if (!orderId) return null;
    if (!orderDetailsCache.has(orderId)) {
      const details = await deps.fetchOrderDetails(orderId);
      orderDetailsCache.set(orderId, details);
    }
    return orderDetailsCache.get(orderId) ?? null;
  }

  // Dispatch channels independently in parallel so Email failure never blocks Web Push & vice versa
  await Promise.allSettled(
    rows.map(async (row) => {
      if (row.status === "sent") {
        summary.skipped += 1;
        return;
      }

      summary.processed += 1;
      const nextAttempts = row.attempts + 1;
      const orderDetails = await getOrderDetailsCached(row.order_id);

      try {
        if (row.channel === "web_push") {
          if (
            !deps.config.vapidPublicKey ||
            !deps.config.vapidPrivateKey ||
            !deps.config.vapidSubject
          ) {
            throw new Error("vapid_not_configured");
          }

          const subscriptions = await deps.fetchPushSubscriptions();
          if (subscriptions.length === 0) {
            throw new Error("no_push_subscriptions");
          }

          const payloadJson = JSON.stringify(
            buildSafeWebPushPayload({
              orderId: row.order_id ?? "",
              reference: orderDetails?.reference ?? "طلب جديد",
            }),
          );

          let deliveredCount = 0;
          let lastPushError: string | null = null;

          for (const sub of subscriptions) {
            try {
              await deps.sendWebPush(sub.subscription, payloadJson);
              deliveredCount += 1;
            } catch (err) {
              if (isExpiredPushSubscriptionError(err)) {
                await deps.deletePushSubscription(sub.endpoint);
                summary.expiredSubscriptionsRemoved += 1;
                lastPushError = "subscription_expired_removed";
              } else {
                lastPushError =
                  err instanceof Error ? err.message : "web_push_send_failed";
              }
            }
          }

          if (deliveredCount === 0) {
            throw new Error(lastPushError ?? "web_push_no_delivery");
          }

          await deps.updateOutboxRow(row.id, {
            status: "sent",
            attempts: nextAttempts,
            last_error: null,
            sent_at: new Date().toISOString(),
          });
          summary.sent += 1;
        } else if (row.channel === "email") {
          if (
            !deps.config.resendApiKey ||
            !deps.config.resendFromEmail ||
            !deps.config.adminNotificationEmail
          ) {
            throw new Error("resend_not_configured");
          }

          if (!orderDetails) {
            throw new Error("order_details_not_found");
          }

          const emailPayload = buildAdminOrderEmailPayload(
            orderDetails,
            deps.config.appUrl,
          );

          await deps.sendEmail({
            from: deps.config.resendFromEmail,
            to: deps.config.adminNotificationEmail,
            subject: emailPayload.subject,
            html: emailPayload.html,
            text: emailPayload.text,
          });

          await deps.updateOutboxRow(row.id, {
            status: "sent",
            attempts: nextAttempts,
            last_error: null,
            sent_at: new Date().toISOString(),
          });
          summary.sent += 1;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message.slice(0, 240) : "dispatch_failed";
        const isPermanent = nextAttempts >= MAX_OUTBOX_ATTEMPTS;

        await deps.updateOutboxRow(row.id, {
          status: isPermanent ? "failed" : "pending",
          attempts: nextAttempts,
          last_error: errorMessage,
          next_retry_at: computeNextRetryAt(nextAttempts),
        });

        summary.failed += 1;
        summary.errors.push({
          outboxId: row.id,
          channel: row.channel,
          error: errorMessage,
        });
      }
    }),
  );

  return summary;
}

/**
 * Production entry point: dispatches due outbox rows using the provided
 * Supabase client (or privileged service-role client when available).
 * Never throws on missing optional credentials so customer order creation stays resilient.
 */
export async function dispatchNotificationOutbox(options: {
  orderId?: string;
  limit?: number;
  forceRetry?: boolean;
  supabaseClient?: SupabaseClient;
} = {}): Promise<OutboxDispatchSummary> {
  try {
    let client = options.supabaseClient;
    if (!client) {
      const env = getServerEnv();
      if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.NEXT_PUBLIC_SUPABASE_URL) {
        return {
          processed: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
          expiredSubscriptionsRemoved: 0,
          errors: [
            {
              outboxId: "config",
              channel: "system",
              error: "service_role_not_configured",
            },
          ],
        };
      }
      client = createSupabaseAdminClient();
    }

    const deps = createSupabaseOutboxDeps(client);
    return await dispatchNotificationOutboxWithDeps(deps, {
      orderId: options.orderId,
      limit: options.limit,
      forceRetry: options.forceRetry,
    });
  } catch (err) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      expiredSubscriptionsRemoved: 0,
      errors: [
        {
          outboxId: "system",
          channel: "system",
          error: err instanceof Error ? err.message : "unknown_dispatch_error",
        },
      ],
    };
  }
}

/**
 * Sends a safe, PII-free test Web Push notification to all saved admin devices
 * and cleans up any expired (404/410) subscriptions.
 */
export async function sendAdminTestPush(
  supabase: SupabaseClient,
): Promise<{
  ok: boolean;
  delivered: number;
  expiredRemoved: number;
  error?: string;
}> {
  const env = getServerEnv();
  if (
    !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !env.VAPID_PRIVATE_KEY ||
    !env.VAPID_SUBJECT
  ) {
    return {
      ok: false,
      delivered: 0,
      expiredRemoved: 0,
      error: "vapid_not_configured",
    };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, subscription");

  if (error || !data || data.length === 0) {
    return {
      ok: false,
      delivered: 0,
      expiredRemoved: 0,
      error: "no_push_subscriptions",
    };
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  const payloadJson = JSON.stringify({
    title: "رقيم — طلب جديد",
    body: "وصل طلب جديد. اضغط لعرض التفاصيل",
    url: "/admin/orders",
    tag: "raqeem-test-push",
  });

  let delivered = 0;
  let expiredRemoved = 0;
  let lastError: string | undefined;

  for (const row of data) {
    try {
      await webpush.sendNotification(
        row.subscription as WebPushSubscription,
        payloadJson,
        { TTL: 300 },
      );
      delivered += 1;
    } catch (err) {
      if (isExpiredPushSubscriptionError(err)) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", row.endpoint);
        expiredRemoved += 1;
      } else {
        lastError =
          err instanceof Error ? err.message : "test_push_send_failed";
      }
    }
  }

  return {
    ok: delivered > 0,
    delivered,
    expiredRemoved,
    error: delivered > 0 ? undefined : (lastError ?? "test_push_failed"),
  };
}
