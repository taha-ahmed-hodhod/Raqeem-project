import Link from "next/link";
import { Eye, MessageCircle, Phone, Search } from "lucide-react";
import {
  formatWhatsAppLink,
  getFilteredAdminOrders,
  LIFECYCLE_LABELS_AR,
} from "@/features/admin/queries";
import type { OrderLifecycleStage } from "@/lib/supabase/types";

const STAGE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "new", label: "جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "designing", label: "جاري الرسم" },
  { value: "printing", label: "قيد الطباعة" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "on_hold", label: "معلق" },
  { value: "cancelled", label: "ملغي" },
];

export default async function AdminOrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; gov?: string }>;
}) {
  const filters = await searchParams;
  const activeStage = filters.stage || "all";
  const activeGov = filters.gov || "all";
  const activeQuery = filters.q || "";

  const { orders, governorates } = await getFilteredAdminOrders({
    q: activeQuery,
    stage: activeStage,
    gov: activeGov,
  });

  const govNameMap = new Map(governorates.map((g) => [g.code, g.name_ar]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            الطلبات وإدارة الإنتاج ({orders.length})
          </h1>
          <p className="text-sm text-muted-foreground">
            البحث والتصفية حسب الحالة أو المحافظة، والتواصل المباشر مع أولياء
            الأمور عبر واتساب أو الهاتف.
          </p>
        </div>
      </header>

      {/* Search & Filters Card */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <form
          method="get"
          action="/admin/orders"
          className="grid grid-cols-1 gap-3 md:grid-cols-12"
        >
          <div className="relative flex items-center md:col-span-6">
            <Search
              className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={activeQuery}
              placeholder="ابحث برقم المرجع (RQM-...)، اسم ولي الأمر، أو رقم الهاتف..."
              className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 pr-10 pl-3 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <select
              name="gov"
              defaultValue={activeGov}
              className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
            >
              <option value="all">جميع المحافظات (27 محافظة)</option>
              {governorates.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>

          <input type="hidden" name="stage" value={activeStage} />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-xl bg-primary-500 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-600"
            >
              تطبيق البحث
            </button>
          </div>
        </form>

        {/* Lifecycle Stage Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          {STAGE_FILTER_OPTIONS.map((opt) => {
            const isSelected = activeStage === opt.value;
            const params = new URLSearchParams();
            if (activeQuery) params.set("q", activeQuery);
            if (activeGov !== "all") params.set("gov", activeGov);
            if (opt.value !== "all") params.set("stage", opt.value);
            const href = `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;

            return (
              <Link
                key={opt.value}
                href={href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  isSelected
                    ? "bg-primary-500 text-white"
                    : "bg-surface-muted text-muted-foreground hover:bg-primary-50 hover:text-primary-600"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Orders Table */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        {orders.length === 0 ? (
          <div className="py-12 text-center text-sm font-medium text-muted-foreground">
            لا توجد طلبات مطابقة لمعايير البحث أو التصفية الحالية.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold text-muted-foreground">
                  <th className="px-3 py-3">رقم المرجع</th>
                  <th className="px-3 py-3">تاريخ الطلب</th>
                  <th className="px-3 py-3">ولي الأمر</th>
                  <th className="px-3 py-3">التواصل المباشر</th>
                  <th className="px-3 py-3">الكتب المطلوبة</th>
                  <th className="px-3 py-3">المحافظة</th>
                  <th className="px-3 py-3">الإجمالي والخصم</th>
                  <th className="px-3 py-3">الحالة</th>
                  <th className="px-3 py-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((ord) => {
                  const stage = (ord.lifecycle_stage ||
                    ord.status ||
                    "new") as OrderLifecycleStage;
                  const c12 = ord.total_count_12 || ord.count_12 || 0;
                  const c24 = ord.total_count_24 || ord.count_24 || 0;
                  const booksTotalPiastres =
                    ord.books_total_piastres && ord.books_total_piastres > 0
                      ? ord.books_total_piastres
                      : (ord.subtotal_piastres ?? 0) -
                        (ord.discount_piastres ?? 0);
                  const totalEgp = Math.round(
                    (ord.final_quote_piastres ??
                      booksTotalPiastres + (ord.shipping_piastres ?? 0)) /
                      100,
                  );
                  const waPhone = ord.whatsapp_phone || ord.phone;

                  return (
                    <tr
                      key={ord.id}
                      className="transition-colors hover:bg-primary-50/30"
                    >
                      <td className="px-3 py-3.5 font-mono text-xs font-extrabold text-primary-700">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="hover:underline"
                        >
                          {ord.reference}
                        </Link>
                      </td>

                      <td className="px-3 py-3.5 text-xs text-muted-foreground">
                        {new Date(ord.created_at).toLocaleString("ar-EG")}
                      </td>

                      <td className="px-3 py-3.5 font-bold text-foreground">
                        {ord.customer_name}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            dir="ltr"
                            className="text-xs font-semibold text-foreground"
                          >
                            {ord.phone}
                          </span>
                          <a
                            href={formatWhatsAppLink(waPhone, ord.reference)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-success/15 px-2 text-xs font-bold text-success hover:bg-success hover:text-white"
                          >
                            <MessageCircle
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            <span>واتساب</span>
                          </a>
                          <a
                            href={`tel:${ord.phone}`}
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary-50 px-2 text-xs font-bold text-primary-600 hover:bg-primary-500 hover:text-white"
                          >
                            <Phone
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            <span>اتصال</span>
                          </a>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-xs font-bold text-foreground">
                        {c12 > 0 && <span>{c12} × 12 صفحة </span>}
                        {c24 > 0 && <span>{c24} × 24 صفحة</span>}
                      </td>

                      <td className="px-3 py-3.5 text-xs font-semibold text-foreground">
                        {govNameMap.get(ord.governorate) ?? ord.governorate}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-foreground">
                            {totalEgp} ج.م
                          </span>
                          {ord.discount_percent > 0 && (
                            <span className="text-[11px] font-bold text-success">
                              خصم {ord.discount_percent}% مطبق
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                          {LIFECYCLE_LABELS_AR[stage] ?? stage}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-500 px-3 text-xs font-bold text-white hover:bg-primary-600"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>عرض</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
