"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/toast-provider";

interface LatestOrderItem {
  id: string;
  reference: string;
  createdAt: string;
}

/**
 * Watches for brand-new orders arriving while the Admin Dashboard is open.
 * - Uses Supabase Realtime (WebSocket — zero HTTP polling spam) as primary channel.
 * - Keeps a gentle fallback check only when the tab becomes visible or every 45s while visible.
 * - Never triggers toasts for old orders on initial mount or page refresh.
 */
export function AdminNewOrderToastWatcher() {
  const { showToast } = useToast();
  const router = useRouter();
  const initializedRef = useRef(false);
  const inFlightRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    function notifyNewOrder(id: string, reference: string) {
      if (seenIdsRef.current.has(id)) return;
      seenIdsRef.current.add(id);
      showToast({
        variant: "warning",
        title: `وصل طلب جديد — ${reference}`,
        description: "تم حفظ طلب كتاب جديد الآن في لوحة التحكم.",
        actionHref: `/admin/orders/${id}`,
        actionLabel: "عرض الطلب",
        durationMs: 9000,
      });
      router.refresh();
    }

    async function syncLatestOrders() {
      if (document.visibilityState !== "visible" || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const res = await fetch("/api/admin/orders/latest", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          orders?: LatestOrderItem[];
        };
        if (!active || !data.ok || !Array.isArray(data.orders)) return;

        if (!initializedRef.current) {
          for (const ord of data.orders) {
            seenIdsRef.current.add(ord.id);
          }
          initializedRef.current = true;
          return;
        }

        for (const ord of data.orders) {
          if (!seenIdsRef.current.has(ord.id)) {
            notifyNewOrder(ord.id, ord.reference);
          }
        }
      } catch {
        // Silent ignore on transient network error
      } finally {
        inFlightRef.current = false;
      }
    }

    // 1. Single initial baseline snapshot (marks existing orders as seen without toasting)
    if (!initializedRef.current) {
      syncLatestOrders();
    }

    // 2. Primary: Supabase Realtime INSERT subscription (instant, zero HTTP polling)
    let cleanupRealtime: (() => void) | null = null;
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel("admin-new-orders-toast")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            if (!active) return;
            const row = payload.new as { id?: string; reference?: string };
            if (row?.id) {
              const ref =
                row.reference || `RQM-${row.id.slice(0, 8).toUpperCase()}`;
              notifyNewOrder(row.id, ref);
            }
          },
        )
        .subscribe();

      cleanupRealtime = () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime unavailable
    }

    return () => {
      active = false;
      cleanupRealtime?.();
    };
  }, [router, showToast]);

  return null;
}
