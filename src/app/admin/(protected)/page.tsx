import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Eye,
  MessageCircle,
  Palette,
  Phone,
  PhoneCall,
  Wallet,
} from "lucide-react";
import {
  formatWhatsAppLink,
  getAdminOverviewAndRecentOrders,
  LIFECYCLE_LABELS_AR,
} from "@/features/admin/queries";
import type { OrderLifecycleStage } from "@/lib/supabase/types";

const PIPELINE_STAGES: Array<{
  stage: OrderLifecycleStage;
  num: string;
  title: string;
  subtitle: string;
  colorClass: string;
  badgeClass: string;
}> = [
  {
    stage: "new",
    num: "1",
    title: "جديد",
    subtitle: "بانتظار التأكيد",
    colorClass: "bg-accent-yellow-50/70 border-accent-yellow/40",
    badgeClass: "bg-warning text-white",
  },
  {
    stage: "contacted",
    num: "2",
    title: "تم التواصل",
    subtitle: "واتساب / هاتف",
    colorClass: "bg-surface-muted border-border",
    badgeClass: "bg-primary-500 text-white",
  },
  {
    stage: "confirmed",
    num: "3",
    title: "تم التأكيد",
    subtitle: "اعتماد التفاصيل",
    colorClass: "bg-primary-50/70 border-primary-500/20",
    badgeClass: "bg-primary-600 text-white",
  },
  {
    stage: "designing",
    num: "4",
    title: "رسم وتحويل",
    subtitle: "تجهيز الكارتون",
    colorClass: "bg-primary-50 border-primary-500/30",
    badgeClass: "bg-primary-700 text-white",
  },
  {
    stage: "printing",
    num: "5",
    title: "طباعة وتجليد",
    subtitle: "سلك + ورق 150ج",
    colorClass: "bg-secondary-pink-50 border-secondary-pink/30",
    badgeClass: "bg-secondary-pink text-white",
  },
  {
    stage: "shipped",
    num: "6",
    title: "تم الشحن",
    subtitle: "في الطريق للعميل",
    colorClass: "bg-surface-muted border-border",
    badgeClass: "bg-info text-white",
  },
  {
    stage: "delivered",
    num: "7",
    title: "تم التسليم",
    subtitle: "اكتمل الطلب",
    colorClass: "bg-success/5 border-success/30",
    badgeClass: "bg-success text-white",
  },
];

