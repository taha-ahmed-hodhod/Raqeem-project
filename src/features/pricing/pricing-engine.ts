import type {
  BookPageCount,
  BookVariantRow,
  GovernorateRow,
  PromotionRow,
} from "@/lib/supabase/types";

export interface PricingLineItemInput {
  pageCount: BookPageCount;
  quantity: number;
}

export interface CalculatedLineItem {
  pageCount: BookPageCount;
  quantity: number;
  unitPricePiastres: number;
  unitPriceEgp: number;
  lineSubtotalPiastres: number;
  lineSubtotalEgp: number;
}

export type ShippingStatus =
  | "unselected"
  | "pending_confirmation"
  | "known";

export interface OrderPricingEstimate {
  lineItems: CalculatedLineItem[];
  count12: number;
  count24: number;
  totalBooks: number;
  price12Piastres: number;
  price24Piastres: number;
  price12Egp: number;
  price24Egp: number;
  booksSubtotalPiastres: number;
  booksSubtotalEgp: number;
  appliedDiscountPercent: number;
  appliedPromotionTitleAr: string | null;
  appliedPromotionTitleEn: string | null;
  discountPiastres: number;
  discountEgp: number;
  booksTotalPiastres: number;
  booksTotalEgp: number;
  shippingStatus: ShippingStatus;
  shippingPiastres: number | null;
  shippingEgp: number | null;
  estimatedTotalPiastres: number;
  estimatedTotalEgp: number;
  isFinalTotalKnown: boolean;
}

export interface OrderPricingSnapshot {
  capturedAtIso: string;
  count12: number;
  count24: number;
  totalBooks: number;
  price12Piastres: number;
  price24Piastres: number;
  booksSubtotalPiastres: number;
  discountPercent: number;
  discountPiastres: number;
  booksTotalPiastres: number;
  shippingStatus: ShippingStatus;
  shippingPiastres: number | null;
  estimatedTotalPiastres: number;
}

export function piastresToEgp(piastres: number): number {
  return piastres / 100;
}

export function egpToPiastres(egp: number): number {
  return Math.round(egp * 100);
}

/**
 * Selects the single highest qualifying active promotion tier.
 * Rules (GEMINI.md §2):
 * - 2 books -> 10% off book subtotal
 * - 3+ books -> 20% off book subtotal
 * - Highest qualifying discount only; no stacking; shipping never discounted.
 */
export function findBestQualifyingPromotion(
  totalBooks: number,
  promotions: PromotionRow[],
  now: Date = new Date(),
): PromotionRow | null {
  if (totalBooks < 1 || promotions.length === 0) {
    return null;
  }

  const nowMs = now.getTime();

  const qualifying = promotions.filter((promo) => {
    if (!promo.active) return false;
    if (promo.min_quantity > totalBooks) return false;
    if (promo.percent <= 0 || promo.percent > 100) return false;
    if (promo.starts_at && new Date(promo.starts_at).getTime() > nowMs) {
      return false;
    }
    if (promo.ends_at && new Date(promo.ends_at).getTime() < nowMs) {
      return false;
    }
    return true;
  });

  if (qualifying.length === 0) {
    return null;
  }

  qualifying.sort((a, b) => {
    if (b.percent !== a.percent) {
      return b.percent - a.percent;
    }
    return b.min_quantity - a.min_quantity;
  });

  return qualifying[0] ?? null;
}

/**
 * Pure, deterministic pricing engine shared between client UX and server recalculation.
 * Uses integer minor units (piastres) to prevent floating-point errors.
 */
