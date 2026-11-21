import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchNotificationOutbox } from "@/features/notifications/dispatcher";

export async function POST() {
  const access = await verifyAdminAccess();
  if (!access.authorized) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const summary = await dispatchNotificationOutbox({
    supabaseClient: supabase,
    limit: 25,
    forceRetry: true,
  });

  return NextResponse.json({
    ok: true,
    summary,
  });
}