export default async function AdminOverviewPage() {
  const { counts, recentOrders, governorates } =
    await getAdminOverviewAndRecentOrders();

  const govNameMap = new Map(governorates.map((g) => [g.code, g.name_ar]));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner (Stitch Dashboard Header Card) */}
      <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-2xs lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span>مباشر • بيانات قاعدة البيانات الفورية</span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground lg:text-3xl">
            لوحة تحكم رقيم الإدارية
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            متابعة طلبات أولياء الأمور، مسار التصميم والتحويل الكرتوني، وحالات
            الطباعة والتسليم لجميع محافظات مصر الـ 27.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-primary-500 px-5 py-2 text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-600"
          >
            <span>عرض جميع الطلبات</span>
          </Link>
          <Link
            href="/admin/pricing"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-primary-50"
          >
            <span>إدارة الأسعار والعروض</span>
          </Link>
        </div>
      </section>

      {/* 1. Top 4 KPI Summary Cards (Stitch Layout) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground">
                إجمالي طلبات الكتب
              </span>
              <span className="mt-1 text-3xl font-extrabold text-foreground">
                {counts.totalOrders}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            تم التسليم: {counts.deliveredCount} طلب
          </span>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-accent-yellow/50 bg-surface p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground">
                  طلبات بانتظار التواصل والتأكيد
                </span>
                {counts.newPendingCount > 0 && (
                  <span className="h-2 w-2 animate-ping rounded-full bg-warning" />
                )}
              </div>
              <span className="mt-1 text-3xl font-extrabold text-warning">
                {counts.newPendingCount}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow-50 text-warning">
              <PhoneCall className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <Link
            href="/admin/orders?stage=new"
            className="text-xs font-bold text-primary-600 hover:underline"
          >
            مراجعة الطلبات الجديدة الآن ←
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground">
                في مسار الإنتاج والطباعة
              </span>
              <span className="mt-1 text-3xl font-extrabold text-foreground">
                {counts.inProductionCount}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-pink-50 text-secondary-pink">
              <Palette className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className="text-primary-600">
              {counts.stageCounts.designing} رسم كرتوني
            </span>
            <span>•</span>
            <span className="text-secondary-pink">
              {counts.stageCounts.printing} طباعة وتجليد
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground">
                إجمالي القيمة التقديرية للطلبات
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground">
                  {counts.totalEstimatedEgp.toLocaleString("ar-EG")}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  ج.م
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <span className="text-xs font-bold text-success">
            شامل خصومات الكميات المعتمدة
          </span>
        </div>
      </section>

      {/* 2. Production Lifecycle Status Pipeline (7 Steps) */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              مسار مراحل دورة حياة الطلبات
            </h2>
            <p className="text-xs text-muted-foreground">
              اضغط على أي مرحلة لتصفية الطلبات حسب حالتها التشغيلية
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>معلق: {counts.stageCounts.on_hold}</span>
            <span>•</span>
            <span>ملغي: {counts.stageCounts.cancelled}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {PIPELINE_STAGES.map((step) => {
            const count = counts.stageCounts[step.stage] ?? 0;
            return (
              <Link
                key={step.stage}
                href={`/admin/orders?stage=${step.stage}`}
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 transition-transform hover:scale-[1.01] ${step.colorClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground">
                    {step.num}. {step.title}
                  </span>
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${step.badgeClass}`}
                  >
                    {count}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {step.subtitle}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Main Split Section: Recent Orders Table (8 cols) + Action Alerts & Quick Links (4 cols) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Recent Orders Table */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                أحدث طلبات أولياء الأمور
              </h2>
              <p className="text-xs text-muted-foreground">
                قائمة مباشرة للتواصل عبر واتساب/الهاتف ومتابعة تفاصيل كل طلب
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-extrabold text-primary-600 hover:underline"
            >
              عرض الكل ←
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 py-12 text-center text-sm font-medium text-muted-foreground">
              لا توجد طلبات مسجلة حتى الآن. ستظهر الطلبات الجديدة هنا فور إرسالها.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-bold text-muted-foreground">
                    <th className="px-3 py-2.5">المرجع والتاريخ</th>
                    <th className="px-3 py-2.5">ولي الأمر والتواصل</th>
                    <th className="px-3 py-2.5">عدد الكتب</th>
                    <th className="px-3 py-2.5">المحافظة</th>
                    <th className="px-3 py-2.5">الإجمالي</th>
                    <th className="px-3 py-2.5">الحالة</th>
                    <th className="px-3 py-2.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentOrders.map((ord) => {
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
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-extrabold text-primary-700">
                              {ord.reference}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(ord.created_at).toLocaleDateString(
                                "ar-EG",
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">
                              {ord.customer_name}
                            </span>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                dir="ltr"
                                className="text-xs text-muted-foreground"
                              >
                                {ord.phone}
                              </span>
                              <a
                                href={formatWhatsAppLink(
                                  waPhone,
                                  ord.reference,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="محادثة واتساب مباشرة"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-success/15 text-success hover:bg-success hover:text-white"
                              >
                                <MessageCircle
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </a>
                              <a
                                href={`tel:${ord.phone}`}
                                title="اتصال هاتفي"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white"
                              >
                                <Phone
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs font-bold text-foreground">
                          {c12 > 0 && <span>{c12}×12ص </span>}
                          {c24 > 0 && <span>{c24}×24ص</span>}
                        </td>

                        <td className="px-3 py-3 text-xs font-semibold text-foreground">
                          {govNameMap.get(ord.governorate) ?? ord.governorate}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-foreground">
                              {totalEgp} ج.م
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {ord.shipping_piastres === null
                                ? "قبل الشحن"
                                : "شامل الشحن"}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                            {LIFECYCLE_LABELS_AR[stage] ?? stage}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors hover:bg-primary-500 hover:text-white"
                            title="عرض تفاصيل الطلب وصور الأطفال"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
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

        {/* Right Narrow Column: Action Required Alerts & Quick Management */}
        <aside className="flex flex-col gap-5 lg:col-span-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-yellow-50 text-warning">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-base font-extrabold text-foreground">
                  تنبيهات المهام العاجلة
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 rounded-xl border-r-4 border-warning bg-accent-yellow-50/70 p-3.5">
                <span className="text-xs font-extrabold text-warning">
                  تأكيد الطلبات الجديدة
                </span>
                <p className="text-xs leading-relaxed text-foreground">
                  يوجد <strong>{counts.stageCounts.new} طلب جديد</strong> بانتظار
                  التواصل مع ولي الأمر عبر واتساب أو الهاتف لتأكيد التفاصيل
                  ومصاريف الشحن.
                </p>
                <Link
                  href="/admin/orders?stage=new"
                  className="self-end text-xs font-extrabold text-primary-600 hover:underline"
                >
                  فتح قائمة الطلبات الجديدة ←
                </Link>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border-r-4 border-primary-500 bg-primary-50/70 p-3.5">
                <span className="text-xs font-extrabold text-primary-700">
                  مصاريف شحن المحافظات
                </span>
                <p className="text-xs leading-relaxed text-foreground">
                  يمكنك تحديد أو تحديث أسعار الشحن لكل محافظة من الـ 27 محافظة
                  أو تركها لتتأكد بعد التواصل.
                </p>
                <Link
                  href="/admin/shipping"
                  className="self-end text-xs font-extrabold text-primary-600 hover:underline"
                >
                  إدارة أسعار الشحن ←
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <h2 className="text-base font-extrabold text-foreground">
              اختصارات الإدارة السريعة
            </h2>
            <div className="grid grid-cols-1 gap-2 text-xs font-bold">
              <Link
                href="/admin/pricing"
                className="flex items-center justify-between rounded-xl bg-surface-muted/70 px-3.5 py-2.5 text-foreground hover:bg-primary-50 hover:text-primary-600"
              >
                <span>تعديل أسعار باقات 12 و24 صفحة</span>
                <CheckCircle2 className="h-4 w-4 text-primary-500" />
              </Link>
              <Link
                href="/admin/promotions"
                className="flex items-center justify-between rounded-xl bg-surface-muted/70 px-3.5 py-2.5 text-foreground hover:bg-primary-50 hover:text-primary-600"
              >
                <span>تعديل عروض وخصومات الكميات (10% / 20%)</span>
                <CheckCircle2 className="h-4 w-4 text-primary-500" />
              </Link>
              <Link
                href="/admin/portfolio"
                className="flex items-center justify-between rounded-xl bg-surface-muted/70 px-3.5 py-2.5 text-foreground hover:bg-primary-50 hover:text-primary-600"
              >
                <span>إضافة عمل جديد لمعرض الأعمال</span>
                <CheckCircle2 className="h-4 w-4 text-primary-500" />
              </Link>
              <Link
                href="/admin/content"
                className="flex items-center justify-between rounded-xl bg-surface-muted/70 px-3.5 py-2.5 text-foreground hover:bg-primary-50 hover:text-primary-600"
              >
                <span>تعديل نصوص الموقع ثنائية اللغة</span>
                <CheckCircle2 className="h-4 w-4 text-primary-500" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
