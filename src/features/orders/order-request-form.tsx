"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  ImagePlus,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Send,
  Trash2,
  Truck,
} from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useToast } from "@/components/shared/toast-provider";
import type { Locale } from "@/lib/i18n/routing";
import type {
  BookPageCount,
  BookVariantRow,
  GovernorateRow,
  PromotionRow,
} from "@/lib/supabase/types";
import {
  EGYPT_GOVERNORATE_CODES,
  normalizeEgyptianPhone,
  type EgyptGovernorateCode,
} from "@/lib/validation/order-request";
import { calculateOrderPricing } from "@/features/pricing/pricing-engine";
import {
  submitOrderRequestAction,
  uploadChildPhotoAction,
} from "@/features/orders/actions";
import { compressImageForUpload } from "@/lib/image-compression";
import { cn } from "@/lib/utils";

export interface OrderFormBookItemState {
  clientId: string;
  pageCount: BookPageCount;
  quantity: number;
  childName: string;
  childAge: string;
  selectedThemes: string[];
  customInterests: string;
  notes: string;
  photoPath: string;
  photoPreviewUrl: string | null;
  photoFileName: string | null;
  uploadState: "idle" | "uploading" | "uploaded" | "error";
  uploadError: string | null;
}

interface OrderRequestFormProps {
  initialPageCount?: BookPageCount;
  bookVariants: BookVariantRow[];
  promotions: PromotionRow[];
  governorates: GovernorateRow[];
  customUploadHandler?: (
    formData: FormData,
  ) => ReturnType<typeof uploadChildPhotoAction>;
  customSubmitHandler?: typeof submitOrderRequestAction;
}

const DEPOSIT_OPTIONS = [100, 200, 300] as const;

const THEME_CHIPS: Array<{ id: string; ar: string; en: string }> = [
  { id: "space", ar: "الفضاء والكواكب", en: "Space & Planets" },
  { id: "animals", ar: "الحيوانات والغابة", en: "Animals & Jungle" },
  { id: "princess", ar: "الأميرات والفراشات", en: "Butterflies & Royalty" },
  { id: "football", ar: "كرة القدم والرياضة", en: "Football & Sports" },
  { id: "dinosaurs", ar: "الديناصورات", en: "Dinosaurs" },
  { id: "sea", ar: "عالم البحار والدلافين", en: "Ocean & Dolphins" },
];

const FALLBACK_GOVERNORATES: Array<{
  code: EgyptGovernorateCode;
  name_ar: string;
  name_en: string;
  fee_piastres: number | null;
}> = [
  { code: "cairo", name_ar: "القاهرة", name_en: "Cairo", fee_piastres: null },
  { code: "giza", name_ar: "الجيزة", name_en: "Giza", fee_piastres: null },
  { code: "alexandria", name_ar: "الإسكندرية", name_en: "Alexandria", fee_piastres: null },
  { code: "qalyubia", name_ar: "القليوبية", name_en: "Qalyubia", fee_piastres: null },
  { code: "dakahlia", name_ar: "الدقهلية", name_en: "Dakahlia", fee_piastres: null },
  { code: "sharqia", name_ar: "الشرقية", name_en: "Sharqia", fee_piastres: null },
  { code: "gharbia", name_ar: "الغربية", name_en: "Gharbia", fee_piastres: null },
  { code: "monufia", name_ar: "المنوفية", name_en: "Monufia", fee_piastres: null },
  { code: "beheira", name_ar: "البحيرة", name_en: "Beheira", fee_piastres: null },
  { code: "kafr-el-sheikh", name_ar: "كفر الشيخ", name_en: "Kafr El Sheikh", fee_piastres: null },
  { code: "damietta", name_ar: "دمياط", name_en: "Damietta", fee_piastres: null },
  { code: "port-said", name_ar: "بورسعيد", name_en: "Port Said", fee_piastres: null },
  { code: "ismailia", name_ar: "الإسماعيلية", name_en: "Ismailia", fee_piastres: null },
  { code: "suez", name_ar: "السويس", name_en: "Suez", fee_piastres: null },
  { code: "fayoum", name_ar: "الفيوم", name_en: "Fayoum", fee_piastres: null },
  { code: "beni-suef", name_ar: "بني سويف", name_en: "Beni Suef", fee_piastres: null },
  { code: "minya", name_ar: "المنيا", name_en: "Minya", fee_piastres: null },
  { code: "assiut", name_ar: "أسيوط", name_en: "Assiut", fee_piastres: null },
  { code: "sohag", name_ar: "سوهاج", name_en: "Sohag", fee_piastres: null },
  { code: "qena", name_ar: "قنا", name_en: "Qena", fee_piastres: null },
  { code: "luxor", name_ar: "الأقصر", name_en: "Luxor", fee_piastres: null },
  { code: "aswan", name_ar: "أسوان", name_en: "Aswan", fee_piastres: null },
  { code: "red-sea", name_ar: "البحر الأحمر", name_en: "Red Sea", fee_piastres: null },
  { code: "new-valley", name_ar: "الوادي الجديد", name_en: "New Valley", fee_piastres: null },
  { code: "matrouh", name_ar: "مطروح", name_en: "Matrouh", fee_piastres: null },
  { code: "north-sinai", name_ar: "شمال سيناء", name_en: "North Sinai", fee_piastres: null },
  { code: "south-sinai", name_ar: "جنوب سيناء", name_en: "South Sinai", fee_piastres: null },
];

function createEmptyBookItem(
  pageCount: BookPageCount = 12,
  index = 1,
): OrderFormBookItemState {
  return {
    clientId: `book-${index}`,
    pageCount,
    quantity: 1,
    childName: "",
    childAge: "",
    selectedThemes: [],
    customInterests: "",
    notes: "",
    photoPath: "",
    photoPreviewUrl: null,
    photoFileName: null,
    uploadState: "idle",
    uploadError: null,
  };
}

