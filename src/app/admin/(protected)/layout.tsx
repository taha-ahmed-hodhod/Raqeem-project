import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { getAdminOverviewAndRecentOrders } from "@/features/admin/queries";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await verifyAdminAccess();

  if (!access.authorized) {
    redirect("/admin/login");
  }

  const { counts, recentNotifications } =
    await getAdminOverviewAndRecentOrders();

  return (
    <AdminShell
      adminEmail={access.email}
      newOrdersCount={counts.stageCounts.new}
      unreadNotificationsCount={counts.unreadNotificationsCount}
      recentNotifications={recentNotifications}
    >
      {children}
    </AdminShell>
  );
}
