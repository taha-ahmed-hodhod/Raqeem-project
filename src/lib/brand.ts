/**
 * Single source of truth for Raqeem | رقيم brand contact & commercial constants.
 * Note: Customer phone numbers stored inside `orders` remain completely independent.
 */

export const RAQEEM_WHATSAPP_LOCAL = "01038639918";
export const RAQEEM_WHATSAPP_INTL = "201038639918";
export const RAQEEM_WHATSAPP_BASE_URL = `https://wa.me/${RAQEEM_WHATSAPP_INTL}`;

export const RAQEEM_SLA_AR = "مدة التنفيذ والتوصيل من 5 إلى 7 أيام";
export const RAQEEM_SLA_EN = "Production & delivery take 5 to 7 days";

export const RAQEEM_GIFT_AR = "علبة ألوان 12 لون هدية مع الأوردر";
export const RAQEEM_GIFT_EN = "Free 12-color pencil box with every order";

export function getRaqeemWhatsAppUrl(prefillMessage?: string): string {
  if (!prefillMessage || !prefillMessage.trim()) {
    return RAQEEM_WHATSAPP_BASE_URL;
  }
  return `${RAQEEM_WHATSAPP_BASE_URL}?text=${encodeURIComponent(prefillMessage.trim())}`;
}

export function normalizeBrandWhatsAppUrl(phone?: string | null): string {
  const raw = (phone ?? "").replace(/\D/g, "");
  if (!raw) {
    return RAQEEM_WHATSAPP_BASE_URL;
  }
  if (raw.startsWith("20") && raw.length >= 12) {
    return `https://wa.me/${raw}`;
  }
  if (raw.startsWith("0") && raw.length >= 11) {
    return `https://wa.me/20${raw.slice(1)}`;
  }
  return RAQEEM_WHATSAPP_BASE_URL;
}