export function OrderRequestForm({
  initialPageCount = 12,
  bookVariants,
  promotions,
  governorates,
  customUploadHandler,
  customSubmitHandler,
}: OrderRequestFormProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const router = useRouter();
  const { showToast } = useToast();

  const draftOrderIdRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const summaryCardRef = useRef<HTMLDivElement | null>(null);
  const [nextItemCounter, setNextItemCounter] = useState<number>(2);
  const [canStickSummary, setCanStickSummary] = useState<boolean>(true);

  function getOrCreateDraftOrderId(): string {
    if (!draftOrderIdRef.current) {
      draftOrderIdRef.current = crypto.randomUUID();
    }
    return draftOrderIdRef.current;
  }

  function getOrCreateIdempotencyKey(): string {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    return idempotencyKeyRef.current;
  }

  const [items, setItems] = useState<OrderFormBookItemState[]>(() => [
    createEmptyBookItem(initialPageCount, 1),
  ]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [governorateCode, setGovernorateCode] = useState<string>("");
  const [address, setAddress] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  // Deposit MUST start unselected — customer chooses explicitly before submitting
  const [depositSelectedEgp, setDepositSelectedEgp] = useState<
    100 | 200 | 300 | null
  >(null);
  const [depositNotice, setDepositNotice] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false); // MUST start unchecked
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const variant12 = bookVariants.find((v) => v.page_count === 12);
  const variant24 = bookVariants.find((v) => v.page_count === 24);
  const price12 = variant12?.price_egp ?? 250;
  const price24 = variant24?.price_egp ?? 350;

  const activeGovernorates = useMemo(() => {
    if (governorates && governorates.length > 0) {
      return governorates;
    }
    return FALLBACK_GOVERNORATES.map((g, i) => ({
      ...g,
      active: true,
      sort_order: i + 1,
      updated_at: "2026-11-19T00:00:00Z",
    }));
  }, [governorates]);

  const selectedGovernorate = useMemo(
    () => activeGovernorates.find((g) => g.code === governorateCode) ?? null,
    [activeGovernorates, governorateCode],
  );

  const pricingEstimate = useMemo(
    () =>
      calculateOrderPricing({
        items: items.map((item) => ({
          pageCount: item.pageCount,
          quantity: item.quantity,
        })),
        bookVariants,
        promotions,
        governorate: selectedGovernorate,
      }),
    [items, bookVariants, promotions, selectedGovernorate],
  );

  // If the customer changes books and the chosen deposit now exceeds the books total,
  // treat it as unselected and display an immediate prompt to pick a valid deposit amount.
  const depositExceededTotal =
    depositSelectedEgp !== null &&
    depositSelectedEgp > pricingEstimate.booksTotalEgp;

  const effectiveDepositEgp = depositExceededTotal ? null : depositSelectedEgp;

  const effectiveDepositNotice = depositExceededTotal
    ? isAr
      ? "قيمة الديبوزت السابقة أصبحت أعلى من إجمالي الكتب. يرجى اختيار قيمة صالحة من جديد."
      : "Your previous deposit exceeds the updated books total. Please choose a valid deposit."
    : depositNotice;

  // Conditional sticky summary on desktop: stick ONLY when the full summary card fits
  // comfortably inside the viewport below the fixed navbar (with clear top & bottom spacing).
  useEffect(() => {
    const el = summaryCardRef.current;
    if (!el || typeof window === "undefined") return;

    const evaluateStickyFit = () => {
      const cardHeight = el.getBoundingClientRect().height;
      // 116px top offset (fixed announcement + navbar + spacing) + 32px bottom breathing room
      const requiredHeight = cardHeight + 148;
      setCanStickSummary(cardHeight > 0 && requiredHeight <= window.innerHeight);
    };

    evaluateStickyFit();
    window.addEventListener("resize", evaluateStickyFit);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(evaluateStickyFit);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("resize", evaluateStickyFit);
      observer?.disconnect();
    };
  }, [items.length, governorateCode, effectiveDepositEgp]);

  // Save non-sensitive draft text to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "raqeem_order_draft_v1",
        JSON.stringify({
          customerName,
          phone,
          whatsappPhone,
          governorateCode,
          address,
          generalNotes,
        }),
      );
    } catch {
      // sessionStorage may be unavailable
    }
  }, [
    customerName,
    phone,
    whatsappPhone,
    governorateCode,
    address,
    generalNotes,
  ]);

  function updateItem(
    clientId: string,
    updater: (prev: OrderFormBookItemState) => OrderFormBookItemState,
  ) {
    setItems((prev) =>
      prev.map((item) => (item.clientId === clientId ? updater(item) : item)),
    );
  }

  function handleAddChildBook() {
    if (items.length >= 10) return;
    const nextId = nextItemCounter;
    setNextItemCounter((c) => c + 1);
    setItems((prev) => [
      ...prev,
      createEmptyBookItem(initialPageCount, nextId),
    ]);
  }

  function handleRemoveChildBook(clientId: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.clientId !== clientId));
  }

  function toggleThemeChip(clientId: string, label: string) {
    updateItem(clientId, (item) => {
      const exists = item.selectedThemes.includes(label);
      return {
        ...item,
        selectedThemes: exists
          ? item.selectedThemes.filter((t) => t !== label)
          : [...item.selectedThemes, label],
      };
    });
  }

  async function handlePhotoSelect(clientId: string, file: File | null) {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      updateItem(clientId, (item) => ({
        ...item,
        uploadState: "error",
        uploadError: isAr
          ? "حجم الصورة كبير جدًا. اختر صورة أصغر من 15 ميجابايت."
          : "Photo is too large. Please pick an image under 15 MB.",
      }));
      return;
    }

    const previewUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : null;

    updateItem(clientId, (item) => ({
      ...item,
      photoPreviewUrl: previewUrl,
      photoFileName: file.name,
      uploadState: "uploading",
      uploadError: null,
    }));

    const processedFile = await compressImageForUpload(file, {
      maxDimension: 1280,
      quality: 0.82,
    });

    if (processedFile.size > 2 * 1024 * 1024) {
      updateItem(clientId, (item) => ({
        ...item,
        uploadState: "error",
        uploadError: isAr
          ? "حجم الصورة لا يزال كبيرًا. اختر صورة أصغر حجمًا وأعد المحاولة."
          : "Image is still too large. Please choose a smaller photo and retry.",
      }));
      return;
    }

    const sizeKb = Math.max(1, Math.round(processedFile.size / 1024));
    const displayLabel = `${processedFile.name} (${sizeKb} KB)`;

    const fd = new FormData();
    fd.set("orderId", getOrCreateDraftOrderId());
    fd.set("file", processedFile);

    const uploader = customUploadHandler ?? uploadChildPhotoAction;
    const res = await uploader(fd);

    if (!res.ok) {
      const errMsg =
        res.errorCode === "file_too_large"
          ? isAr
            ? "حجم الصورة أكبر من المسموح. اختر صورة أصغر."
            : "Image exceeds the size limit. Please pick a smaller photo."
          : res.errorCode === "unsupported_mime" ||
              res.errorCode === "signature_mismatch"
            ? isAr
              ? "الصيغة غير مدعومة. اختر صورة JPG أو PNG أو WebP."
              : "Unsupported file type. Please choose a JPG, PNG, or WebP photo."
            : isAr
              ? "تعذر رفع الصورة. تأكد من اتصالك بالإنترنت وأعد المحاولة."
              : "Could not upload photo. Check your connection and try again.";

      updateItem(clientId, (item) => ({
        ...item,
        photoPath: "",
        uploadState: "error",
        uploadError: errMsg,
      }));
      return;
    }

    updateItem(clientId, (item) => ({
      ...item,
      photoPath: res.photoPath,
      photoFileName: displayLabel,
      uploadState: "uploaded",
      uploadError: null,
    }));
  }

  function handleRemovePhoto(clientId: string) {
    updateItem(clientId, (item) => ({
      ...item,
      photoPath: "",
      photoPreviewUrl: null,
      photoFileName: null,
      uploadState: "idle",
      uploadError: null,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: string[] = [];
    let firstInvalidFieldId: string | null = null;
    const recordError = (message: string, fieldId: string) => {
      errors.push(message);
      if (!firstInvalidFieldId) {
        firstInvalidFieldId = fieldId;
      }
    };

    items.forEach((item, idx) => {
      const bookNum = idx + 1;
      if (!item.childName.trim()) {
        recordError(
          isAr
            ? `يرجى إدخال الاسم على الغلاف للكتاب رقم ${bookNum}.`
            : `Please enter the cover name for Book #${bookNum}.`,
          `child-name-${item.clientId}`,
        );
      }
      const ageNum = Number(item.childAge);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 99) {
        recordError(
          isAr
            ? `يرجى إدخال عمر صحيح بالسنوات في الكتاب رقم ${bookNum}.`
            : `Please enter a valid age in years for Book #${bookNum}.`,
          `child-age-${item.clientId}`,
        );
      }
      if (!item.photoPath) {
        recordError(
          isAr
            ? `يرجى رفع صورة واضحة لصاحب الكتاب رقم ${bookNum}.`
            : `Please upload a clear photo for Book #${bookNum}.`,
          `child-photo-${item.clientId}`,
        );
      }
    });

    if (customerName.trim().length < 2) {
      recordError(
        isAr ? "يرجى إدخال الاسم الكامل للمستلم." : "Please enter the recipient's full name.",
        "guardian-name",
      );
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!/^01[0125][0-9]{8}$/.test(normalizedPhone)) {
      recordError(
        isAr
          ? "يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01012345678)."
          : "Please enter a valid 11-digit Egyptian mobile number.",
        "guardian-phone",
      );
    }

    if (whatsappPhone.trim().length > 0) {
      const normalizedWa = normalizeEgyptianPhone(whatsappPhone);
      if (!/^01[0125][0-9]{8}$/.test(normalizedWa)) {
        recordError(
          isAr
            ? "رقم الواتساب الإضافي غير صحيح (يجب أن يكون رقم موبايل مصري صحيح)."
            : "Optional WhatsApp number must be a valid Egyptian mobile number.",
          "guardian-whatsapp",
        );
      }
    }

    if (
      !governorateCode ||
      !EGYPT_GOVERNORATE_CODES.includes(
        governorateCode as EgyptGovernorateCode,
      )
    ) {
      recordError(
        isAr ? "يرجى اختيار المحافظة من القائمة." : "Please select a governorate.",
        "guardian-governorate",
      );
    }

    if (address.trim().length < 5) {
      recordError(
        isAr
          ? "يرجى إدخال العنوان بالتفصيل (المنطقة، الشارع، رقم العقار)."
          : "Please enter the detailed delivery address.",
        "guardian-address",
      );
    }

    if (effectiveDepositEgp === null) {
      const msg = isAr
        ? "يرجى اختيار قيمة الديبوزت (100 أو 200 أو 300 ج.م) لإرسال الطلب."
        : "Please select a deposit amount (100, 200, or 300 EGP) to submit your request.";
      setDepositNotice(msg);
      recordError(msg, "deposit-selector-group");
    }

    if (!consentAccepted) {
      recordError(
        isAr
          ? "يرجى الموافقة على استخدام الصورة لتنفيذ الكتاب وسياسة الخصوصية."
          : "Please accept the photo usage consent and privacy policy.",
        "guardian-consent",
      );
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      showToast({
        variant: "error",
        title: isAr
          ? "يرجى استكمال الحقول المطلوبة"
          : "Please complete the required fields",
        description: errors[0],
      });
      if (firstInvalidFieldId && typeof document !== "undefined") {
        const el = document.getElementById(firstInvalidFieldId);
        if (el) {
          el.scrollIntoView?.({ behavior: "smooth", block: "center" });
          if ("focus" in el && typeof el.focus === "function") {
            el.focus({ preventScroll: true });
          }
        }
      }
      return;
    }

    setFormErrors([]);
    setDepositNotice(null);
    setIsSubmitting(true);

    try {
      const submitter = customSubmitHandler ?? submitOrderRequestAction;
      const result = await submitter({
        idempotencyKey: getOrCreateIdempotencyKey(),
        items: items.map((item) => {
          const combinedInterests = [
            ...item.selectedThemes,
            item.customInterests.trim(),
          ]
            .filter(Boolean)
            .join("، ");

          const ageVal = Number(item.childAge);
          return {
            pageCount: item.pageCount,
            quantity: item.quantity,
            childName: item.childName.trim(),
            childAge: ageVal,
            ageLabel: `${ageVal} ${isAr ? "سنة" : "years"}`,
            interests: combinedInterests || undefined,
            notes: item.notes.trim() || undefined,
            photoPath: item.photoPath,
          };
        }),
        customerName: customerName.trim(),
        phone: normalizedPhone,
        whatsappPhone: whatsappPhone.trim() || undefined,
        governorate: governorateCode as EgyptGovernorateCode,
        address: address.trim(),
        notes: generalNotes.trim() || undefined,
        depositSelectedEgp: effectiveDepositEgp!,
        consentAccepted: true,
        honeypot,
      });

      if (!result.ok) {
        const friendlyErr =
          result.errorCode === "rate_limited"
            ? isAr
              ? "تم إرسال عدة طلبات خلال وقت قصير. يرجى الانتظار قليلًا والمحاولة مرة أخرى."
              : "Too many requests in a short time. Please wait a moment and try again."
            : isAr
              ? "حصل خطأ ولم يتم إرسال الطلب. يرجى المحاولة مرة أخرى."
              : "Something went wrong and your request was not sent. Please try again.";
        setFormErrors([friendlyErr]);
        showToast({ variant: "error", title: friendlyErr });
        setIsSubmitting(false);
        return;
      }

      try {
        sessionStorage.removeItem("raqeem_order_draft_v1");
      } catch {
        // ignore
      }

      showToast({
        variant: "success",
        title: isAr ? "تم استلام طلبك بنجاح!" : "Request received!",
        description: isAr
          ? `رقم الطلب: ${result.reference}`
          : `Reference: ${result.reference}`,
      });

      const params = new URLSearchParams({
        ref: result.reference,
        books: String(result.snapshot.totalBooks),
        total: String(Math.round(result.snapshot.booksTotalPiastres / 100)),
      });
      router.push(`/order/success?${params.toString()}`);
    } catch {
      const friendlyErr = isAr
        ? "حصل خطأ ولم يتم إرسال الطلب. يرجى المحاولة مرة أخرى."
        : "Something went wrong and your request was not sent. Please try again.";
      setFormErrors([friendlyErr]);
      showToast({ variant: "error", title: friendlyErr });
      setIsSubmitting(false);
    }
  }

  const shippingSummaryText = !selectedGovernorate
    ? isAr
      ? "الشحن حسب المحافظة"
      : "Shipping by governorate"
    : pricingEstimate.shippingStatus === "pending_confirmation"
      ? isAr
        ? "يُحدّد الشحن عند تأكيد الطلب"
        : "Shipping confirmed after contact"
      : pricingEstimate.shippingEgp === 0
        ? isAr
          ? "شحن مجاني (0 ج.م)"
          : "Free shipping (0 EGP)"
        : `${pricingEstimate.shippingEgp} ${isAr ? "ج.م" : "EGP"}`;

  const displayTotalAmount = pricingEstimate.isFinalTotalKnown
    ? pricingEstimate.estimatedTotalEgp
    : pricingEstimate.booksTotalEgp;

  const displayTotalLabel = pricingEstimate.isFinalTotalKnown
    ? isAr
      ? "الإجمالي شامل الشحن"
      : "Total incl. shipping"
    : isAr
      ? "إجمالي الكتب"
      : "Books total";

  // Include shipping fee in remaining balance whenever shipping cost is known
  const remainingAfterDeposit =
    effectiveDepositEgp !== null
      ? Math.max(0, displayTotalAmount - effectiveDepositEgp)
      : null;

  function renderOrderSummaryCard(ref?: React.RefObject<HTMLDivElement | null>) {
    return (
      <div
        ref={ref}
        className="flex flex-col gap-4 rounded-[24px] border border-[#E7DAF5] bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-10px_rgba(99,36,197,0.15)]"
      >
        {/* Summary Header */}
        <div className="flex items-center justify-center gap-2 border-b border-[#EFE6FA] pb-3">
          <ClipboardList
            className="h-5 w-5 text-[#6324C5]"
            aria-hidden="true"
          />
          <h3 className="text-lg font-extrabold text-[#43158C]">
            {isAr ? "ملخص طلبك" : "Order Summary"}
          </h3>
        </div>

        {/* Book Lines */}
        <ul className="flex flex-col gap-2.5 text-sm">
          {items.map((item, idx) => {
            const unitPrice = item.pageCount === 24 ? price24 : price12;
            const lineTotal = unitPrice * item.quantity;
            return (
              <li
                key={`summary-${item.clientId}`}
                className="flex items-start justify-between gap-2 rounded-xl bg-[#FAF6FF] px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-extrabold text-[#241747]">
                    {isAr
                      ? `كتاب ${item.pageCount} صفحة`
                      : `${item.pageCount}-Page Book`}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                  <span className="text-xs font-medium text-[#625B75]">
                    {item.childName.trim()
                      ? item.childName.trim()
                      : isAr
                        ? `الكتاب #${idx + 1}`
                        : `Book #${idx + 1}`}
                  </span>
                </div>
                <span className="shrink-0 font-extrabold text-[#43158C] tabular-nums">
                  {lineTotal} {isAr ? "ج.م" : "EGP"}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Discount Row (only shown when a quantity discount applies) */}
        {pricingEstimate.discountEgp > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-[#ECFDF5] px-3 py-2 text-xs font-extrabold text-[#16875D]">
            <span>
              {isAr
                ? `خصم الكميات (${pricingEstimate.appliedDiscountPercent}%)`
                : `Quantity discount (${pricingEstimate.appliedDiscountPercent}%)`}
            </span>
            <span className="tabular-nums">
              − {pricingEstimate.discountEgp} {isAr ? "ج.م" : "EGP"}
            </span>
          </div>
        )}

        {/* Shipping Status */}
        <div className="flex items-center justify-between gap-2 border-t border-[#EFE6FA] pt-3 text-xs font-bold text-[#625B75]">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4 shrink-0 text-[#6324C5]" aria-hidden="true" />
            <span>{isAr ? "الشحن" : "Shipping"}</span>
          </span>
          <span
            className={cn(
              "text-end font-extrabold",
              pricingEstimate.shippingStatus === "known" &&
                pricingEstimate.shippingEgp === 0
                ? "text-[#16875D]"
                : "text-[#43158C]",
            )}
          >
            {shippingSummaryText}
          </span>
        </div>

        {/* Single Clear Total Pill (no repeated identical totals) */}
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#EFE3FF] px-4 py-3 text-center">
          <span className="text-xs font-bold text-[#5A2D9C]">
            {displayTotalLabel}
          </span>
          <span className="text-2xl font-black text-[#43158C] tabular-nums">
            {displayTotalAmount} {isAr ? "ج.م" : "EGP"}
          </span>
        </div>

        {/* Compact Deposit Breakdown if chosen */}
        {effectiveDepositEgp !== null && remainingAfterDeposit !== null && (
          <div className="rounded-xl border border-[#E7DAF5] bg-white px-3 py-2 text-center text-xs font-bold text-[#523970]">
            {isAr
              ? `الديبوزت المختار: ${effectiveDepositEgp} ج.م • المتبقي: ${remainingAfterDeposit} ج.م`
              : `Selected deposit: ${effectiveDepositEgp} EGP • Remaining: ${remainingAfterDeposit} EGP`}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-7"
    >
      {/* Hidden Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="sr-only"
        aria-hidden="true"
      />

      {/* ================= MAIN FORM COLUMN (RTL Right — 8 cols) ================= */}
      <div className="flex flex-col gap-6 lg:col-span-8">
        {/* Validation Banner */}
        {formErrors.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-1.5 rounded-2xl border border-[#D92D4B]/30 bg-[#FFF1F3] p-4 text-sm text-[#B4233C]"
          >
            <div className="flex items-center gap-2 font-extrabold">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? "يرجى مراجعة النقاط التالية قبل الإرسال:"
                  : "Please review the following before submitting:"}
              </span>
            </div>
            <ul className="list-disc space-y-1 ps-5 text-xs font-bold">
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ==================== GROUP 1: تفاصيل الكتاب ==================== */}
        <div className="flex flex-col gap-5">
          {items.map((item, idx) => {
            const bookNum = idx + 1;
            return (
              <section
                key={item.clientId}
                className="flex flex-col gap-5 rounded-[24px] border border-[#E7DAF5] bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-10px_rgba(99,36,197,0.12)] sm:p-6"
              >
                {/* Section Header Pill */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3EAFF]/85 px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[#43158C]">
                    <BookOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <h3 className="text-base font-extrabold sm:text-lg">
                      {items.length > 1
                        ? isAr
                          ? `تفاصيل الكتاب رقم ${bookNum}`
                          : `Book #${bookNum} Details`
                        : isAr
                          ? "تفاصيل الكتاب"
                          : "Book Details"}
                    </h3>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChildBook(item.clientId)}
                      className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 rounded-xl bg-white px-3 text-xs font-bold text-[#D92D4B] shadow-2xs hover:bg-[#FFF1F3]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isAr ? "حذف" : "Remove"}</span>
                    </button>
                  )}
                </div>

                {/* Page Count Selector (12 / 24 Pages — Live Admin Prices) */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-extrabold text-[#3B126E]">
                    {isAr ? "عدد صفحات الكتاب *" : "Number of Pages *"}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={isAr ? "عدد صفحات الكتاب" : "Book page count"}
                    className="grid grid-cols-2 gap-3"
                  >
                    {([12, 24] as const).map((pages) => {
                      const active = item.pageCount === pages;
                      const price = pages === 24 ? price24 : price12;
                      return (
                        <button
                          key={pages}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() =>
                            updateItem(item.clientId, (prev) => ({
                              ...prev,
                              pageCount: pages,
                            }))
                          }
                          className={cn(
                            "flex min-h-[58px] cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-start transition-all sm:px-4",
                            active
                              ? "border-[#6324C5] bg-[#EFE3FF] text-[#43158C] shadow-xs"
                              : "border-[#E6DCF3] bg-white text-[#241747] hover:border-[#C9B1EC]",
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold sm:text-[15px]">
                              {isAr ? `${pages} صفحة` : `${pages} Pages`}
                            </span>
                            <span className="text-xs font-bold text-[#625B75] tabular-nums">
                              {price} {isAr ? "ج.م" : "EGP"}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                              active
                                ? "border-[#6324C5] bg-[#6324C5] text-white"
                                : "border-[#CBB9E6] bg-white text-transparent",
                            )}
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cover Name + Age in Years (Single numeric input for child OR adult) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`child-name-${item.clientId}`}
                      className="text-sm font-extrabold text-[#3B126E]"
                    >
                      {isAr ? "الاسم على الغلاف *" : "Name on Cover *"}
                    </label>
                    <input
                      id={`child-name-${item.clientId}`}
                      type="text"
                      required
                      maxLength={60}
                      value={item.childName}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          childName: e.target.value,
                        }))
                      }
                      placeholder={isAr ? "مثلاً: سليم أو فريدة" : "e.g. Selim"}
                      className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-sm font-medium text-[#241747] focus:border-[#6324C5] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`child-age-${item.clientId}`}
                      className="text-sm font-extrabold text-[#3B126E]"
                    >
                      {isAr ? "العمر بالسنوات *" : "Age (in years) *"}
                    </label>
                    <input
                      id={`child-age-${item.clientId}`}
                      type="number"
                      inputMode="numeric"
                      required
                      min={1}
                      max={99}
                      value={item.childAge}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          childAge: e.target.value,
                        }))
                      }
                      placeholder={
                        isAr ? "مثلاً: 6 أو 25" : "e.g. 6 or 25"
                      }
                      className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-sm font-medium text-[#241747] focus:border-[#6324C5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Photo Upload (Simple, friendly, zero technical jargon) + Interests */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`child-photo-${item.clientId}`}
                      className="text-sm font-extrabold text-[#3B126E]"
                    >
                      {isAr
                        ? "ارفع صورة واضحة لصاحب الكتاب *"
                        : "Upload a clear photo of the book hero *"}
                    </label>

                    <div className="relative flex min-h-[126px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBB3EC] bg-[#FAF6FF] p-4 text-center transition-colors hover:border-[#6324C5]">
                      <input
                        id={`child-photo-${item.clientId}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          handlePhotoSelect(
                            item.clientId,
                            e.target.files?.[0] ?? null,
                          )
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />

                      {item.uploadState === "uploading" ? (
                        <div className="flex flex-col items-center gap-2 text-[#6324C5]">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-xs font-bold">
                            {isAr ? "جاري رفع الصورة..." : "Uploading photo..."}
                          </span>
                        </div>
                      ) : item.uploadState === "uploaded" &&
                        item.photoPreviewUrl ? (
                        <div className="relative z-10 flex w-full items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.photoPreviewUrl}
                            alt={item.childName || "معاينة الصورة"}
                            className="h-16 w-16 shrink-0 rounded-xl border border-[#E4D7F3] object-cover"
                          />
                          <div className="min-w-0 flex-1 text-start">
                            <p className="truncate text-xs font-extrabold text-[#16875D]">
                              {isAr ? "تم رفع الصورة بنجاح" : "Photo uploaded"}
                            </p>
                            <p className="truncate text-[11px] text-[#625B75]">
                              {item.photoFileName}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.clientId)}
                              className="mt-1 cursor-pointer text-[11px] font-bold text-[#D92D4B] underline"
                            >
                              {isAr ? "تغيير الصورة" : "Change photo"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pointer-events-none flex flex-col items-center gap-1.5">
                          <ImagePlus
                            className="h-7 w-7 text-[#6324C5]"
                            aria-hidden="true"
                          />
                          <span className="text-xs font-extrabold text-[#43158C]">
                            {isAr
                              ? "اضغط لاختيار صورة من جهازك"
                              : "Tap to choose a photo"}
                          </span>
                          <span className="text-[11px] font-medium text-[#625B75]">
                            JPG / PNG / WebP
                          </span>
                        </div>
                      )}
                    </div>

                    {item.uploadError && (
                      <p
                        role="alert"
                        className="text-xs font-bold text-[#D92D4B]"
                      >
                        {item.uploadError}
                      </p>
                    )}
                  </div>

                  {/* Interests & Favorite Themes */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`child-interests-${item.clientId}`}
                      className="text-sm font-extrabold text-[#3B126E]"
                    >
                      {isAr ? "الاهتمامات والهوايات" : "Interests & Hobbies"}
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {THEME_CHIPS.map((chip) => {
                        const label = isAr ? chip.ar : chip.en;
                        const active = item.selectedThemes.includes(label);
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => toggleThemeChip(item.clientId, label)}
                            className={cn(
                              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
                              active
                                ? "border-[#6324C5] bg-[#EFE3FF] text-[#43158C]"
                                : "border-[#E4D7F3] bg-white text-[#625B75] hover:border-[#C9B1EC]",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      id={`child-interests-${item.clientId}`}
                      rows={2}
                      maxLength={250}
                      value={item.customInterests}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          customInterests: e.target.value,
                        }))
                      }
                      placeholder={
                        isAr
                          ? "أضف أي هوايات أو تفاصيل تحب إضافتها..."
                          : "Any favorite hobbies or story themes..."
                      }
                      className="rounded-xl border border-[#E4D7F3] bg-white p-3 text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quantity & Optional Book Notes */}
                <div className="grid grid-cols-1 items-end gap-4 border-t border-[#EFE6FA] pt-4 sm:grid-cols-12">
                  <div className="flex flex-col gap-1.5 sm:col-span-5">
                    <span className="text-xs font-extrabold text-[#3B126E]">
                      {isAr ? "عدد النسخ من هذا الكتاب" : "Copies of this book"}
                    </span>
                    <div className="inline-flex h-11 w-fit items-center gap-3 rounded-xl border border-[#E4D7F3] bg-white px-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(item.clientId, (prev) => ({
                            ...prev,
                            quantity: Math.max(1, prev.quantity - 1),
                          }))
                        }
                        aria-label={isAr ? "تقليل العدد" : "Decrease quantity"}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#F3EAFF] text-[#43158C] hover:bg-[#E5D2FF]"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-black text-[#241747] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(item.clientId, (prev) => ({
                            ...prev,
                            quantity: Math.min(20, prev.quantity + 1),
                          }))
                        }
                        aria-label={isAr ? "زيادة العدد" : "Increase quantity"}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#F3EAFF] text-[#43158C] hover:bg-[#E5D2FF]"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-7">
                    <label
                      htmlFor={`child-notes-${item.clientId}`}
                      className="text-xs font-extrabold text-[#3B126E]"
                    >
                      {isAr
                        ? "ملاحظات خاصة بالكتاب (اختياري)"
                        : "Book Notes (Optional)"}
                    </label>
                    <input
                      id={`child-notes-${item.clientId}`}
                      type="text"
                      maxLength={200}
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder={
                        isAr
                          ? "مثلاً: إهداء خاص أو تفاصيل معينة في الرسم..."
                          : "e.g. dedication note or drawing preference..."
                      }
                      className="h-11 rounded-xl border border-[#E4D7F3] bg-white px-3.5 text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            );
          })}

          {/* IMPORTANT: "إضافة كتاب آخر" button right after book details and before delivery details */}
          {items.length < 10 && (
            <button
              type="button"
              onClick={handleAddChildBook}
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#6324C5]/50 bg-[#FFFDF7] px-5 py-3 text-sm font-extrabold text-[#6324C5] shadow-2xs transition-colors hover:border-[#6324C5] hover:bg-[#F3EAFF]"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span>
                {isAr
                  ? "إضافة كتاب آخر (للاستفادة من خصم الكميات)"
                  : "Add Another Book (Unlock Quantity Discounts)"}
              </span>
            </button>
          )}
        </div>

        {/* ==================== GROUP 2: بيانات التوصيل ==================== */}
        <section className="flex flex-col gap-5 rounded-[24px] border border-[#E7DAF5] bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-10px_rgba(99,36,197,0.12)] sm:p-6">
          <div className="flex items-center gap-2 rounded-2xl bg-[#F3EAFF]/85 px-4 py-2.5 text-[#43158C]">
            <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h3 className="text-base font-extrabold sm:text-lg">
              {isAr ? "بيانات التوصيل" : "Delivery Details"}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-name"
                className="text-sm font-extrabold text-[#3B126E]"
              >
                {isAr ? "الاسم الكامل للمستلم *" : "Recipient Full Name *"}
              </label>
              <input
                id="guardian-name"
                type="text"
                required
                maxLength={80}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={isAr ? "مثلاً: أحمد محمد علي" : "e.g. Ahmed Mohamed"}
                className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-phone"
                className="text-sm font-extrabold text-[#3B126E]"
              >
                {isAr ? "رقم الموبايل *" : "Mobile Number *"}
              </label>
              <input
                id="guardian-phone"
                type="tel"
                dir="ltr"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-start text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-governorate"
                className="text-sm font-extrabold text-[#3B126E]"
              >
                {isAr ? "المحافظة *" : "Governorate *"}
              </label>
              <div className="relative">
                <select
                  id="guardian-governorate"
                  required
                  value={governorateCode}
                  onChange={(e) => setGovernorateCode(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-[#E4D7F3] bg-white px-4 pe-9 text-sm font-bold text-[#241747] focus:border-[#6324C5] focus:outline-none"
                >
                  <option value="">
                    {isAr ? "اختر المحافظة" : "Select Governorate"}
                  </option>
                  {activeGovernorates.map((gov) => {
                    const feeEgp =
                      gov.fee_piastres !== null
                        ? Math.round(gov.fee_piastres / 100)
                        : null;
                    const suffix =
                      feeEgp === null
                        ? ""
                        : feeEgp === 0
                          ? isAr
                            ? " — شحن مجاني"
                            : " — Free"
                          : ` — ${feeEgp} ${isAr ? "ج.م" : "EGP"}`;
                    return (
                      <option key={gov.code} value={gov.code}>
                        {(isAr ? gov.name_ar : gov.name_en) + suffix}
                      </option>
                    );
                  })}
                </select>
                <MapPin
                  className="pointer-events-none absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-[#6324C5]"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-whatsapp"
                className="text-sm font-extrabold text-[#3B126E]"
              >
                {isAr
                  ? "رقم واتساب إضافي (اختياري)"
                  : "Separate WhatsApp (Optional)"}
              </label>
              <input
                id="guardian-whatsapp"
                type="tel"
                dir="ltr"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-start text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guardian-address"
              className="text-sm font-extrabold text-[#3B126E]"
            >
              {isAr ? "العنوان بالتفصيل *" : "Detailed Address *"}
            </label>
            <input
              id="guardian-address"
              type="text"
              required
              maxLength={250}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                isAr
                  ? "مثلاً: شارع النصر، المعادي، القاهرة — عمارة 12 الدور 4"
                  : "Street, district, building & apartment number"
              }
              className="h-12 rounded-xl border border-[#E4D7F3] bg-white px-4 text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guardian-notes"
              className="text-xs font-extrabold text-[#3B126E]"
            >
              {isAr ? "ملاحظات عامة للتوصيل (اختياري)" : "Delivery Notes (Optional)"}
            </label>
            <input
              id="guardian-notes"
              type="text"
              maxLength={250}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder={
                isAr
                  ? "مثلاً: موعد التواصل المفضل أو علامة مميزة قريبة..."
                  : "Preferred contact time or nearby landmark..."
              }
              className="h-11 rounded-xl border border-[#E4D7F3] bg-white px-4 text-sm text-[#241747] focus:border-[#6324C5] focus:outline-none"
            />
          </div>
        </section>

        {/* Mobile Order Summary (shown right before "مراجعة وإرسال" on mobile) */}
        <div className="lg:hidden">{renderOrderSummaryCard()}</div>

        {/* ==================== GROUP 3: مراجعة وإرسال ==================== */}
        <section className="flex flex-col gap-5 rounded-[24px] border border-[#E7DAF5] bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-10px_rgba(99,36,197,0.12)] sm:p-6">
          <div className="flex items-center gap-2 rounded-2xl bg-[#F3EAFF]/85 px-4 py-2.5 text-[#43158C]">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h3 className="text-base font-extrabold sm:text-lg">
              {isAr ? "مراجعة وإرسال" : "Review & Submit"}
            </h3>
          </div>

          {/* Mandatory Deposit Selector (Starts unselected!) */}
          <div
            id="deposit-selector-group"
            tabIndex={-1}
            className="flex flex-col gap-3 rounded-2xl border border-[#E7DAF5] bg-white p-4 focus:outline-none focus:ring-2 focus:ring-[#6324C5]"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-extrabold text-[#3B126E]">
                {isAr ? "اختار قيمة الديبوزت *" : "Choose Deposit Amount *"}
              </span>
              <p className="text-xs font-bold text-[#625B75]">
                {isAr
                  ? "اختيار الديبوزت مطلوب لإرسال الطلب، ودفعه مطلوب قبل بدء التنفيذ."
                  : "Selecting a deposit is required to submit, and payment is required before production begins."}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label={isAr ? "اختار قيمة الديبوزت" : "Choose deposit amount"}
              className="grid grid-cols-3 gap-2.5 sm:gap-3"
            >
              {DEPOSIT_OPTIONS.map((amount) => {
                const isDisabled = amount > pricingEstimate.booksTotalEgp;
                const isSelected = effectiveDepositEgp === amount;

                return (
                  <button
                    key={amount}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isDisabled}
                    onClick={() => {
                      setDepositSelectedEgp(amount);
                      setDepositNotice(null);
                    }}
                    className={cn(
                      "flex min-h-[50px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold transition-all",
                      isSelected
                        ? "border-[#6324C5] bg-[#EFE3FF] text-[#43158C] shadow-xs"
                        : isDisabled
                          ? "cursor-not-allowed border-[#EFE9F7] bg-[#F8F6FB] text-[#B3A8C4] opacity-60"
                          : "border-[#E4D7F3] bg-[#FFFDF7] text-[#241747] hover:border-[#6324C5]/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected
                          ? "border-[#6324C5] bg-[#6324C5] text-white"
                          : "border-[#CBB9E6] bg-white text-transparent",
                      )}
                    >
                      <Check className="h-2.5 w-2.5" aria-hidden="true" />
                    </span>
                    <span className="tabular-nums">
                      {amount} {isAr ? "ج.م" : "EGP"}
                    </span>
                  </button>
                );
              })}
            </div>

            {effectiveDepositEgp !== null && remainingAfterDeposit !== null && (
              <div className="rounded-xl bg-[#FAF6FF] px-3.5 py-2 text-xs font-extrabold text-[#43158C]">
                {isAr
                  ? pricingEstimate.isFinalTotalKnown
                    ? `المبلغ المتبقي بعد دفع الديبوزت (شامل الشحن): ${remainingAfterDeposit} ج.م`
                    : pricingEstimate.shippingStatus === "pending_confirmation"
                      ? `المبلغ المتبقي بعد دفع الديبوزت: ${remainingAfterDeposit} ج.م (+ مصاريف الشحن عند التأكيد)`
                      : `المبلغ المتبقي بعد دفع الديبوزت: ${remainingAfterDeposit} ج.م (+ الشحن حسب المحافظة)`
                  : pricingEstimate.isFinalTotalKnown
                    ? `Remaining balance after deposit (incl. shipping): ${remainingAfterDeposit} EGP`
                    : `Remaining balance after deposit: ${remainingAfterDeposit} EGP (+ shipping)`}
              </div>
            )}

            {effectiveDepositNotice && (
              <p role="alert" className="text-xs font-bold text-[#D92D4B]">
                {effectiveDepositNotice}
              </p>
            )}
          </div>

          {/* Consent Checkbox */}
          <label
            htmlFor="guardian-consent"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E7DAF5] bg-white p-4"
          >
            <input
              id="guardian-consent"
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#6324C5]"
            />
            <span className="text-xs leading-relaxed font-bold text-[#241747] sm:text-sm">
              {isAr ? (
                <>
                  أؤكد صحة البيانات وأوافق على استخدام الصورة المرفوعة لتصميم
                  وطباعة الكتاب فقط وفق{" "}
                  <Link
                    href="/privacy"
                    className="text-[#6324C5] underline hover:text-[#43158C]"
                  >
                    سياسة الخصوصية
                  </Link>{" "}
                  و{" "}
                  <Link
                    href="/terms"
                    className="text-[#6324C5] underline hover:text-[#43158C]"
                  >
                    الشروط والأحكام
                  </Link>
                  .
                </>
              ) : (
                <>
                  I confirm the details and consent to using the uploaded photo
                  solely to illustrate and print the book per the{" "}
                  <Link href="/privacy" className="text-[#6324C5] underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-[#6324C5] underline">
                    Terms
                  </Link>
                  .
                </>
              )}
            </span>
          </label>

          {/* SLA Note */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#523970]">
            <Clock className="h-4 w-4 shrink-0 text-[#6324C5]" aria-hidden="true" />
            <span>
              {isAr
                ? "مدة التنفيذ والتوصيل من 5 إلى 7 أيام — يتواصل معك فريق رقيم لتأكيد التفاصيل قبل البدء."
                : "Production & delivery take 5 to 7 days — our team confirms every detail with you before starting."}
            </span>
          </div>

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#6C1EA6] to-[#4E117C] px-8 py-3.5 text-base font-extrabold text-white shadow-[0_12px_28px_-6px_rgba(88,24,136,0.48)] transition-all hover:-translate-y-0.5 hover:from-[#7722B5] hover:to-[#5A158E] disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
            <span>{isAr ? "إرسال الطلب" : "Submit Request"}</span>
          </button>
        </section>
      </div>

      {/* ================= DESKTOP SUMMARY COLUMN (RTL Left — 4 cols, Smart Conditional Sticky) ================= */}
      <aside
        className={cn(
          "hidden lg:col-span-4 lg:block",
          canStickSummary ? "lg:sticky lg:top-[116px]" : "lg:static",
        )}
      >
        {renderOrderSummaryCard(summaryCardRef)}
      </aside>
    </form>
  );
}
