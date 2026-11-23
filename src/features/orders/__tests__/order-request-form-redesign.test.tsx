import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OrderRequestForm } from "@/features/orders/order-request-form";
import type {
  BookVariantRow,
  GovernorateRow,
  PromotionRow,
} from "@/lib/supabase/types";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/shared/toast-provider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/lib/image-compression", () => ({
  compressImageForUpload: async (file: File) => file,
}));

const VARIANTS: BookVariantRow[] = [
  {
    page_count: 12,
    price_piastres: 20000,
    price_egp: 200,
    active: true,
    title_ar: "كتاب 12 صفحة",
    title_en: "12-Page Book",
    updated_at: "2026-11-23T00:00:00Z",
  },
  {
    page_count: 24,
    price_piastres: 35000,
    price_egp: 350,
    active: true,
    title_ar: "كتاب 24 صفحة",
    title_en: "24-Page Book",
    updated_at: "2026-11-23T00:00:00Z",
  },
];

const PROMOS: PromotionRow[] = [
  {
    min_quantity: 2,
    percent: 10,
    active: true,
    title_ar: "خصم كتابين",
    title_en: "2 books",
    starts_at: null,
    ends_at: null,
    updated_at: "2026-11-23T00:00:00Z",
  },
  {
    min_quantity: 3,
    percent: 20,
    active: true,
    title_ar: "خصم 3 كتب",
    title_en: "3+ books",
    starts_at: null,
    ends_at: null,
    updated_at: "2026-11-23T00:00:00Z",
  },
];

const GOVS: GovernorateRow[] = [
  {
    code: "cairo",
    name_ar: "القاهرة",
    name_en: "Cairo",
    fee_piastres: 6000,
    active: true,
    sort_order: 1,
    updated_at: "2026-11-23T00:00:00Z",
  },
  {
    code: "aswan",
    name_ar: "أسوان",
    name_en: "Aswan",
    fee_piastres: null,
    active: true,
    sort_order: 2,
    updated_at: "2026-11-23T00:00:00Z",
  },
];

