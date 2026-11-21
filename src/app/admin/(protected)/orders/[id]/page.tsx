import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  formatWhatsAppLink,
  getAdminOrderDetailById,
  LIFECYCLE_LABELS_AR,
} from "@/features/admin/queries";
import { confirmOrderDepositAction } from "@/features/admin/actions";
import { OrderStatusUpdateForm } from "@/features/admin/order-status-update-form";
import type { OrderLifecycleStage } from "@/lib/supabase/types";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, items, events, governorate } =
    await getAdminOrderDetailById(id);

  if (!order) {
    notFound();
  }

  const currentStage = (order.lifecycle_stage ||
    order.status ||
    "new") as OrderLifecycleStage;

  const subtotalPiastres =
    order.books_subtotal_piastres && order.books_subtotal_piastres > 0
      ? order.books_subtotal_piastres
      : (order.subtotal_piastres ?? 0);

  const discountPiastres =
    order.books_discount_piastres && order.books_discount_piastres > 0
      ? order.books_discount_piastres
      : (order.discount_piastres ?? 0);

  const booksTotalPiastres =
    order.books_total_piastres && order.books_total_piastres > 0
      ? order.books_total_piastres
      : subtotalPiastres - discountPiastres;

  const shippingEgp =
    order.shipping_piastres !== null
      ? Math.round(order.shipping_piastres / 100)
      : null;

  const finalQuoteEgp =
    order.final_quote_piastres !== null
      ? Math.round(order.final_quote_piastres / 100)
      : null;

  const waPhone = order.whatsapp_phone || order.phone;

  async function handleConfirmDeposit(formData: FormData) {
    "use server";
    await confirmOrderDepositAction(formData);
  }

  const depositSelectedEgp =
    typeof order.deposit_selected_piastres === "number" &&
      order.deposit_selected_piastres > 0
      ? Math.round(order.deposit_selected_piastres / 100)
      : null;
  const depositStatus = order.deposit_status ?? "not_specified";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:underline"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span>العودة لقائمة الطلبات</span>
        </Link>
      </div>

      {/* Top Order Summary Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-extrabold text-primary-700">
              {order.reference}
            </h1>
            <span className="rounded-full bg-primary-50 px-3.5 py-1 text-xs font-extrabold text-primary-700">
              {LIFECYCLE_LABELS_AR[currentStage] ?? currentStage}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            تاريخ الإنشاء:{" "}
            {new Date(order.created_at).toLocaleString("ar-EG")} • موافقة ولي
            الأمر موثقة بتاريخ:{" "}
            {new Date(order.consent_at).toLocaleString("ar-EG")}
          </p>
        </div>

        {/* Direct WhatsApp & Phone Call Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={formatWhatsAppLink(waPhone, order.reference)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>تواصل مع ولي الأمر عبر واتساب</span>
          </a>
          <a
            href={`tel:${order.phone}`}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary-50"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span dir="ltr">{order.phone}</span>
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Child Books & Private Photos + Guardian Info (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Child Books & Private Signed Photos */}
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="h-5 w-5 text-primary-500"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-extrabold text-foreground">
                  الكتب المخصصة وصور الأطفال الخاصة ({items.length})
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>روابط صور موقعة مؤقتة (10 دقائق)</span>
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl bg-surface-muted/50 p-4 text-sm text-muted-foreground">
                الطلب يحتوي على {order.count_12} كتاب (12 صفحة) و{order.count_24}{" "}
                كتاب (24 صفحة). المسار الخاص للصورة:{" "}
                <code className="font-mono text-xs">
                  {order.photo_path || "غير مرفق"}
                </code>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-background p-4 sm:grid-cols-12"
                  >
                    {/* Private Child Photo Preview (via temporary Signed URL) */}
                    <div className="flex flex-col items-center gap-2 sm:col-span-4">
                      {item.signedPhotoUrl ? (
                        <a
                          href={item.signedPhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square w-full max-w-[160px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.signedPhotoUrl}
                            alt={`صورة الطفل ${item.child_name}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-square w-full max-w-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-3 text-center text-xs text-muted-foreground">
                          <Lock className="mb-1 h-5 w-5 text-primary-500" />
                          <span>مسار خاص محفوظ:</span>
                          <span className="mt-1 break-all font-mono text-[10px]">
                            {item.photo_path}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Child Configuration Details */}
                    <div className="flex flex-col justify-between gap-2 sm:col-span-8">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-primary-50 px-3 py-0.5 text-xs font-extrabold text-primary-700">
                          الكتاب #{idx + 1} • {item.page_count} صفحة ×{" "}
                          {item.quantity} نسخة
                        </span>
                        <span className="text-sm font-extrabold text-foreground">
                          {Math.round(
                            (item.unit_price_piastres * item.quantity) / 100,
                          )}{" "}
                          ج.م
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            اسم الطفل على الغلاف:
                          </span>
                          <p className="font-extrabold text-foreground">
                            {item.child_name}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            العمر:
                          </span>
                          <p className="font-bold text-foreground">
                            {item.age_label || `${item.child_age} سنوات`}
                          </p>
                        </div>
                      </div>

                      {item.interests && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">
                            الاهتمامات وعالم القصة:{" "}
                          </span>
                          <span className="font-bold text-foreground">
                            {item.interests}
                          </span>
                        </div>
                      )}

                      {item.notes && (
                        <div className="rounded-lg bg-surface p-2.5 text-xs">
                          <span className="text-muted-foreground">
                            ملاحظات/إهداء الكتاب:{" "}
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Guardian & Delivery Information */}
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <User className="h-5 w-5 text-primary-500" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-foreground">
                بيانات ولي الأمر وعنوان التوصيل
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  اسم ولي الأمر:
                </span>
                <p className="font-extrabold text-foreground">
                  {order.customer_name}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  رقم الموبايل الأساسي:
                </span>
                <p dir="ltr" className="text-end font-bold text-foreground">
                  {order.phone}
                </p>
              </div>
              {order.whatsapp_phone && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    رقم واتساب إضافي:
                  </span>
                  <p dir="ltr" className="text-end font-bold text-foreground">
                    {order.whatsapp_phone}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">المحافظة:</span>
                <p className="inline-flex items-center gap-1 font-bold text-foreground">
                  <MapPin
                    className="h-4 w-4 text-primary-500"
                    aria-hidden="true"
                  />
                  <span>{governorate?.name_ar ?? order.governorate}</span>
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">
                  العنوان التفصيلي:
                </span>
                <p className="mt-0.5 rounded-xl bg-surface-muted/60 p-3 font-semibold text-foreground">
                  {order.address}
                </p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">
                    ملاحظات ولي الأمر الإضافية:
                  </span>
                  <p className="mt-0.5 rounded-xl bg-accent-yellow-50/70 p-3 font-semibold text-foreground">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Pricing Snapshot, Status & Notes Editor, and Audit Timeline (5 cols) */}
        <aside className="flex flex-col gap-6 lg:col-span-5">
          {/* Pricing Snapshot Card */}
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h2 className="text-lg font-extrabold text-foreground">
                لقطة التسعير المحفوظة وقت الطلب
              </h2>
              <ShieldCheck
                className="h-5 w-5 text-success"
                aria-hidden="true"
              />
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>سعر نسخة 12ص / 24ص وقت الطلب:</span>
                <span className="font-bold text-foreground">
                  {Math.round(order.price_12 / 100)} /{" "}
                  {Math.round(order.price_24 / 100)} ج.م
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>إجمالي الكتب قبل الخصم:</span>
                <span className="font-bold text-foreground">
                  {Math.round(subtotalPiastres / 100)} ج.م
                </span>
              </div>
              <div className="flex justify-between text-success">
                <span>خصم الكميات ({order.discount_percent}%):</span>
                <span className="font-extrabold">
                  -{Math.round(discountPiastres / 100)} ج.م
                </span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-foreground">
                <span>صافي سعر الكتب:</span>
                <span className="text-primary-600">
                  {Math.round(booksTotalPiastres / 100)} ج.م
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>مصاريف الشحن:</span>
                <span className="font-bold text-foreground">
                  {shippingEgp !== null
                    ? `${shippingEgp} ج.م`
                    : "بانتظار التأكيد مع العميل"}
                </span>
              </div>
              <div className="mt-1 flex justify-between rounded-xl bg-accent-yellow-50 p-3 font-extrabold text-foreground">
                <span>الإجمالي النهائي المعتمد:</span>
                <span className="text-lg text-primary-700">
                  {finalQuoteEgp ??
                    Math.round(booksTotalPiastres / 100) +
                    (shippingEgp ?? 0)}{" "}
                  ج.م
                </span>
              </div>

              {/* Deposit Selected & Manual Receipt Confirmation */}
              <div className="mt-2 flex flex-col gap-2.5 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    الديبوزت المختار:
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {depositSelectedEgp !== null
                      ? `${depositSelectedEgp} ج.م`
                      : "لم يُحدد"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    حالة الاستلام:
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${depositStatus === "received"
                      ? "bg-success/15 text-success"
                      : depositStatus === "pending"
                        ? "bg-accent-yellow-50 text-warning"
                        : "bg-surface-muted text-muted-foreground"
                      }`}
                  >
                    {depositStatus === "received"
                      ? "تم استلام الديبوزت ✓"
                      : depositStatus === "pending"
                        ? "بانتظار استلام الديبوزت"
                        : "لم يُحدد"}
                  </span>
                </div>

                {depositSelectedEgp !== null && (
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs">
                    <span className="text-muted-foreground">
                      المتبقي التقديري:
                    </span>
                    <span className="font-extrabold text-foreground">
                      {Math.max(
                        0,
                        (finalQuoteEgp ??
                          Math.round(booksTotalPiastres / 100) +
                          (shippingEgp ?? 0)) - depositSelectedEgp,
                      )}{" "}
                      ج.م
                    </span>
                  </div>
                )}

                {depositSelectedEgp !== null && (
                  <form action={handleConfirmDeposit} className="pt-1">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input
                      type="hidden"
                      name="depositStatus"
                      value={
                        depositStatus === "received" ? "pending" : "received"
                      }
                    />
                    <button
                      type="submit"
                      className={`min-h-[40px] w-full cursor-pointer rounded-xl px-4 py-2 text-xs font-extrabold transition-colors ${depositStatus === "received"
                        ? "border border-border bg-surface text-muted-foreground hover:text-foreground"
                        : "bg-success text-white shadow-xs hover:bg-success/90"
                        }`}
                    >
                      {depositStatus === "received"
                        ? "التراجع إلى «بانتظار الاستلام»"
                        : `تأكيد استلام ديبوزت ${depositSelectedEgp} ج.م يدويًا`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* Update Order Lifecycle Status, Confirmed Shipping/Quote & Internal Notes */}
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
            <h2 className="text-lg font-extrabold text-foreground">
              تحديث حالة الطلب والملاحظات الإدارية
            </h2>

            <OrderStatusUpdateForm
              key={`${order.id}-${currentStage}-${order.updated_at}`}
              orderId={order.id}
              initialStage={currentStage}
              initialShippingEgp={shippingEgp}
              initialFinalQuoteEgp={finalQuoteEgp}
              initialAdminNotes={order.admin_notes ?? ""}
            />
          </section>

          {/* Status History Timeline */}
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
              <Clock className="h-5 w-5 text-primary-500" aria-hidden="true" />
              <h2 className="text-base font-extrabold text-foreground">
                سجل تغييرات حالة الطلب ({events.length})
              </h2>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                لا توجد أحداث مسجلة بعد.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5 text-xs">
                {events.map((ev) => {
                  const newLabel =
                    LIFECYCLE_LABELS_AR[ev.new_status as OrderLifecycleStage] ??
                    ev.new_status;
                  const oldLabel = ev.old_status
                    ? (LIFECYCLE_LABELS_AR[
                      ev.old_status as OrderLifecycleStage
                    ] ?? ev.old_status)
                    : null;

                  return (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-0.5 rounded-xl bg-surface-muted/60 p-3"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>
                          {oldLabel ? `${oldLabel} ← ${newLabel}` : newLabel}
                        </span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString("ar-EG")}
                        </span>
                      </div>
                      {ev.note && (
                        <p className="text-muted-foreground">{ev.note}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
