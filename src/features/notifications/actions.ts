"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dispatchNotificationOutbox,
  sendAdminTestPush,
  type OutboxDispatchSummary,
} from "./dispatcher";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(10).max(512),
    auth: z.string().min(10).max(512),
  }),
  userAgent: z.string().max(400).optional(),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export async function savePushSubscriptionAction(
  input: PushSubscriptionInput,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "بيانات اشتراك الإشعارات غير صالحة.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { endpoint, expirationTime, keys, userAgent } = parsed.data;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint,
      subscription: {
        endpoint,
        expirationTime: expirationTime ?? null,
        keys,
      },
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return {
      ok: false,
      error: "تعذر حفظ اشتراك الإشعارات في قاعدة البيانات.",
    };
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removePushSubscriptionAction(
  endpoint: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAccess();

  if (!endpoint || endpoint.length > 2048) {
    return { ok: false, error: "معرف الاشتراك غير صالح." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return {
      ok: false,
      error: "تعذر إلغاء اشتراك الإشعارات.",
    };
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function dispatchOutboxNowAction(): Promise<{
  ok: boolean;
  summary: OutboxDispatchSummary;
}> {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const summary = await dispatchNotificationOutbox({
    supabaseClient: supabase,
    limit: 25,
    forceRetry: true,
  });

  revalidatePath("/admin/notifications");
  return {
    ok: summary.errors.length === 0 || summary.sent > 0,
    summary,
  };
}

export async function sendTestPushAction(): Promise<{
  ok: boolean;
  delivered: number;
  expiredRemoved: number;
  error?: string;
}> {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  const result = await sendAdminTestPush(supabase);

  revalidatePath("/admin/notifications");
  return result;
}
