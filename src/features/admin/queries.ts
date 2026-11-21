import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CHILD_PHOTOS_BUCKET } from "@/lib/security/upload-validation";
import type {
  AdminNotificationRow,
  BookVariantRow,
  GovernorateRow,
  NotificationOutboxRow,
  OrderItemRow,
  OrderLifecycleStage,
  OrderRow,
  OrderStatusEventRow,
  PortfolioEntryRow,
  PromotionRow,
} from "@/lib/supabase/types";

export interface AdminOverviewCounts {
  totalOrders: number;
  newPendingCount: number;
  inProductionCount: number;
  deliveredCount: number;
  totalEstimatedEgp: number;
  unreadNotificationsCount: number;
  stageCounts: Record<OrderLifecycleStage, number>;
}

export interface OrderItemWithSignedPhoto extends OrderItemRow {
  signedPhotoUrl: string | null;
}

export const LIFECYCLE_LABELS_AR: Record<OrderLifecycleStage, string> = {
  new: "جديد (بانتظار التواصل)",
  contacted: "تم التواصل",
  confirmed: "تم التأكيد",
  designing: "جاري الرسم والتحويل",
  printing: "قيد الطباعة والتجليد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  on_hold: "معلق مؤقتاً",
  cancelled: "ملغي",
};

export function formatWhatsAppLink(phone: string, reference?: string): string {
  const digits = phone.replace(/\D/g, "");
  const intlPhone = digits.startsWith("0")
    ? `20${digits.slice(1)}`
    : digits.startsWith("20")
      ? digits
      : `20${digits}`;

  const text = reference
    ? `أهلاً بحضرتك من فريق رقيم 🎨 بخصوص طلب كتاب التلوين المخصص رقم ${reference}`
    : "أهلاً بحضرتك من فريق رقيم 🎨";

  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
}

export async function getAdminOverviewAndRecentOrders(): Promise<{
  counts: AdminOverviewCounts;
  recentOrders: OrderRow[];
  recentNotifications: AdminNotificationRow[];
  governorates: GovernorateRow[];
}> {
  const supabase = await createSupabaseServerClient();

  const [ordersRes, unreadRes, recentNotifsRes, govsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("shipping_rates")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const governorates = (govsRes.data ?? []) as GovernorateRow[];

  const stageCounts: Record<OrderLifecycleStage, number> = {
    new: 0,
    contacted: 0,
    confirmed: 0,
    designing: 0,
    printing: 0,
    shipped: 0,
    delivered: 0,
    on_hold: 0,
    cancelled: 0,
  };

  let totalEstimatedPiastres = 0;

  for (const ord of orders) {
    const stage = (ord.lifecycle_stage || ord.status || "new") as OrderLifecycleStage;
    if (stage in stageCounts) {
      stageCounts[stage] += 1;
    }

    if (stage !== "cancelled") {
      const booksTotal =
        ord.books_total_piastres && ord.books_total_piastres > 0
          ? ord.books_total_piastres
          : (ord.subtotal_piastres ?? 0) - (ord.discount_piastres ?? 0);
      const quote =
        ord.final_quote_piastres ??
        booksTotal + (ord.shipping_piastres ?? 0);
      totalEstimatedPiastres += quote;
    }
  }

  const counts: AdminOverviewCounts = {
    totalOrders: orders.length,
    newPendingCount: stageCounts.new + stageCounts.contacted,
    inProductionCount:
      stageCounts.confirmed + stageCounts.designing + stageCounts.printing,
    deliveredCount: stageCounts.delivered,
    totalEstimatedEgp: Math.round(totalEstimatedPiastres / 100),
    unreadNotificationsCount: unreadRes.count ?? 0,
    stageCounts,
  };

  return {
    counts,
    recentOrders: orders.slice(0, 15),
    recentNotifications: (recentNotifsRes.data ?? []) as AdminNotificationRow[],
    governorates,
  };
}

export async function getFilteredAdminOrders(filters: {
  q?: string;
  stage?: string;
  gov?: string;
}): Promise<{
  orders: OrderRow[];
  governorates: GovernorateRow[];
}> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.stage && filters.stage !== "all") {
    query = query.eq("lifecycle_stage", filters.stage);
  }

  if (filters.gov && filters.gov !== "all") {
    query = query.eq("governorate", filters.gov);
  }

  const [ordersRes, govsRes] = await Promise.all([
    query,
    supabase
      .from("shipping_rates")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  let orders = (ordersRes.data ?? []) as OrderRow[];
  const q = filters.q?.trim().toLowerCase();

  if (q) {
    orders = orders.filter(
      (o) =>
        o.reference?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q) ||
        o.whatsapp_phone?.toLowerCase().includes(q),
    );
  }

  return {
    orders,
    governorates: (govsRes.data ?? []) as GovernorateRow[],
  };
}

