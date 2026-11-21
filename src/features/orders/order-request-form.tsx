"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
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
import { Button } from "@/components/ui/button";
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

const THEME_CHIPS: Array<{ id: string; ar: string; en: string }> = [
  { id: "space", ar: "الفضاء والكواكب 🚀", en: "Space & Planets 🚀" },
  { id: "animals", ar: "الحيوانات والغابة 🦁", en: "Animals & Jungle 🦁" },
  { id: "princess", ar: "الأميرات والفراشات 🦋", en: "Butterflies & Royalty 🦋" },
  { id: "football", ar: "كرة القدم والرياضة ⚽", en: "Football & Sports ⚽" },
  { id: "dinosaurs", ar: "الديناصورات 🦕", en: "Dinosaurs 🦕" },
  { id: "sea", ar: "عالم البحار والدلافين 🐬", en: "Ocean & Dolphins 🐬" },
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
  const [nextItemCounter, setNextItemCounter] = useState<number>(2);

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
  const [depositSelectedEgp, setDepositSelectedEgp] = useState<100 | 200 | 300>(
    100,
  );
  const [consentAccepted, setConsentAccepted] = useState(false); // MUST start unchecked
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

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

  // Save non-sensitive draft text to sessionStorage on change so recoverable errors never lose work
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
          ? "حجم الصورة الأصلي كبير جداً (الحد الأقصى قبل الضغط 15 ميجابايت)."
          : "Original photo is too large (max 15 MB before compression).",
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

    // Compress & strip EXIF metadata client-side before sending to Server Action
    const processedFile = await compressImageForUpload(file, {
      maxDimension: 1280,
      quality: 0.82,
    });

    if (processedFile.size > 2 * 1024 * 1024) {
      updateItem(clientId, (item) => ({
        ...item,
        uploadState: "error",
        uploadError: isAr
          ? "حجم الصورة بعد الضغط لا يزال أكبر من 2 ميجابايت. يرجى اختيار صورة أصغر."
          : "Compressed image is still larger than 2 MB. Please pick a smaller photo.",
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
            ? "حجم الصورة أكبر من 2 ميجابايت."
            : "Image file exceeds 2 MB."
          : res.errorCode === "unsupported_mime" ||
            res.errorCode === "signature_mismatch"
            ? isAr
              ? "نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP."
              : "Unsupported file format. Please choose a valid JPG, PNG, or WebP image."
            : isAr
              ? "تعذر رفع الصورة حالياً، يرجى المحاولة مرة أخرى."
              : "Could not upload image. Please try again.";

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
            ?`يرجى إدخال اسم صاحب الكتاب في الكتاب رقم ${bookNum}.`
            : `Please enter the name for Book #${bookNum}.`,
            `child-name-${item.clientId}`,
          );
      }
      const ageNum = Number(item.childAge);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 99) {
          recordError(
            isAr
            ?`يرجى إدخال عمر صحيح في الكتاب رقم ${bookNum}.`
            : `Please enter a valid age for Book #${bookNum}.`,
            `child-age-${item.clientId}`,
          );
        }
        if (!item.photoPath) {
            recordError(
              isAr
            ?`يرجى رفع الصورة للكتاب رقم ${bookNum}.`
            : `Please upload the photo for Book #${bookNum}.`,
              `child-photo-${item.clientId}`,
            );
        }
      });

    if (customerName.trim().length < 2) {
        recordError(
          isAr
          ?"يرجى إدخال الاسم بالكامل."
          : "Please enter the full name.",
          "guardian-name",
        );
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!/^01[0125][0-9]{8}$/.test(normalizedPhone)) {
        recordError(
          isAr
            ? "يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01012345678)."
            : "Please enter a valid 11-digit Egyptian mobile number (e.g. 01012345678).",
          "guardian-phone",
        );
    }

    if (whatsappPhone.trim().length > 0) {
      const normalizedWa = normalizeEgyptianPhone(whatsappPhone);
      if (!/^01[0125][0-9]{8}$/.test(normalizedWa)) {
          recordError(
            isAr
              ? "رقم الواتساب الإضافي غير صحيح (يجب أن يكون رقم موبايل مصري صحيح)."
              : "The optional WhatsApp number must be a valid Egyptian mobile number.",
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
          isAr
            ? "يرجى اختيار المحافظة من القائمة."
            : "Please select your governorate.",
          "guardian-governorate",
        );
    }

    if (address.trim().length < 5) {
        recordError(
          isAr
            ? "يرجى إدخال عنوان التوصيل بالتفصيل (المنطقة، الشارع، رقم العقار)."
            : "Please enter the detailed delivery address.",
          "guardian-address",
        );
    }

    if (depositSelectedEgp > pricingEstimate.booksTotalEgp) {
      recordError(
        isAr
          ? "قيمة الديبوزت المختارة أكبر من إجمالي سعر الكتب. يرجى اختيار قيمة أقل."
          : "Selected deposit exceeds the books total. Please choose a lower deposit.",
        "deposit-selector-group",
      );
    }

    if (!consentAccepted) {
        recordError(
          isAr
          ?"يرجى الموافقة على إقرار معالجة الصورة وسياسة الخصوصية قبل إرسال الطلب."
          : "Please accept the photo-processing consent and privacy policy before submitting.",
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
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in el && typeof el.focus === "function") {
            el.focus({ preventScroll: true });
          }
        }
      }
      return;
    }

    setFormErrors([]);
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

          return {
            pageCount: item.pageCount,
            quantity: item.quantity,
            childName: item.childName.trim(),
            childAge: Number(item.childAge),
            ageLabel:
              Number(item.childAge) > 18
                ? "أكبر من 18 سنة"
                : `${Number(item.childAge)} سنوات`,
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
        depositSelectedEgp,
        consentAccepted: true,
        honeypot,
      });

      if (!result.ok) {
        setFormErrors([
          isAr
            ? "تعذر إرسال الطلب حالياً. يرجى مراجعة البيانات والمحاولة مرة أخرى."
            : "Could not submit your request at the moment. Please review your details and try again.",
        ]);
        setIsSubmitting(false);
        return;
      }

      try {
        sessionStorage.removeItem("raqeem_order_draft_v1");
      } catch {
        // ignore
      }

      router.push(`/order/success?ref=${encodeURIComponent(result.reference)}`);
    } catch {
      setFormErrors([
        isAr
          ? "حدث خطأ غير متوقع أثناء إرسال الطلب، تم حفظ بياناتك ويمكنك المحاولة مرة أخرى."
          : "An unexpected error occurred. Your draft is preserved; please try again.",
      ]);
      setIsSubmitting(false);
    }
  }

  const currencyLabel = isAr ? "ج.م" : "EGP";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
    >
      {/* Left / Main Form Column (8 cols on desktop) */}
      <div className="flex flex-col gap-8 lg:col-span-7">
        {/* Error Summary Alert */}
        {formErrors.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-2xl border border-error/40 bg-error/5 p-5 text-sm text-error"
          >
            <div className="flex items-center gap-2 font-extrabold">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? "يرجى استكمال أو تصحيح البيانات التالية:"
                  : "Please complete or fix the following details:"}
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 font-medium">
              {formErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Repeatable Child Book Configurations */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-2xs">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">
                  {isAr
                    ? "1. تفاصيل الكتب والأطفال"
                    : "1. Books & Children Details"}
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  {isAr
                    ? "يمكنك إضافة كتاب أو أكثر لأطفال مختلفين في نفس الطلب للاستفادة من خصم 10% (لكتابين) و20% (لـ 3 كتب فأكثر)."
                    : "Add one or more personalized books for different children in the same request to enjoy 10% off (2 books) or 20% off (3+ books)."}
                </p>
              </div>
            </div>
          </div>

          {items.map((item, idx) => {
            const bookNumber = idx + 1;
            const lineEstimate = pricingEstimate.lineItems[idx];

            return (
              <div
                key={item.clientId}
                data-testid={`book-item-card-${idx}`}
                className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 shadow-2xs md:p-7"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1 text-sm font-extrabold text-primary-600">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isAr
                          ? `الكتاب المخصص #${bookNumber}`
                          : `Personalized Book #${bookNumber}`}
                      </span>
                    </span>
                    {lineEstimate && (
                      <span className="text-sm font-bold text-muted-foreground">
                        ({lineEstimate.lineSubtotalEgp} {currencyLabel})
                      </span>
                    )}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChildBook(item.clientId)}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-error transition-colors hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isAr ? "حذف هذا الكتاب" : "Remove this book"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Page Count Selection (12 vs 24 pages) */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {isAr ? "عدد صفحات الكتاب *" : "Page Count *"}
                  </span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([12, 24] as const).map((pages) => {
                      const price =
                        pages === 24
                          ? pricingEstimate.price24Egp
                          : pricingEstimate.price12Egp;
                      const isSelected = item.pageCount === pages;

                      return (
                        <button
                          key={pages}
                          type="button"
                          onClick={() =>
                            updateItem(item.clientId, (prev) => ({
                              ...prev,
                              pageCount: pages,
                            }))
                          }
                          aria-pressed={isSelected}
                          className={cn(
                            "flex min-h-[68px] cursor-pointer items-center justify-between rounded-2xl border p-4 text-start transition-all",
                            isSelected
                              ? "border-primary-500 bg-primary-50 shadow-2xs"
                              : "border-border bg-surface-muted/60 hover:bg-primary-50/40",
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-base font-extrabold text-foreground">
                              {isAr
                                ? `نسخة ${pages} صفحة تلوين`
                                : `${pages} Coloring Pages`}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {pages === 24
                                ? isAr
                                  ? "مغامرة متكاملة ومشاهد أغنى"
                                  : "Complete adventure & richer scenes"
                                : isAr
                                  ? "هدية بداية لطيفة ومبهجة"
                                  : "Great joyful starter edition"}
                            </span>
                          </div>
                          <span className="text-lg font-extrabold text-primary-600">
                            {price} {currencyLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Child Name & Child Age */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="flex flex-col gap-1.5 sm:col-span-8">
                    <label
                      htmlFor={`child-name-${item.clientId}`}
                      className="text-sm font-bold text-foreground"
                    >
                      {isAr
                        ? "اسم الطفل (كما يُكتب على غلاف الكتاب) *"
                        : "Child's Name (as printed on the cover) *"}
                    </label>
                    <input
                      id={`child-name-${item.clientId}`}
                      type="text"
                      required
                      value={item.childName}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          childName: e.target.value,
                        }))
                      }
                      placeholder={
                        isAr ? "مثال: سليم، فريدة، آدم" : "e.g. Selim, Farida, Adam"
                      }
                      className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-base text-foreground transition-colors focus:border-primary-500 focus:bg-surface focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-4">
                    <label
                      htmlFor={`child-age-${item.clientId}`}
                      className="text-sm font-bold text-foreground"
                    >
                      {isAr ? "عمر الطفل (بالسنوات) *" : "Child's Age (Years) *"}
                    </label>
                    <input
                      id={`child-age-${item.clientId}`}
                      type="number"
                      min={1}
                      max={18}
                      required
                      value={item.childAge}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          childAge: e.target.value,
                        }))
                      }
                      placeholder={isAr ? "مثال: 5" : "e.g. 5"}
                      className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-base text-foreground transition-colors focus:border-primary-500 focus:bg-surface focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          childAge: Number(prev.childAge) > 18 ? "" : "19",
                        }))
                      }
                      aria-pressed={Number(item.childAge) > 18}
                      className={`mt-1.5 inline-flex min-h-[36px] w-fit cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold transition-colors ${Number(item.childAge) > 18
                          ? "border-[#241747] bg-[#241747] text-white"
                          : "border-border bg-white text-foreground hover:border-primary-500"
                        }`}
                    >
                      <span>
                        {isAr ? "أكبر من 18 سنة" : "Older than 18 years"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Private Child Photo Uploader */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`child-photo-${item.clientId}`}
                      className="text-sm font-bold text-foreground"
                    >
                      {isAr
                        ? "صورة واضحة لوجه الطفل *"
                        : "Clear Photo of the Child's Face *"}
                    </label>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {isAr
                          ? "تخزين خاص ومشفر (JPG, PNG, WebP بحد أقصى 2MB)"
                          : "Private & Encrypted Storage (JPG, PNG, WebP max 2MB)"}
                      </span>
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-border bg-surface-muted/50 p-4 transition-colors hover:border-primary-500/50">
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
                      className="sr-only"
                    />

                    {item.uploadState === "idle" && (
                      <label
                        htmlFor={`child-photo-${item.clientId}`}
                        className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4 text-center"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
                          <ImagePlus className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {isAr
                            ? "اضغط لاختيار صورة طفلك من الموبايل أو الكمبيوتر"
                            : "Tap to select your child's photo from your device"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isAr
                            ? "يفضل صورة أمامية واضحة الإضاءة لملامح الوجه"
                            : "A clear, well-lit front portrait works best"}
                        </span>
                      </label>
                    )}

                    {item.uploadState === "uploading" && (
                      <div className="flex items-center justify-center gap-3 py-6 text-sm font-bold text-primary-600">
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        <span>
                          {isAr
                            ? "جاري فحص وتأمين الصورة..."
                            : "Validating & securing photo..."}
                        </span>
                      </div>
                    )}

                    {item.uploadState === "uploaded" && (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.photoPreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.photoPreviewUrl}
                              alt={item.childName || "Child preview"}
                              className="h-16 w-16 rounded-xl border border-border object-cover"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                              <CheckCircle2
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>
                                {isAr
                                  ? "تم رفع وتأمين الصورة بنجاح"
                                  : "Photo uploaded & secured"}
                              </span>
                            </span>
                            {item.photoFileName && (
                              <span className="text-xs text-muted-foreground">
                                {item.photoFileName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`child-photo-${item.clientId}`}
                            className="inline-flex min-h-[38px] cursor-pointer items-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary-50"
                          >
                            {isAr ? "تغيير الصورة" : "Replace"}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(item.clientId)}
                            className="inline-flex min-h-[38px] cursor-pointer items-center rounded-xl px-3 py-1.5 text-xs font-bold text-error hover:bg-error/10"
                          >
                            {isAr ? "حذف" : "Remove"}
                          </button>
                        </div>
                      </div>
                    )}

                    {item.uploadState === "error" && (
                      <div className="flex flex-col items-center gap-2 py-3 text-center">
                        <p className="text-xs font-bold text-error">
                          {item.uploadError}
                        </p>
                        <label
                          htmlFor={`child-photo-${item.clientId}`}
                          className="inline-flex min-h-[38px] cursor-pointer items-center rounded-xl bg-primary-500 px-4 py-1.5 text-xs font-bold text-white"
                        >
                          {isAr ? "إعادة المحاولة" : "Try Again"}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interests & Theme Chips */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {isAr
                      ? "اهتمامات الطفل وعالم القصة المفضل (اختياري)"
                      : "Child's Interests & Favorite Story Theme (Optional)"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {THEME_CHIPS.map((chip) => {
                      const label = isAr ? chip.ar : chip.en;
                      const active = item.selectedThemes.includes(label);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleThemeChip(item.clientId, label)}
                          aria-pressed={active}
                          className={cn(
                            "min-h-[38px] cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                            active
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-border bg-surface-muted/60 text-foreground hover:bg-primary-50",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={item.customInterests}
                    onChange={(e) =>
                      updateItem(item.clientId, (prev) => ({
                        ...prev,
                        customInterests: e.target.value,
                      }))
                    }
                    placeholder={
                      isAr
                        ? "أو اكتب اهتمامات أخرى هنا (مثال: الطيران، الطبخ، الرسم...)"
                        : "Or type other interests here (e.g. aviation, painting...)"
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
                  />
                </div>

                {/* Identical Copies Stepper & Book Notes */}
                <div className="grid grid-cols-1 items-center gap-4 pt-1 sm:grid-cols-12">
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-muted/50 px-4 py-2.5 sm:col-span-5">
                    <span className="text-xs font-bold text-foreground">
                      {isAr
                        ? "عدد النسخ المتطابقة لهذا الطفل:"
                        : "Identical copies for this child:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={isAr ? "إنقاص النسخ" : "Decrease copies"}
                        onClick={() =>
                          updateItem(item.clientId, (prev) => ({
                            ...prev,
                            quantity: Math.max(1, prev.quantity - 1),
                          }))
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-primary-50"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span
                        data-testid={`item-qty-${idx}`}
                        className="w-6 text-center text-base font-extrabold text-primary-600"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={isAr ? "زيادة النسخ" : "Increase copies"}
                        onClick={() =>
                          updateItem(item.clientId, (prev) => ({
                            ...prev,
                            quantity: Math.min(20, prev.quantity + 1),
                          }))
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-primary-50"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(item.clientId, (prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder={
                        isAr
                          ? "ملاحظات أو إهداء خاص لهذا الكتاب (اختياري)"
                          : "Special dedication or design note for this book (optional)"
                      }
                      className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Child / Book Button */}
          <button
            type="button"
            onClick={handleAddChildBook}
            className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-500/40 bg-primary-50/50 px-5 py-3.5 text-sm font-extrabold text-primary-600 transition-colors hover:border-primary-500 hover:bg-primary-50"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>
              {isAr
                ? "إضافة كتاب لطفل آخر (واحصل على خصم 10% لكتابين أو 20% لـ 3 كتب فأكثر)"
                : "Add Another Child / Book (Get 10% off for 2 books or 20% off for 3+ books)"}
            </span>
          </button>
        </section>

        {/* Section 2: Parent / Guardian Contact & Governorate Delivery */}
        <section className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 shadow-2xs md:p-7">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                {isAr
                  ? "2. بيانات ولي الأمر والتوصيل"
                  : "2. Parent / Guardian & Delivery Details"}
              </h2>
              <p className="text-xs font-medium text-muted-foreground">
                {isAr
                  ? "سيتواصل معك فريق رقيم عبر هذه البيانات لتأكيد التفاصيل والشحن."
                  : "The Raqeem team will contact you using these details to confirm your order and shipping."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="guardian-name"
                className="text-sm font-bold text-foreground"
              >
                {isAr ? "اسم ولي الأمر بالكامل *" : "Parent / Guardian Full Name *"}
              </label>
              <input
                id="guardian-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  isAr ? "اكتب اسمك الثلاثي أو الثنائي" : "Enter your full name"
                }
                className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-base text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-phone"
                className="text-sm font-bold text-foreground"
              >
                {isAr
                  ? "رقم الموبايل المصري (للتواصل والواتساب) *"
                  : "Egyptian Mobile Number *"}
              </label>
              <input
                id="guardian-phone"
                type="tel"
                dir="ltr"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-start text-base text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="guardian-whatsapp"
                className="text-sm font-bold text-foreground"
              >
                {isAr
                  ? "رقم واتساب إضافي (اختياري إن كان مختلفاً)"
                  : "Separate WhatsApp Number (Optional)"}
              </label>
              <input
                id="guardian-whatsapp"
                type="tel"
                dir="ltr"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="01112345678"
                className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-start text-base text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="guardian-governorate"
                className="flex items-center gap-1.5 text-sm font-bold text-foreground"
              >
                <MapPin className="h-4 w-4 text-primary-500" aria-hidden="true" />
                <span>{isAr ? "المحافظة *" : "Governorate *"}</span>
              </label>
              <select
                id="guardian-governorate"
                required
                value={governorateCode}
                onChange={(e) => setGovernorateCode(e.target.value)}
                className="h-12 w-full cursor-pointer rounded-xl border border-border bg-surface-muted/60 px-4 text-base text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              >
                <option value="">
                  {isAr
                    ? "اختر المحافظة (توصيل لجميع محافظات مصر الـ 27)"
                    : "Select your governorate (All 27 Egyptian governorates)"}
                </option>
                {activeGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.code}>
                    {isAr ? gov.name_ar : gov.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="guardian-address"
                className="text-sm font-bold text-foreground"
              >
                {isAr
                  ? "عنوان التوصيل بالتفصيل (المنطقة، الشارع، رقم العمارة والشقة) *"
                  : "Detailed Delivery Address (District, Street, Building, Apartment) *"}
              </label>
              <input
                id="guardian-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: مدينة نصر، شارع عباس العقاد، عمارة 15، الدور الرابع"
                    : "e.g. Nasr City, Abbas El Akkad St, Building 15, Apt 4"
                }
                className="h-12 w-full rounded-xl border border-border bg-surface-muted/60 px-4 text-base text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="general-notes"
                className="text-sm font-bold text-foreground"
              >
                {isAr
                  ? "ملاحظات إضافية على الطلب أو موعد التوصيل (اختياري)"
                  : "Additional Order or Delivery Notes (Optional)"}
              </label>
              <textarea
                id="general-notes"
                rows={2}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder={
                  isAr
                    ? "أي ملاحظات أخرى تود إبلاغ فريق رقيم بها"
                    : "Any extra details you would like our team to know"
                }
                className="w-full rounded-xl border border-border bg-surface-muted/60 p-3.5 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            {/* Anti-spam Honeypot (hidden from human users) */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="company-website">Website</label>
              <input
                id="company-website"
                name="company_website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Right / Sticky Live Pricing Summary & Consent Column (5 cols on desktop) */}
      <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5">
        <div
          aria-live="polite"
          className="flex flex-col gap-5 rounded-3xl border-2 border-primary-500/30 bg-surface p-6 shadow-[0_12px_32px_-4px_rgba(99,36,197,0.1)] md:p-7"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl font-extrabold text-foreground">
              {isAr ? "ملخص الطلب والتكلفة المبدئية" : "Order Summary & Estimate"}
            </h2>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-600">
              {pricingEstimate.totalBooks}{" "}
              {isAr
                ? pricingEstimate.totalBooks === 1
                  ? "كتاب"
                  : "كتب"
                : pricingEstimate.totalBooks === 1
                  ? "Book"
                  : "Books"}
            </span>
          </div>

          {/* Line items breakdown */}
          <ul className="flex flex-col gap-2.5 text-sm">
            {items.map((item, idx) => {
              const calc = pricingEstimate.lineItems[idx];
              if (!calc) return null;
              return (
                <li
                  key={item.clientId}
                  className="flex items-center justify-between gap-2 text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {isAr
                      ? `كتاب #${idx + 1} (${item.pageCount} صفحة × ${item.quantity})`
                      : `Book #${idx + 1} (${item.pageCount} pages × ${item.quantity})`}
                    {item.childName.trim() ? ` — ${item.childName.trim()}` : ""}
                  </span>
                  <span className="font-bold text-foreground">
                    {calc.lineSubtotalEgp} {currencyLabel}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">
                {isAr ? "إجمالي الكتب قبل الخصم:" : "Books Subtotal:"}
              </span>
              <span
                data-testid="summary-subtotal"
                className="font-bold text-foreground"
              >
                {pricingEstimate.booksSubtotalEgp} {currencyLabel}
              </span>
            </div>

            {pricingEstimate.appliedDiscountPercent > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-success">
                <span className="font-bold">
                  {isAr
                    ? `خصم الكميات (${pricingEstimate.appliedDiscountPercent}%):`
                    : `Quantity Discount (${pricingEstimate.appliedDiscountPercent}%):`}
                </span>
                <span data-testid="summary-discount" className="font-extrabold">
                  -{pricingEstimate.discountEgp} {currencyLabel}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                {isAr ? "إجمالي سعر الكتب:" : "Books Total:"}
              </span>
              <span
                data-testid="summary-books-total"
                className="text-lg font-extrabold text-primary-600"
              >
                {pricingEstimate.booksTotalEgp} {currencyLabel}
              </span>
            </div>

            {/* Mandatory Deposit Selector (100 / 200 / 300 EGP) */}
            <div
              id="deposit-selector-group"
              className="mt-1 flex flex-col gap-2.5 rounded-2xl border border-border bg-surface-muted/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-foreground">
                  {isAr ? "اختار قيمة الديبوزت *" : "Choose Deposit Amount *"}
                </span>
                <span
                  data-testid="selected-deposit-value"
                  className="rounded-full bg-[#241747] px-2.5 py-0.5 text-xs font-extrabold text-white"
                >
                  {depositSelectedEgp} {currencyLabel}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label={isAr ? "اختار قيمة الديبوزت" : "Choose Deposit Amount"}
                className="grid grid-cols-3 gap-2"
              >
                {([100, 200, 300] as const).map((amount) => {
                  const isSelected = depositSelectedEgp === amount;
                  const exceedsTotal = amount > pricingEstimate.booksTotalEgp;
                  return (
                    <button
                      key={amount}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={exceedsTotal}
                      onClick={() => setDepositSelectedEgp(amount)}
                      className={`min-h-[44px] cursor-pointer rounded-full border px-3 py-2 text-sm font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isSelected
                          ? "border-[#241747] bg-[#241747] text-white shadow-sm"
                          : "border-border bg-white text-[#241747] hover:border-primary-500"
                        }`}
                    >
                      {amount} {currencyLabel}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                <span className="font-semibold text-muted-foreground">
                  {isAr ? "المتبقي من سعر الكتب:" : "Remaining for books:"}
                </span>
                <span className="font-extrabold text-foreground">
                  {Math.max(0, pricingEstimate.booksTotalEgp - depositSelectedEgp)}{" "}
                  {currencyLabel}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed font-medium text-muted-foreground">
                {isAr
                  ? "دفع الديبوزت مطلوب قبل بدء التنفيذ • مدة التنفيذ والتوصيل من 5 إلى 7 أيام • علبة ألوان 12 لون هدية مع الأوردر."
                  : "Deposit payment is required before production begins • Production & delivery take 5 to 7 days • Free 12-color box with every order."}
              </p>
            </div>

            {/* Governorate Shipping Status */}
            <div className="flex items-start justify-between gap-3 border-t border-border/60 pt-3">
              <span className="font-medium text-muted-foreground">
                {isAr ? "مصاريف الشحن:" : "Shipping:"}
              </span>
              {pricingEstimate.shippingStatus === "known" &&
                pricingEstimate.shippingEgp !== null ? (
                <span
                  data-testid="summary-shipping"
                  className="font-bold text-foreground"
                >
                  {pricingEstimate.shippingEgp} {currencyLabel}
                </span>
              ) : (
                <span
                  data-testid="summary-shipping-pending"
                  className="max-w-[220px] text-end text-xs font-bold text-warning"
                >
                  {isAr
                    ? "مصاريف الشحن هتتأكد معاك بعد إرسال الطلب"
                    : "Shipping cost confirmed after contact"}
                </span>
              )}
            </div>

            {/* Final / Books-Only Total Box */}
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-accent-yellow-50 p-4">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-foreground">
                  {pricingEstimate.isFinalTotalKnown
                    ? isAr
                      ? "الإجمالي التقديري شامل الشحن:"
                      : "Estimated Total (Incl. Shipping):"
                    : isAr
                      ? "إجمالي الكتب المبدئي (قبل الشحن):"
                      : "Estimated Books Total (Excl. Shipping):"}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isAr
                    ? "يتم تأكيد السعر النهائي معك قبل التنفيذ"
                    : "Final quote confirmed with you before production"}
                </span>
              </div>
              <span
                data-testid="summary-estimated-total"
                className="text-2xl font-extrabold text-primary-600"
              >
                {pricingEstimate.estimatedTotalEgp} {currencyLabel}
              </span>
            </div>
          </div>

          {/* Explicit Unchecked Guardian Consent Checkbox */}
          <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
            <label
              htmlFor="guardian-consent"
              className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed font-medium text-foreground"
            >
              <input
                id="guardian-consent"
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary-500"
              />
              <span>
                {isAr ? (
                  <>
                    أقر بأنني ولي أمر الطفل وأوافق على معالجة صورة الطفل لغرض
                    تصميم وطباعة كتاب التلوين المطلوب فقط، وأوافق على{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-primary-600 underline"
                    >
                      سياسة الخصوصية
                    </Link>{" "}
                    (لن يتم نشر أي صورة أبداً بدون إذن مستقل). *
                  </>
                ) : (
                  <>
                    I confirm that I am the child&apos;s parent/guardian and
                    authorize processing the uploaded photo solely to prepare the
                    requested coloring book, in accordance with the{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-primary-600 underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    (photos are never published without separate consent). *
                  </>
                )}
              </span>
            </label>
          </div>

          {/* Submit CTA ("إرسال الطلب" — never Pay Now) */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="min-h-[52px] w-full text-base shadow-[0_12px_28px_-4px_rgba(99,36,197,0.28)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>
                  {isAr ? "جاري إرسال الطلب..." : "Submitting Request..."}
                </span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden="true" />
                <span>{isAr ? "إرسال الطلب" : "Submit Request"}</span>
              </>
            )}
          </Button>

          {/* Mandatory Supporting Note (GEMINI.md §6 & DESIGN.md §6.6) */}
          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <p className="font-medium">
              {isAr
                ? "إرسال الطلب مجاني، ومش معناه تأكيد الشراء. فريق رقيم هيتواصل معاك لتأكيد التفاصيل."
                : "Submitting a request is free and is not a confirmed purchase. The Raqeem team will contact you to confirm details."}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
