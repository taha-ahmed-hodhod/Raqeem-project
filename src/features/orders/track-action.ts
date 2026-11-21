"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { orderSubmissionRateLimiter } from "@/lib/security/rate-limit";
import type { OrderLifecycleStage } from "@/lib/supabase/types";

export type TrackOrderResult =
  | {
      ok: true;
      found: true;
      reference: string;
      lifecycleStage: OrderLifecycleStage;
      createdAt: string;
      updatedAt: string;
      maskedCustomerName: string;
      maskedPhone: string;
    }
  | {
      ok: true;
      found: false;
    }
  | {
      ok: false;
      error: "rate_limited" | "invalid_reference" | "lookup_failed";
    };

async function getRateKey(): Promise<string> {
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    return `track:${ip}`;
  } catch {
    return "track:local";
  }
}

/**
 * Rate-limited public tracking lookup returning strictly non-PII status fields.
 * Never exposes customer names, phones, addresses, photos, or financials.
 */
export async function trackOrderByReferenceAction(
  rawReference: string,
): Promise<TrackOrderResult> {
  const rateCheck = orderSubmissionRateLimiter.check(await getRateKey());
  if (!rateCheck.allowed) {
    return { ok: false, error: "rate_limited" };
  }

  const cleaned = rawReference.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(cleaned)) {
    return { ok: false, error: "invalid_reference" };
  }

  const env = getServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { ok: false, error: "lookup_failed" };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("lookup_order_tracking_status", {
    p_reference: cleaned,
  });

  if (error || !data) {
    return { ok: false, error: "lookup_failed" };
  }

  const row = data as {
    found?: boolean;
    reference?: string;
    lifecycle_stage?: string;
    created_at?: string;
    updated_at?: string;
    masked_customer_name?: string;
    masked_phone?: string;
  };

  if (!row.found || !row.reference) {
    return { ok: true, found: false };
  }

  return {
    ok: true,
    found: true,
    reference: row.reference,
    lifecycleStage: (row.lifecycle_stage || "new") as OrderLifecycleStage,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    maskedCustomerName: row.masked_customer_name ?? "",
    maskedPhone: row.masked_phone ?? "",
  };
}