describe("Redesigned OrderRequestForm acceptance journey", () => {
  it("starts with no deposit selected, disables options above books total, removes >18 button & tech jargon, supports adding a 2nd book, and blocks submit until valid deposit chosen", async () => {
    const uploadSpy = vi.fn().mockResolvedValue({
      ok: true as const,
      photoPath: "child-photos/test/photo.webp",
    });
    const submitSpy = vi.fn().mockResolvedValue({
      ok: true as const,
      orderId: "ord-1",
      reference: "RQM-12345678",
      deduplicated: false,
      snapshot: {
        capturedAtIso: "2026-11-23T00:00:00Z",
        count12: 2,
        count24: 0,
        totalBooks: 2,
        price12Piastres: 20000,
        price24Piastres: 35000,
        booksSubtotalPiastres: 40000,
        discountPercent: 10,
        discountPiastres: 4000,
        booksTotalPiastres: 36000,
        shippingStatus: "known" as const,
        shippingPiastres: 6000,
        estimatedTotalPiastres: 42000,
      },
    });

    render(
      <OrderRequestForm
        initialPageCount={12}
        bookVariants={VARIANTS}
        promotions={PROMOS}
        governorates={GOVS}
        customUploadHandler={uploadSpy}
        customSubmitHandler={submitSpy}
      />,
    );

    // 1. No >18 button and no technical encryption/storage jargon
    expect(screen.queryByText(/أكبر من 18 سنة/)).not.toBeInTheDocument();
    expect(screen.queryByText(/مشفّر|تخزين خاص/)).not.toBeInTheDocument();

    // 2. Deposit starts completely unselected, and 300 EGP is disabled when 1x12-page = 200 EGP
    const dep100 = screen.getByRole("radio", { name: "100 ج.م" });
    const dep200 = screen.getByRole("radio", { name: "200 ج.م" });
    const dep300 = screen.getByRole("radio", { name: "300 ج.م" });
    expect(dep100).toHaveAttribute("aria-checked", "false");
    expect(dep200).toHaveAttribute("aria-checked", "false");
    expect(dep300).toBeDisabled();

    // 3. Fill Book #1 with adult age (>18) directly in العمر بالسنوات
    fireEvent.change(screen.getByLabelText("الاسم على الغلاف *"), {
      target: { value: "سليم" },
    });
    fireEvent.change(screen.getByLabelText("العمر بالسنوات *"), {
      target: { value: "25" },
    });
    const file1 = new File([new Uint8Array([1, 2, 3])], "hero1.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(
      screen.getByLabelText("ارفع صورة واضحة لصاحب الكتاب *"),
      { target: { files: [file1] } },
    );
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));

    // 4. Add a 2nd book — preserves Book #1 data, applies 10% discount, and enables 300 EGP deposit
    fireEvent.click(screen.getByRole("button", { name: /إضافة كتاب آخر/ }));
    expect(screen.getAllByLabelText("الاسم على الغلاف *")).toHaveLength(2);
    expect(screen.getAllByLabelText("الاسم على الغلاف *")[0]).toHaveValue(
      "سليم",
    );
    expect(dep300).not.toBeDisabled();

    // Fill Book #2
    fireEvent.change(screen.getAllByLabelText("الاسم على الغلاف *")[1]!, {
      target: { value: "فريدة" },
    });
    fireEvent.change(screen.getAllByLabelText("العمر بالسنوات *")[1]!, {
      target: { value: "7" },
    });
    const file2 = new File([new Uint8Array([4, 5, 6])], "hero2.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(
      screen.getAllByLabelText("ارفع صورة واضحة لصاحب الكتاب *")[1]!,
      { target: { files: [file2] } },
    );
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(2));

    // 5. Fill delivery details & select governorate
    fireEvent.change(screen.getByLabelText("الاسم الكامل للمستلم *"), {
      target: { value: "أحمد محمد" },
    });
    fireEvent.change(screen.getByLabelText("رقم الموبايل *"), {
      target: { value: "01012345678" },
    });
    const govSelect = screen.getByLabelText("المحافظة *");
    expect(govSelect).toHaveValue("");
    fireEvent.change(govSelect, { target: { value: "cairo" } });
    fireEvent.change(screen.getByLabelText("العنوان بالتفصيل *"), {
      target: { value: "شارع النصر، المعادي، القاهرة" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    // 6. Attempt submit BEFORE choosing deposit -> blocked!
    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));
    expect(submitSpy).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(/يرجى اختيار قيمة الديبوزت/).length,
    ).toBeGreaterThan(0);

    // 7. Select valid deposit (200 EGP) -> remaining balance MUST include Cairo shipping:
    //    2 books = 400 - 10% (40) = 360 + 60 shipping = 420 total -> 420 - 200 deposit = 220 EGP!
    fireEvent.click(dep200);
    expect(
      screen.getByText(
        "المبلغ المتبقي بعد دفع الديبوزت (شامل الشحن): 220 ج.م",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));
    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));
    expect(submitSpy.mock.calls[0]?.[0]?.depositSelectedEgp).toBe(200);
  });

  it("shows a simple friendly message without technical details when order submission fails", async () => {
    const uploadSpy = vi.fn().mockResolvedValue({
      ok: true as const,
      photoPath: "child-photos/test/photo.webp",
    });
    const failingSubmitSpy = vi.fn().mockResolvedValue({
      ok: false as const,
      errorCode: "submission_failed" as const,
      message: "raw postgres internal error should never appear",
    });

    render(
      <OrderRequestForm
        initialPageCount={12}
        bookVariants={VARIANTS}
        promotions={PROMOS}
        governorates={GOVS}
        customUploadHandler={uploadSpy}
        customSubmitHandler={failingSubmitSpy}
      />,
    );

    fireEvent.change(screen.getByLabelText("الاسم على الغلاف *"), {
      target: { value: "سليم" },
    });
    fireEvent.change(screen.getByLabelText("العمر بالسنوات *"), {
      target: { value: "7" },
    });
    const file = new File([new Uint8Array([1, 2, 3])], "hero.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(
      screen.getByLabelText("ارفع صورة واضحة لصاحب الكتاب *"),
      { target: { files: [file] } },
    );
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("الاسم الكامل للمستلم *"), {
      target: { value: "أحمد محمد" },
    });
    fireEvent.change(screen.getByLabelText("رقم الموبايل *"), {
      target: { value: "01012345678" },
    });
    fireEvent.change(screen.getByLabelText("المحافظة *"), {
      target: { value: "cairo" },
    });
    fireEvent.change(screen.getByLabelText("العنوان بالتفصيل *"), {
      target: { value: "شارع النصر، المعادي" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "100 ج.م" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "إرسال الطلب" }));

    await waitFor(() =>
      expect(
        screen.getByText("حصل خطأ ولم يتم إرسال الطلب. يرجى المحاولة مرة أخرى."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/raw postgres/i)).not.toBeInTheDocument();
  });
});
