"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime changes on `public.site_settings`.
 * Any admin change to prices, discounts, shipping rates, CMS copy, hero image,
 * poster popup, portfolio, customer reviews, or social links updates
 * `site_settings` (either directly or via `private.bump_cms_live_tick()`),
 * triggering a debounced in-place `router.refresh()` so the public site
 * reflects dashboard edits live without manual page reloads.
 */
export function PublicLiveSync() {
  const router = useRouter();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOnVisibleRef = useRef(false);

  useEffect(() => {
    let active = true;

    const scheduleRefresh = () => {
      if (!active) return;

      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        pendingOnVisibleRef.current = true;
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!active) return;
        debounceTimerRef.current = null;
        router.refresh();
      }, 350);
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        pendingOnVisibleRef.current
      ) {
        pendingOnVisibleRef.current = false;
        scheduleRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let cleanupRealtime: (() => void) | null = null;
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel("raqeem-public-cms-live-sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "site_settings",
          },
          () => {
            scheduleRefresh();
          },
        )
        .subscribe();

      cleanupRealtime = () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime unavailable — gracefully do nothing
    }

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      cleanupRealtime?.();
    };
  }, [router]);

  return null;
}
