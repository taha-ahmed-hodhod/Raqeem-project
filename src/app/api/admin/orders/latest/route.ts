import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await verifyAdminAccess();
  if (!access.authorized) {
    return NextResponse.json({ ok: false, orders: [] }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, reference, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ ok: false, orders: [] }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orders: (data ?? []).map((row) => ({
      id: row.id,
      reference: row.reference ?? `RQM-${row.id.slice(0, 8).toUpperCase()}`,
      createdAt: row.created_at,
    })),
  });
}
