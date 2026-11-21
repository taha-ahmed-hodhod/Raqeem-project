/**
 * Admin Notification Payload Builders & Retry Helpers.
 *
 * SECURITY & PRIVACY RULES:
 * 1. Web Push (lock-screen visible): STRICTLY PII-FREE.
 *    Title: "رقيم — طلب جديد"
 *    Body:  "وصل طلب جديد. اضغط لعرض التفاصيل"
 *    Never includes customer name, phone, address, child details, or photos.
 *
 * 2. Admin Email (sent ONLY to ADMIN_NOTIFICATION_EMAIL / ADMIN_ALLOWED_EMAIL):
 *    Includes full order details & pricing snapshot for the single owner,
 *    while keeping child photos strictly in private Supabase Storage
 *    (linking only to the login-protected /admin/orders/[id] page).
 */

export const MAX_OUTBOX_ATTEMPTS = 5;

export interface SafeOrderNotificationInput {
  orderId: string;
  reference: string;
  totalBooks?: number;
  createdAt?: string;
}

export interface AdminEmailOrderItem {
  itemIndex: number;
  pageCount: number;
  quantity: number;
  unitPricePiastres: number;
  childName: string;
  childAge: number;
  ageLabel?: string | null;
  interests: string | null;
  notes: string | null;
  hasPhoto: boolean;
}

export interface AdminEmailOrderDetails {
  orderId: string;
  reference: string;
  createdAt: string;
  customerName: string;
  phone: string;
  whatsappPhone: string | null;
  governorateNameAr: string;
  address: string;
  notes: string | null;
  subtotalPiastres: number;
  discountPercent: number;
  discountPiastres: number;
  booksTotalPiastres: number;
  shippingPiastres: number | null;
  depositSelectedPiastres?: number | null;
  depositStatus?: "not_specified" | "pending" | "received";
  items: AdminEmailOrderItem[];
}

export interface SafeWebPushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  orderId: string;
}

export interface AdminEmailPayload {
  subject: string;
  html: string;
  text: string;
  adminOrderUrl: string;
}

function sanitizeReference(reference: string): string {
  const cleaned = reference.trim().toUpperCase();
  return /^RQM-[A-Z0-9-]{4,24}$/.test(cleaned) ? cleaned : "طلب جديد";
}