export async function getAdminOrderDetailById(orderId: string): Promise<{
  order: OrderRow | null;
  items: OrderItemWithSignedPhoto[];
  events: OrderStatusEventRow[];
  governorate: GovernorateRow | null;
}> {
  const supabase = await createSupabaseServerClient();

  const [orderRes, itemsRes, eventsRes] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).single(),
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("item_index", { ascending: true }),
    supabase
      .from("order_status_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
  ]);

  const order = (orderRes.data as OrderRow | null) ?? null;
  if (!order) {
    return { order: null, items: [], events: [], governorate: null };
  }

  const rawItems = (itemsRes.data ?? []) as OrderItemRow[];

  // Generate short-lived (10-minute) signed URLs for each private child photo
  const items: OrderItemWithSignedPhoto[] = await Promise.all(
    rawItems.map(async (item) => {
      let signedPhotoUrl: string | null = null;
      if (item.photo_path) {
        const { data: signedData } = await supabase.storage
          .from(CHILD_PHOTOS_BUCKET)
          .createSignedUrl(item.photo_path, 600);
        signedPhotoUrl = signedData?.signedUrl ?? null;
      }
      return {
        ...item,
        signedPhotoUrl,
      };
    }),
  );

  const { data: govData } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("code", order.governorate)
    .single();

  return {
    order,
    items,
    events: (eventsRes.data ?? []) as OrderStatusEventRow[],
    governorate: (govData as GovernorateRow | null) ?? null,
  };
}

export async function getAdminCommercialAndCmsData(): Promise<{
  bookVariants: BookVariantRow[];
  promotions: PromotionRow[];
  governorates: GovernorateRow[];
  portfolio: PortfolioEntryRow[];
  notifications: AdminNotificationRow[];
  outbox: NotificationOutboxRow[];
  pushSubscriptionsCount: number;
  siteContent: Array<{
    key: string;
    value: string;
    value_en: string | null;
  }>;
  contactSettings: {
    whatsappNumber: string | null;
    phoneNumber: string | null;
    email: string | null;
    workingHoursAr: string;
    workingHoursEn: string;
  };
}> {
  const supabase = await createSupabaseServerClient();

  const [
    variantsRes,
    promosRes,
    govsRes,
    portfolioRes,
    notifsRes,
    outboxRes,
    pushSubsRes,
    contentRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from("book_variants").select("*").order("page_count"),
    supabase.from("promotions").select("*").order("min_quantity"),
    supabase.from("shipping_rates").select("*").order("sort_order"),
    supabase
      .from("portfolio_entries")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notification_outbox")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("push_subscriptions").select("endpoint", { count: "exact", head: true }),
    supabase.from("site_content").select("*"),
    supabase.from("site_settings").select("*").eq("key", "contact").maybeSingle(),
  ]);

  const contactVal = (settingsRes.data?.value ?? {}) as Record<string, unknown>;

  return {
    bookVariants: (variantsRes.data ?? []) as BookVariantRow[],
    promotions: (promosRes.data ?? []) as PromotionRow[],
    governorates: (govsRes.data ?? []) as GovernorateRow[],
    portfolio: (portfolioRes.data ?? []) as PortfolioEntryRow[],
    notifications: (notifsRes.data ?? []) as AdminNotificationRow[],
    outbox: (outboxRes.data ?? []) as NotificationOutboxRow[],
    pushSubscriptionsCount: pushSubsRes.count ?? 0,
    siteContent: (contentRes.data ?? []) as Array<{
      key: string;
      value: string;
      value_en: string | null;
    }>,
    contactSettings: {
      whatsappNumber:
        typeof contactVal.whatsappNumber === "string"
          ? contactVal.whatsappNumber
          : null,
      phoneNumber:
        typeof contactVal.phoneNumber === "string"
          ? contactVal.phoneNumber
          : null,
      email: typeof contactVal.email === "string" ? contactVal.email : null,
      workingHoursAr:
        typeof contactVal.workingHoursAr === "string"
          ? contactVal.workingHoursAr
          : "يومياً من 10 صباحاً حتى 10 مساءً (بتوقيت القاهرة)",
      workingHoursEn:
        typeof contactVal.workingHoursEn === "string"
          ? contactVal.workingHoursEn
          : "Daily from 10:00 AM to 10:00 PM (Cairo Time)",
    },
  };
}