export function calculateOrderPricing(input: {
  items: PricingLineItemInput[];
  bookVariants: BookVariantRow[];
  promotions: PromotionRow[];
  governorate?: GovernorateRow | null;
  now?: Date;
}): OrderPricingEstimate {
  const variant12 = input.bookVariants.find((v) => v.page_count === 12);
  const variant24 = input.bookVariants.find((v) => v.page_count === 24);

  const price12Piastres = variant12?.price_piastres ?? 25000;
  const price24Piastres = variant24?.price_piastres ?? 35000;

  let count12 = 0;
  let count24 = 0;

  const lineItems: CalculatedLineItem[] = input.items.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitPricePiastres =
      item.pageCount === 24 ? price24Piastres : price12Piastres;
    const lineSubtotalPiastres = unitPricePiastres * qty;

    if (item.pageCount === 24) {
      count24 += qty;
    } else {
      count12 += qty;
    }

    return {
      pageCount: item.pageCount,
      quantity: qty,
      unitPricePiastres,
      unitPriceEgp: piastresToEgp(unitPricePiastres),
      lineSubtotalPiastres,
      lineSubtotalEgp: piastresToEgp(lineSubtotalPiastres),
    };
  });

  const totalBooks = count12 + count24;
  const booksSubtotalPiastres =
    count12 * price12Piastres + count24 * price24Piastres;

  const bestPromo = findBestQualifyingPromotion(
    totalBooks,
    input.promotions,
    input.now,
  );
  const appliedDiscountPercent = bestPromo?.percent ?? 0;

  // Integer half-up rounding in piastres: ((percent * subtotal + 50) / 100)
  const discountPiastres = Math.floor(
    (appliedDiscountPercent * booksSubtotalPiastres + 50) / 100,
  );
  const booksTotalPiastres = Math.max(
    0,
    booksSubtotalPiastres - discountPiastres,
  );

  let shippingStatus: ShippingStatus = "unselected";
  let shippingPiastres: number | null = null;

  if (input.governorate) {
    if (
      typeof input.governorate.fee_piastres === "number" &&
      input.governorate.fee_piastres >= 0
    ) {
      shippingStatus = "known";
      shippingPiastres = input.governorate.fee_piastres;
    } else {
      shippingStatus = "pending_confirmation";
      shippingPiastres = null;
    }
  }

  const isFinalTotalKnown =
    shippingStatus === "known" && shippingPiastres !== null;
  const estimatedTotalPiastres =
    booksTotalPiastres + (shippingPiastres ?? 0);

  return {
    lineItems,
    count12,
    count24,
    totalBooks,
    price12Piastres,
    price24Piastres,
    price12Egp: piastresToEgp(price12Piastres),
    price24Egp: piastresToEgp(price24Piastres),
    booksSubtotalPiastres,
    booksSubtotalEgp: piastresToEgp(booksSubtotalPiastres),
    appliedDiscountPercent,
    appliedPromotionTitleAr: bestPromo?.title_ar ?? null,
    appliedPromotionTitleEn: bestPromo?.title_en ?? null,
    discountPiastres,
    discountEgp: piastresToEgp(discountPiastres),
    booksTotalPiastres,
    booksTotalEgp: piastresToEgp(booksTotalPiastres),
    shippingStatus,
    shippingPiastres,
    shippingEgp:
      shippingPiastres !== null ? piastresToEgp(shippingPiastres) : null,
    estimatedTotalPiastres,
    estimatedTotalEgp: piastresToEgp(estimatedTotalPiastres),
    isFinalTotalKnown,
  };
}

/**
 * Creates an immutable pricing snapshot for an order so future admin price or
 * promotion edits never alter historical order records.
 */
export function createOrderPricingSnapshot(
  estimate: OrderPricingEstimate,
  now: Date = new Date(),
): OrderPricingSnapshot {
  return {
    capturedAtIso: now.toISOString(),
    count12: estimate.count12,
    count24: estimate.count24,
    totalBooks: estimate.totalBooks,
    price12Piastres: estimate.price12Piastres,
    price24Piastres: estimate.price24Piastres,
    booksSubtotalPiastres: estimate.booksSubtotalPiastres,
    discountPercent: estimate.appliedDiscountPercent,
    discountPiastres: estimate.discountPiastres,
    booksTotalPiastres: estimate.booksTotalPiastres,
    shippingStatus: estimate.shippingStatus,
    shippingPiastres: estimate.shippingPiastres,
    estimatedTotalPiastres: estimate.estimatedTotalPiastres,
  };
}