function sanitizeOrderId(orderId: string): string {
  const cleaned = orderId.trim();
  return /^[0-9a-f-]{36}$/i.test(cleaned) ? cleaned : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEgp(piastres: number): string {
  const egp = piastres / 100;
  return Number.isInteger(egp) ? `${egp} ج.م` : `${egp.toFixed(2)} ج.م`;
}

function formatCairoTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Builds a strictly lock-screen-safe Web Push payload (ZERO customer/child PII).
 */
export function buildSafeWebPushPayload(
  input: SafeOrderNotificationInput,
): SafeWebPushPayload {
  const ref = sanitizeReference(input.reference);
  const safeId = sanitizeOrderId(input.orderId);
  const url = safeId ? `/admin/orders/${safeId}` : "/admin/orders";

  return {
    title: "رقيم — طلب جديد",
    body: "وصل طلب جديد. اضغط لعرض التفاصيل",
    url,
    tag: `raqeem-order-${safeId || ref}`,
    orderId: safeId,
  };
}

/**
 * Builds the detailed admin-only email containing full order details,
 * pricing snapshot in EGP, shipping state ("الشحن بانتظار التأكيد" when unknown),
 * and a protected dashboard link for private child photos (never raw photo URLs).
 */
export function buildAdminOrderEmailPayload(
  details: AdminEmailOrderDetails,
  appBaseUrl: string,
): AdminEmailPayload {
  const ref = sanitizeReference(details.reference);
  const safeId = sanitizeOrderId(details.orderId);
  const normalizedBase = appBaseUrl.replace(/\/+$/, "");
  const adminOrderUrl = safeId
    ? `${normalizedBase}/admin/orders/${safeId}`
    : `${normalizedBase}/admin/orders`;

  const subject = `طلب جديد في رقيم — ${ref}`;
  const formattedTime = formatCairoTimestamp(details.createdAt);

  const hasShippingFee =
    typeof details.shippingPiastres === "number" &&
    details.shippingPiastres >= 0;
  const shippingText = hasShippingFee
    ? formatEgp(details.shippingPiastres!)
    : "الشحن بانتظار التأكيد";

  const grandTotalPiastres = hasShippingFee
    ? details.booksTotalPiastres + details.shippingPiastres!
    : details.booksTotalPiastres;
  const grandTotalLabel = hasShippingFee
    ? `${formatEgp(grandTotalPiastres)} (شامل الشحن)`
    : `${formatEgp(grandTotalPiastres)} (قبل الشحن — الشحن بانتظار التأكيد)`;

  const photosCount = details.items.filter((item) => item.hasPhoto).length;
  const hasDeposit =
    typeof details.depositSelectedPiastres === "number" &&
    details.depositSelectedPiastres > 0;
  const depositAmountText = hasDeposit
    ? formatEgp(details.depositSelectedPiastres!)
    : "لم يُحدد";
  const depositStatusText =
    details.depositStatus === "received"
      ? "تم الاستلام ✓"
      : hasDeposit
        ? "بانتظار الاستلام قبل بدء التنفيذ"
        : "لم يُحدد";
  const remainingPiastres = hasDeposit
    ? Math.max(0, grandTotalPiastres - details.depositSelectedPiastres!)
    : grandTotalPiastres;

  const itemsText = details.items
    .map((item, idx) => {
      const lineTotal = item.unitPricePiastres * item.quantity;
      const ageDisplay = item.ageLabel || `${item.childAge} سنوات`;
      const parts = [
        `كتاب #${idx + 1}: باقة ${item.pageCount} صفحة × ${item.quantity} (${formatEgp(item.unitPricePiastres)} للنسخة — الإجمالي ${formatEgp(lineTotal)})`,
        `  - الاسم: ${item.childName} | العمر: ${ageDisplay}`,
      ];
      if (item.interests) {
        parts.push(`  - الاهتمامات/الثيم: ${item.interests}`);
      }
      if (item.notes) {
        parts.push(`  - ملاحظات التخصيص: ${item.notes}`);
      }
      if (item.hasPhoto) {
        parts.push(`  - صورة الطفل: محفوظة في التخزين الخاص (افتح رابط الطلب لعرضها)`);
      }
      return parts.join("\n");
    })
    .join("\n\n");

  const text = [
    `طلب جديد في رقيم — ${ref}`,
    `وقت الطلب: ${formattedTime}`,
    ``,
    `=== بيانات العميل والتوصيل ===`,
    `اسم العميل: ${details.customerName}`,
    `رقم التواصل: ${details.phone}`,
    details.whatsappPhone ? `رقم الواتساب: ${details.whatsappPhone}` : null,
    `المحافظة: ${details.governorateNameAr}`,
    `العنوان: ${details.address}`,
    details.notes ? `ملاحظات عامة: ${details.notes}` : null,
    ``,
    `=== تفاصيل الكتب المطلوبة (${details.items.length}) ===`,
    itemsText || "لا توجد تفاصيل كتب مسجلة.",
    ``,
    `=== ملخص الأسعار وقت الطلب ===`,
    `سعر الكتب قبل الخصم: ${formatEgp(details.subtotalPiastres)}`,
    `الخصم (${details.discountPercent}%): -${formatEgp(details.discountPiastres)}`,
    `صافي الكتب: ${formatEgp(details.booksTotalPiastres)}`,
    `الشحن: ${shippingText}`,
    `الإجمالي: ${grandTotalLabel}`,
    `الديبوزت المختار: ${depositAmountText} (${depositStatusText})`,
    hasDeposit ? `المتبقي التقديري: ${formatEgp(remainingPiastres)}` : null,
    ``,
    photosCount > 0
      ? `صور الأطفال (${photosCount}) محفوظة في التخزين الخاص ويمكن عرضها فقط بعد تسجيل دخول الأدمن:`
      : `افتح الطلب في لوحة التحكم:`,
    adminOrderUrl,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const itemsHtml = details.items
    .map((item, idx) => {
      const lineTotal = item.unitPricePiastres * item.quantity;
      return `
        <div style="border:1px solid #E8E1F2;border-radius:14px;padding:14px 16px;margin-bottom:10px;background:#FAF8FF;">
          <div style="font-weight:700;font-size:14px;color:#241747;margin-bottom:6px;">
            كتاب #${idx + 1} — باقة ${item.pageCount} صفحة × ${item.quantity}
            <span style="color:#6324C5;font-weight:800;">(${formatEgp(item.unitPricePiastres)} للنسخة — ${formatEgp(lineTotal)})</span>
          </div>
          <div style="font-size:13px;color:#4B4263;line-height:1.7;">
            <div><strong>الاسم:</strong> ${escapeHtml(item.childName)} &nbsp;|&nbsp; <strong>العمر:</strong> ${escapeHtml(item.ageLabel || `${item.childAge} سنوات`)}</div>
            ${item.interests ? `<div><strong>الاهتمامات / الثيم:</strong> ${escapeHtml(item.interests)}</div>` : ""}
            ${item.notes ? `<div><strong>ملاحظات التخصيص:</strong> ${escapeHtml(item.notes)}</div>` : ""}
            ${item.hasPhoto ? `<div style="color:#6324C5;"><strong>صورة الطفل:</strong> مرفوعة بأمان في التخزين الخاص (تظهر داخل صفحة الطلب بعد تسجيل الدخول)</div>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:24px;background-color:#F8F5FF;font-family:Tahoma,Arial,sans-serif;color:#241747;">
    <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E1F2;border-radius:20px;padding:28px;">
      <div style="display:inline-block;background:#F3EAFF;color:#6324C5;font-weight:700;font-size:12px;padding:6px 14px;border-radius:999px;margin-bottom:14px;">
        رقيم | تنبيه طلب جديد للأدمن
      </div>
      <h1 style="margin:0 0 6px;font-size:22px;color:#241747;">
        طلب جديد في رقيم — <span dir="ltr" style="color:#6324C5;">${escapeHtml(ref)}</span>
      </h1>
      <p style="margin:0 0 20px;font-size:13px;color:#625B75;">
        وقت الطلب: ${escapeHtml(formattedTime)}
      </p>

      <div style="border:1px solid #E8E1F2;border-radius:16px;padding:16px;margin-bottom:18px;">
        <h2 style="margin:0 0 10px;font-size:15px;color:#6324C5;">بيانات العميل والتوصيل</h2>
        <div style="font-size:13px;line-height:1.85;color:#241747;">
          <div><strong>اسم العميل:</strong> ${escapeHtml(details.customerName)}</div>
          <div><strong>رقم التواصل:</strong> <span dir="ltr">${escapeHtml(details.phone)}</span></div>
          ${details.whatsappPhone ? `<div><strong>رقم الواتساب:</strong> <span dir="ltr">${escapeHtml(details.whatsappPhone)}</span></div>` : ""}
          <div><strong>المحافظة:</strong> ${escapeHtml(details.governorateNameAr)}</div>
          <div><strong>العنوان:</strong> ${escapeHtml(details.address)}</div>
          ${details.notes ? `<div><strong>ملاحظات العميل:</strong> ${escapeHtml(details.notes)}</div>` : ""}
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h2 style="margin:0 0 10px;font-size:15px;color:#6324C5;">تفاصيل الكتب والتخصيص (${details.items.length})</h2>
        ${itemsHtml || `<p style="font-size:13px;color:#625B75;">لا توجد عناصر مسجلة.</p>`}
      </div>

      <div style="border:1px solid #E8E1F2;border-radius:16px;padding:16px;margin-bottom:20px;background:#FCFAFF;">
        <h2 style="margin:0 0 10px;font-size:15px;color:#6324C5;">ملخص الأسعار وقت الطلب</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#241747;">
          <tr>
            <td style="padding:5px 0;color:#625B75;">إجمالي الكتب قبل الخصم</td>
            <td style="padding:5px 0;text-align:left;font-weight:700;">${formatEgp(details.subtotalPiastres)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#625B75;">الخصم (${details.discountPercent}%)</td>
            <td style="padding:5px 0;text-align:left;font-weight:700;color:#16875D;">-${formatEgp(details.discountPiastres)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#625B75;">الشحن (${escapeHtml(details.governorateNameAr)})</td>
            <td style="padding:5px 0;text-align:left;font-weight:700;">${escapeHtml(shippingText)}</td>
          </tr>
          <tr style="border-top:1px solid #E8E1F2;">
            <td style="padding:10px 0 0;font-weight:800;font-size:15px;">الإجمالي</td>
            <td style="padding:10px 0 0;text-align:left;font-weight:800;font-size:15px;color:#6324C5;">${escapeHtml(grandTotalLabel)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0 0;color:#625B75;">الديبوزت المختار</td>
            <td style="padding:8px 0 0;text-align:left;font-weight:800;color:#B76B00;">${escapeHtml(depositAmountText)} — ${escapeHtml(depositStatusText)}</td>
          </tr>
          ${hasDeposit
      ? `<tr>
                  <td style="padding:5px 0 0;color:#625B75;">المتبقي التقديري</td>
                  <td style="padding:5px 0 0;text-align:left;font-weight:700;">${formatEgp(remainingPiastres)}</td>
                </tr>`
      : ""
    }
        </table>
      </div>

      ${photosCount > 0
      ? `<p style="margin:0 0 18px;font-size:12px;line-height:1.6;color:#625B75;background:#F8F5FF;padding:12px 14px;border-radius:12px;">
              🔒 يحتوي الطلب على ${photosCount} صورة محفوظة في التخزين الخاص (Private Storage). اضغط الزر بالأسفل لفتح الطلب في لوحة التحكم وعرض الصور بعد تسجيل دخول الأدمن.
            </p>`
      : ""
    }

      <a href="${adminOrderUrl}" style="display:inline-block;background:#6324C5;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:12px;">
        فتح تفاصيل الطلب وصور الأطفال في لوحة التحكم
      </a>
    </div>
  </body>
</html>`;

  return {
    subject,
    html,
    text,
    adminOrderUrl,
  };
}

/**
 * Exponential backoff schedule for outbox retries:
 * attempt 1 -> +1m, 2 -> +5m, 3 -> +15m, 4 -> +60m, 5+ -> +180m
 */
export function computeNextRetryAt(attempts: number, now = new Date()): string {
  const backoffMinutes = [1, 5, 15, 60, 180];
  const index = Math.min(
    Math.max(0, attempts - 1),
    backoffMinutes.length - 1,
  );
  const minutes = backoffMinutes[index] ?? 60;
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/**
 * HTTP 404 or 410 from a Web Push service indicates the browser subscription
 * has expired or been revoked and must be deleted from `push_subscriptions`.
 */
export function isExpiredPushSubscriptionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const statusCode =
    "statusCode" in error
      ? (error as { statusCode?: unknown }).statusCode
      : "status" in error
        ? (error as { status?: unknown }).status
        : undefined;

  return statusCode === 404 || statusCode === 410;
}
