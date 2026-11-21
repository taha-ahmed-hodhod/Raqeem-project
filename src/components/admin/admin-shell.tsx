"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Globe,
  Images,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquareHeart,
  Package,
  Percent,
  Search,
  Settings,
  Share2,
  Tag,
  User,
  X,
} from "lucide-react";
import {
  adminSignOutAction,
  markNotificationReadAction,
} from "@/features/admin/actions";
import type { AdminNotificationRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { PwaInstallButton } from "./pwa-install-button";
import { AdminNewOrderToastWatcher } from "./admin-new-order-toast";

interface AdminShellProps {
  children: React.ReactNode;
  adminEmail: string | null;
  newOrdersCount: number;
  unreadNotificationsCount: number;
  recentNotifications?: AdminNotificationRow[];
}

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: "نظرة عامة",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/orders",
    label: "الطلبات وإدارة الإنتاج",
    icon: Package,
    badgeKey: "newOrders" as const,
  },
  {
    href: "/admin/portfolio",
    label: "معرض الأعمال والموافقات",
    icon: Images,
  },
  {
    href: "/admin/reviews",
    label: "آراء العملاء والمراجعة",
    icon: MessageSquareHeart,
  },
  {
    href: "/admin/social",
    label: "السوشيال والبوستر",
    icon: Share2,
  },
  {
    href: "/admin/content",
    label: "إدارة المحتوى (CMS)",
    icon: Globe,
  },
  {
    href: "/admin/pricing",
    label: "أسعار باقات الكتب",
    icon: Tag,
  },
  {
    href: "/admin/promotions",
    label: "عروض وخصومات الكميات",
    icon: Percent,
  },
  {
    href: "/admin/shipping",
    label: "مصاريف الشحن والمحافظات",
    icon: MapPin,
  },
  {
    href: "/admin/notifications",
    label: "الإشعارات والتنبيهات",
    icon: Bell,
    badgeKey: "unreadNotifs" as const,
  },
  {
    href: "/admin/settings",
    label: "إعدادات النظام والتواصل",
    icon: Settings,
  },
];

export function AdminShell({
  children,
  adminEmail,
  newOrdersCount,
  unreadNotificationsCount,
  recentNotifications = [],
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifPopupOpen, setNotifPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifPopupOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target as Node)
      ) {
        setNotifPopupOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotifPopupOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notifPopupOpen]);

  function handleQuickSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      router.push("/admin/orders");
      return;
    }
    router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AdminNewOrderToastWatcher />
      {/* Right-Side Fixed Sidebar on Desktop (RTL) & Drawer on Mobile */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-72 flex-col justify-between border-l border-border bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 lg:translate-x-0",
          mobileDrawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/images/logo-raqeem.png"
                alt="رقيم"
                width={108}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="إغلاق القائمة"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-3.5 py-2">
              <span className="text-xs font-extrabold text-primary-700">
                لوحة تحكم الإدارة
              </span>
              <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[11px] font-bold text-white">
                v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Admin Navigation"
            className="flex flex-col gap-1 px-3"
          >
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const badgeCount =
                item.badgeKey === "newOrders"
                  ? newOrdersCount
                  : item.badgeKey === "unreadNotifs"
                    ? unreadNotificationsCount
                    : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary-500 font-bold text-white shadow-[0_8px_24px_-4px_rgba(99,36,197,0.18)]"
                      : "text-muted-foreground hover:bg-primary-50 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>

                  {badgeCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-extrabold",
                        isActive
                          ? "bg-white text-primary-600"
                          : "bg-secondary-pink text-white",
                      )}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status, Admin PWA Install & Sign Out */}
        <div className="flex flex-col gap-2.5 border-t border-border/70 p-4">
          <PwaInstallButton />

          <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted/70 p-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" />
            <span className="text-xs font-bold text-foreground">
              المتجر نشط ومتاح للطلبات
            </span>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <Link
              href="/ar"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary-600"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>عرض المتجر</span>
            </Link>

            <form action={adminSignOutAction}>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-error hover:underline"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تسجيل الخروج</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileDrawerOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-2xs lg:hidden"
        />
      )}

      {/* Main Content Area (offset by w-72 on desktop RTL) */}
      <div className="lg:pr-72">
        {/* Top Fixed Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-surface/90 px-4 shadow-2xs backdrop-blur-xl md:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="فتح قائمة الإدارة"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <form
              onSubmit={handleQuickSearch}
              className="relative flex w-full max-w-md items-center"
            >
              <Search
                className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث سريع برقم الطلب، اسم ولي الأمر، أو الهاتف..."
                className="h-10 w-full rounded-xl border border-border bg-surface-muted/60 pr-10 pl-3 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ar"
              className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface-muted/60 px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-primary-50 hover:text-primary-600 sm:inline-flex"
            >
              <span>عرض المتجر</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifPopupOpen((prev) => !prev)}
                aria-label="الإشعارات"
                aria-expanded={notifPopupOpen}
                aria-haspopup="dialog"
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface-muted/60 text-foreground transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-pink px-1 text-[11px] font-extrabold text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifPopupOpen && (
                <div
                  role="dialog"
                  aria-label="الإشعارات الحديثة"
                  className="absolute left-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_-8px_rgba(36,23,71,0.18)] sm:w-96"
                >
                  <div className="flex items-center justify-between border-b border-border/70 bg-primary-50/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell
                        className="h-4 w-4 text-primary-600"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-extrabold text-foreground">
                        الإشعارات الحديثة
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="rounded-full bg-secondary-pink px-2 py-0.5 text-[11px] font-extrabold text-white">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </div>

                    {unreadNotificationsCount > 0 && (
                      <form
                        action={async (formData) => {
                          await markNotificationReadAction(formData);
                          setNotifPopupOpen(false);
                        }}
                      >
                        <input
                          type="hidden"
                          name="notificationId"
                          value="all"
                        />
                        <button
                          type="submit"
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline"
                        >
                          <CheckCheck
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span>تحديد الكل كمقروء</span>
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
                        <Bell
                          className="h-7 w-7 text-muted-foreground/40"
                          aria-hidden="true"
                        />
                        <p className="text-xs font-bold text-foreground">
                          لا توجد إشعارات حديثة الآن
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          ستظهر هنا تنبيهات الطلبات الجديدة فور وصولها.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {recentNotifications.map((notif) => {
                          const isUnread = !notif.read_at;
                          const href = notif.order_id
                            ? `/admin/orders/${notif.order_id}`
                            : "/admin/notifications";
                          return (
                            <li key={notif.id}>
                              <Link
                                href={href}
                                onClick={() => setNotifPopupOpen(false)}
                                className={cn(
                                  "flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-primary-50/40",
                                  isUnread && "bg-primary-50/30",
                                )}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span
                                    className={cn(
                                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                                      isUnread
                                        ? "bg-secondary-pink"
                                        : "bg-border",
                                    )}
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-extrabold text-foreground">
                                      {notif.title_ar}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {new Date(
                                        notif.created_at,
                                      ).toLocaleString("ar-EG")}
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink
                                  className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-border/70 bg-surface-muted/40 px-4 py-2.5 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifPopupOpen(false)}
                      className="text-xs font-bold text-primary-600 hover:underline"
                    >
                      عرض كل الإشعارات وإعدادات التنبيه
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 border-r border-border pr-3">
              <div className="hidden flex-col text-end sm:flex">
                <span className="text-xs font-extrabold text-foreground">
                  مسؤول النظام
                </span>
                {adminEmail && (
                  <span className="max-w-[160px] truncate text-[11px] text-muted-foreground">
                    {adminEmail}
                  </span>
                )}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
