import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@supabase/supabase-js";
import arMessages from "@/messages/ar.json";
import {
  DEFAULT_BOOK_VARIANTS,
  DEFAULT_PROMOTIONS,
} from "@/features/content/cms-data";
import {
  calculateOrderPricing,
  createOrderPricingSnapshot,
} from "@/features/pricing/pricing-engine";
import { OrderRequestForm } from "@/features/orders/order-request-form";
import type { GovernorateRow } from "@/lib/supabase/types";

const pushMock = vi.fn();

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/order",
  useRouter: () => ({ replace: vi.fn(), push: pushMock }),
}));

const GOV_CAIRO_PENDING: GovernorateRow = {
  code: "cairo",
  name_ar: "القاهرة",
  name_en: "Cairo",
  fee_piastres: null,
  active: true,
  sort_order: 1,
  updated_at: "2026-11-19T00:00:00Z",
};

const GOV_GIZA_KNOWN: GovernorateRow = {
  code: "giza",
  name_ar: "الجيزة",
  name_en: "Giza",
  fee_piastres: 5000, // 50 EGP
  active: true,
  sort_order: 2,
  updated_at: "2026-11-19T00:00:00Z",
};

describe("M3 — Order Form and Pricing Engine", () => {
  describe("Shared Pricing Engine (1, 2, 3, 4+ books, mixed variants, shipping states)", () => {
    it("calculates 1x12-page = 250 EGP and 1x24-page = 350 EGP with 0% discount", () => {
      const est12 = calculateOrderPricing({
        items: [{ pageCount: 12, quantity: 1 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(est12.totalBooks).toBe(1);
      expect(est12.booksSubtotalEgp).toBe(250);
      expect(est12.appliedDiscountPercent).toBe(0);
      expect(est12.booksTotalEgp).toBe(250);

      const est24 = calculateOrderPricing({
        items: [{ pageCount: 24, quantity: 1 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(est24.totalBooks).toBe(1);
      expect(est24.booksSubtotalEgp).toBe(350);
      expect(est24.appliedDiscountPercent).toBe(0);
      expect(est24.booksTotalEgp).toBe(350);
    });

    it("calculates 2x12-page = 500 - 10% (50) = 450 EGP and 3x24-page = 1050 - 20% (210) = 840 EGP", () => {
      const two12 = calculateOrderPricing({
        items: [{ pageCount: 12, quantity: 2 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(two12.totalBooks).toBe(2);
      expect(two12.booksSubtotalEgp).toBe(500);
      expect(two12.appliedDiscountPercent).toBe(10);
      expect(two12.discountEgp).toBe(50);
      expect(two12.booksTotalEgp).toBe(450);

      const three24 = calculateOrderPricing({
        items: [{ pageCount: 24, quantity: 3 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(three24.totalBooks).toBe(3);
      expect(three24.booksSubtotalEgp).toBe(1050);
      expect(three24.appliedDiscountPercent).toBe(20);
      expect(three24.discountEgp).toBe(210);
      expect(three24.booksTotalEgp).toBe(840);
    });

    it("combines mixed 12-page and 24-page books for quantity discounts and applies single highest tier for 4+ books", () => {
      // 1x12 + 1x24 = 600 - 10% (60) = 540 EGP
      const mixedTwo = calculateOrderPricing({
        items: [
          { pageCount: 12, quantity: 1 },
          { pageCount: 24, quantity: 1 },
        ],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(mixedTwo.totalBooks).toBe(2);
      expect(mixedTwo.booksSubtotalEgp).toBe(600);
      expect(mixedTwo.appliedDiscountPercent).toBe(10);
      expect(mixedTwo.discountEgp).toBe(60);
      expect(mixedTwo.booksTotalEgp).toBe(540);

      // 4 books (2x12 + 2x24 = 1200) -> 20% off (240) = 960 EGP (no stacking!)
      const mixedFour = calculateOrderPricing({
        items: [
          { pageCount: 12, quantity: 2 },
          { pageCount: 24, quantity: 2 },
        ],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
      });
      expect(mixedFour.totalBooks).toBe(4);
      expect(mixedFour.booksSubtotalEgp).toBe(1200);
      expect(mixedFour.appliedDiscountPercent).toBe(20);
      expect(mixedFour.discountEgp).toBe(240);
      expect(mixedFour.booksTotalEgp).toBe(960);
    });

    it("handles nullable shipping as pending_confirmation (never 0) and never discounts known shipping", () => {
      const pendingShip = calculateOrderPricing({
        items: [{ pageCount: 12, quantity: 2 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
        governorate: GOV_CAIRO_PENDING,
      });
      expect(pendingShip.shippingStatus).toBe("pending_confirmation");
      expect(pendingShip.shippingPiastres).toBeNull();
      expect(pendingShip.shippingEgp).toBeNull();
      expect(pendingShip.isFinalTotalKnown).toBe(false);
      expect(pendingShip.estimatedTotalEgp).toBe(450);

      const knownShip = calculateOrderPricing({
        items: [{ pageCount: 12, quantity: 2 }],
        bookVariants: DEFAULT_BOOK_VARIANTS,
        promotions: DEFAULT_PROMOTIONS,
        governorate: GOV_GIZA_KNOWN,
      });
      expect(knownShip.shippingStatus).toBe("known");
      expect(knownShip.shippingEgp).toBe(50);
      expect(knownShip.isFinalTotalKnown).toBe(true);
      // 450 books + 50 full shipping (shipping is never discounted) = 500 EGP
      expect(knownShip.estimatedTotalEgp).toBe(500);
    });

    it("creates immutable pricing snapshots unaffected by later catalog price changes", () => {
      const mutableVariants = structuredClone(DEFAULT_BOOK_VARIANTS);
      const estimate = calculateOrderPricing({
        items: [{ pageCount: 12, quantity: 2 }],
        bookVariants: mutableVariants,
        promotions: DEFAULT_PROMOTIONS,
        governorate: GOV_CAIRO_PENDING,
      });
      const snapshot = createOrderPricingSnapshot(estimate);

      // Admin later changes 12-page price to 400 EGP
      mutableVariants[0]!.price_piastres = 40000;
      mutableVariants[0]!.price_egp = 400;

      expect(snapshot.price12Piastres).toBe(25000);
      expect(snapshot.booksTotalPiastres).toBe(45000);
    });
  });

  describe("OrderRequestForm UI, Multi-Child Configurator, and Submission Flow", () => {
    it("supports adding multiple children/books, updates live discount summary, enforces consent, and submits cleanly", async () => {
      pushMock.mockReset();

      const mockUpload = vi.fn(async () => ({
        ok: true as const,
        photoPath:
          "orders/11111111-2222-4333-8444-555555555555/22222222-3333-4444-8555-666666666666.jpg",
      }));

      const mockSubmit = vi.fn(async () => ({
        ok: true as const,
        orderId: "11111111-2222-4333-8444-555555555555",
        reference: "RQM-TEST2026",
        deduplicated: false,
        snapshot: {
          capturedAtIso: "2026-11-19T00:00:00Z",
          count12: 1,
          count24: 1,
          totalBooks: 2,
          price12Piastres: 25000,
          price24Piastres: 35000,
          booksSubtotalPiastres: 60000,
          discountPercent: 10,
          discountPiastres: 6000,
          booksTotalPiastres: 54000,
          shippingStatus: "pending_confirmation" as const,
          shippingPiastres: null,
          estimatedTotalPiastres: 54000,
        },
      }));

      render(
        <NextIntlClientProvider locale="ar" messages={arMessages}>
          <OrderRequestForm
            initialPageCount={12}
            bookVariants={DEFAULT_BOOK_VARIANTS}
            promotions={DEFAULT_PROMOTIONS}
            governorates={[GOV_CAIRO_PENDING, GOV_GIZA_KNOWN]}
            customUploadHandler={mockUpload}
            customSubmitHandler={mockSubmit}
          />
        </NextIntlClientProvider>,
      );

      // Initially 1 x 12-page book = 250 EGP
      expect(screen.getByTestId("summary-books-total")).toHaveTextContent(
        "250 ج.م",
      );
      expect(screen.getByTestId("summary-shipping-pending")).toHaveTextContent(
        "مصاريف الشحن هتتأكد معاك بعد إرسال الطلب",
      );

      // Guardian consent checkbox must start UNCHECKED
      const consentCheckbox = screen.getByRole("checkbox");
      expect(consentCheckbox).not.toBeChecked();

      // Add a second child book
      const addBookBtn = screen.getByRole("button", {
        name: /إضافة كتاب لطفل آخر/,
      });
      fireEvent.click(addBookBtn);

      // Now 2 x 12-page books = 500 - 10% (50) = 450 EGP
      expect(screen.getByTestId("summary-subtotal")).toHaveTextContent(
        "500 ج.م",
      );
      expect(screen.getByTestId("summary-discount")).toHaveTextContent(
        "-50 ج.م",
      );
      expect(screen.getByTestId("summary-books-total")).toHaveTextContent(
        "450 ج.م",
      );

      // Switch Book #2 to 24 pages -> 250 + 350 = 600 - 10% (60) = 540 EGP
      const book2Card = screen.getByTestId("book-item-card-1");
      const book2Btn24 = book2Card.querySelectorAll("button")[2]!;
      fireEvent.click(book2Btn24);
      expect(screen.getByTestId("summary-books-total")).toHaveTextContent(
        "540 ج.م",
      );

      // Fill child 1 & child 2 fields and upload photos
      const nameInputs = screen.getAllByPlaceholderText(/مثال: سليم/);
      const ageInputs = screen.getAllByPlaceholderText(/مثال: 5/);

      fireEvent.change(nameInputs[0]!, { target: { value: "سليم" } });
      fireEvent.change(ageInputs[0]!, { target: { value: "5" } });
      fireEvent.change(nameInputs[1]!, { target: { value: "فريدة" } });
      fireEvent.change(ageInputs[1]!, { target: { value: "4" } });

      const fileInputs = document.querySelectorAll('input[type="file"]');
      const dummyFile = new File(
        [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1])],
        "child.jpg",
        { type: "image/jpeg" },
      );

      fireEvent.change(fileInputs[0]!, { target: { files: [dummyFile] } });
      fireEvent.change(fileInputs[1]!, { target: { files: [dummyFile] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(2);
      });

      // Fill guardian contact & select Cairo (nullable shipping)
      fireEvent.change(
        screen.getByLabelText(/اسم ولي الأمر بالكامل/),
        { target: { value: "محمد أحمد" } },
      );
      fireEvent.change(
        screen.getByLabelText(/رقم الموبايل المصري/),
        { target: { value: "01012345678" } },
      );
      fireEvent.change(screen.getByLabelText(/المحافظة/), {
        target: { value: "cairo" },
      });
      fireEvent.change(
        screen.getByLabelText(/عنوان التوصيل بالتفصيل/),
        { target: { value: "مدينة نصر، شارع عباس العقاد، عمارة 10" } },
      );

      // Check guardian consent & submit
      fireEvent.click(consentCheckbox);
      expect(consentCheckbox).toBeChecked();

      const submitBtn = screen.getByRole("button", { name: "إرسال الطلب" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith(
          "/order/success?ref=RQM-TEST2026",
        );
      });
    });
  });

  describe("Live Supabase Transactional RPC & Idempotency Verification", () => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://ojdlkoqettqnlluqfnmt.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZGxrb3FldHRxbmxsdXFmbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDEyOTYsImV4cCI6MjExMDYxNzI5Nn0.X2MLR-ywUe3GqtTfhapEQkWQvc3N9V46NYUk1XOe04o";

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    it("atomically snapshots mixed-book prices and deduplicates retried requests with the same idempotency_key", async () => {
      const idempotencyKey = crypto.randomUUID();
      const orderPayload = {
        p_idempotency_key: idempotencyKey,
        p_customer_name: "أحمد اختبار",
        p_phone: "01012345678",
        p_whatsapp_phone: null,
        p_governorate: "cairo",
        p_address: "القاهرة، مدينة نصر، شارع مكرم عبيد",
        p_notes: "اختبار عدم تكرار الطلب",
        p_consent_accepted: true,
        p_items: [
          {
            page_count: 12,
            quantity: 1,
            child_name: "سليم",
            child_age: 5,
            interests: "الفضاء",
            notes: null,
            photo_path: `orders/${idempotencyKey}/${crypto.randomUUID()}.jpg`,
          },
          {
            page_count: 24,
            quantity: 2,
            child_name: "فريدة",
            child_age: 4,
            interests: "الفراشات",
            notes: null,
            photo_path: `orders/${idempotencyKey}/${crypto.randomUUID()}.jpg`,
          },
        ],
      };

      // Read current live catalog prices so test stays accurate even after admin price edits
      const { data: liveVariants } = await client
        .from("book_variants")
        .select("page_count, price_piastres")
        .order("page_count");
      const price12 =
        liveVariants?.find((v) => v.page_count === 12)?.price_piastres ?? 25000;
      const price24 =
        liveVariants?.find((v) => v.page_count === 24)?.price_piastres ?? 35000;
      const expectedSubtotal = price12 * 1 + price24 * 2;
      const expectedDiscount = Math.round(expectedSubtotal * 0.2);
      const expectedBooksTotal = expectedSubtotal - expectedDiscount;

      // 1st submission: 1x12 + 2x24 -> 3 books -> 20% off
      const { data: firstData, error: firstErr } = await client.rpc(
        "submit_order_request",
        orderPayload,
      );
      expect(firstErr).toBeNull();
      const firstResult = firstData as {
        order_id: string;
        reference: string;
        deduplicated: boolean;
        subtotal_piastres: number;
        discount_percent: number;
        discount_piastres: number;
        books_total_piastres: number;
        shipping_piastres: number | null;
      };

      expect(firstResult.deduplicated).toBe(false);
      expect(firstResult.reference).toMatch(/^RQM-[A-Z0-9]{8}$/);
      expect(firstResult.subtotal_piastres).toBe(expectedSubtotal);
      expect(firstResult.discount_percent).toBe(20);
      expect(firstResult.discount_piastres).toBe(expectedDiscount);
      expect(firstResult.books_total_piastres).toBe(expectedBooksTotal);

      // 2nd submission with same idempotency_key (simulating double click / network retry)
      const { data: secondData, error: secondErr } = await client.rpc(
        "submit_order_request",
        orderPayload,
      );
      expect(secondErr).toBeNull();
      const secondResult = secondData as typeof firstResult;

      expect(secondResult.deduplicated).toBe(true);
      expect(secondResult.order_id).toBe(firstResult.order_id);
      expect(secondResult.reference).toBe(firstResult.reference);
    });
  });
});
