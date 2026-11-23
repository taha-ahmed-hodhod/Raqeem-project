import {
  Check,
  Gift,
  MapPin,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { BookVariantRow, PromotionRow } from "@/lib/supabase/types";
import {
  RAQEEM_GIFT_AR,
  RAQEEM_GIFT_EN,
  RAQEEM_SLA_AR,
  RAQEEM_SLA_EN,
  getRaqeemWhatsAppUrl,
} from "@/lib/brand";
import { WhatsAppIcon } from "./whatsapp-icon";

interface PackagesGridProps {
  locale: Locale;
  bookVariants: BookVariantRow[];
  promotions: PromotionRow[];
}

export function PackagesGrid({
  locale,
  bookVariants,
  promotions,
}: PackagesGridProps) {
  const isAr = locale === "ar";
  const variant12 = bookVariants.find((v) => v.page_count === 12);
  const variant24 = bookVariants.find((v) => v.page_count === 24);
  const price12 = variant12?.price_egp ?? 250;
  const price24 = variant24?.price_egp ?? 350;

  const promo2 = promotions.find((p) => p.min_quantity === 2 && p.active);
  const promo3 = promotions.find((p) => p.min_quantity >= 3 && p.active);

  const corporateWhatsappUrl = getRaqeemWhatsAppUrl(
    isAr
      ? "أهلاً فريق مبيعات رقيم، أرغب في الاستفسار عن باقة المؤسسات (تبدأ من 10 كتب)."
      : "Hello Raqeem Sales Team, I would like to inquire about the Corporate Package (starting from 10 books).",
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 3 Storybook-Series Package Cards: RTL Right-to-Left (12 pages -> 24 pages -> Corporate) */}
      <div className="grid grid-cols-1 items-stretch gap-7 lg:grid-cols-3 lg:gap-6">
        {/* ================= Card 1: 12-Page Package ================= */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border-2 border-[#E2D4F4] bg-[#FFFDF7] shadow-[0_5px_0_#F2DFC5,0_9px_0_#E6CCA9,0_16px_34px_-10px_rgba(99,36,197,0.14)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
          {/* Top Illustrated Artwork */}
          <div className="relative h-[185px] w-full shrink-0 overflow-hidden bg-[#F3EAFF] sm:h-[205px] lg:h-[195px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/package-12-pages.png"
              alt={
                isAr
                  ? "طفل يتصفح كتاب التلوين المخصص 12 صفحة"
                  : "Child enjoying personalized 12-page coloring book"
              }
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          </div>

          {/* Creamy Paper Details Sheet */}
          <div className="relative -mt-4 flex flex-1 flex-col items-center rounded-t-[24px] bg-[#FFFDF7] px-6 pt-5 pb-6 text-center">
            <h3 className="text-[24px] leading-snug font-extrabold text-[#43158C]">
              {isAr ? "باقة 12 صفحة" : "12-Page Book"}
            </h3>

            {/* Price Pill */}
            <div className="mt-2.5 flex min-h-[46px] items-center justify-center rounded-full bg-[#F3EAFF] px-6 py-1.5">
              <span className="text-[28px] leading-none font-black text-[#6324C5] tabular-nums">
                {price12}
              </span>
              <span className="ms-1.5 text-sm font-extrabold text-[#43158C]">
                {isAr ? "ج.م" : "EGP"}
              </span>
            </div>

            {/* Gold Gift Ribbon */}
            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF5CC] px-4 py-2 text-[13px] font-extrabold text-[#8A5200]">
              <Gift className="h-4 w-4 shrink-0 text-[#C47B00]" aria-hidden="true" />
              <span>{isAr ? RAQEEM_GIFT_AR : RAQEEM_GIFT_EN}</span>
            </div>

            {/* Package Highlights */}
            <ul className="mt-4 flex w-full flex-1 flex-col gap-2.5 text-start text-[14px] font-bold text-[#241747]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "غلاف باسم وصورة صاحب الكتاب"
                    : "Custom cover with hero's name & portrait"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "12 مشهد تلوين على ورق 150 جرام"
                    : "12 coloring scenes on thick 150gsm paper"}
                </span>
              </li>
            </ul>

            {/* CTA */}
            <Link
              href="/order?pages=12"
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#E9DCFF] px-5 py-3 text-[15px] font-extrabold text-[#43158C] shadow-xs transition-colors hover:bg-[#DEC8FF]"
            >
              {isAr ? "اطلب باقة 12 صفحة" : "Order 12-Page Package"}
            </Link>
          </div>
        </article>

        {/* ================= Card 2: 24-Page Package (Most Popular) ================= */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border-2 border-[#6324C5] bg-[#FFFDF7] shadow-[0_5px_0_#F2DFC5,0_9px_0_#E6CCA9,0_20px_42px_-10px_rgba(99,36,197,0.26)] ring-2 ring-[#6324C5]/15 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
          {/* Golden Bookmark Ribbon ("الأكثر طلبًا") */}
          <div
            className="pointer-events-none absolute top-0 end-5 z-20 flex flex-col items-center bg-gradient-to-b from-[#FFE270] via-[#FFC928] to-[#F4B400] px-3 pt-2 pb-4 text-[#3B126E] shadow-md"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
            }}
          >
            <Star
              className="mb-0.5 h-3.5 w-3.5 fill-[#3B126E] text-[#3B126E]"
              aria-hidden="true"
            />
            <span className="text-[11px] leading-tight font-extrabold whitespace-nowrap">
              {isAr ? "الأكثر طلبًا" : "Most Popular"}
            </span>
          </div>

          {/* Top Illustrated Artwork */}
          <div className="relative h-[185px] w-full shrink-0 overflow-hidden bg-[#2D1458] sm:h-[205px] lg:h-[195px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/package-24-pages.png"
              alt={
                isAr
                  ? "طفل رائد فضاء يلوّن كتاب 24 صفحة على سطح القمر"
                  : "Astronaut child coloring 24-page book on the moon"
              }
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          </div>

          {/* Creamy Paper Details Sheet */}
          <div className="relative -mt-4 flex flex-1 flex-col items-center rounded-t-[24px] bg-[#FFFDF7] px-6 pt-5 pb-6 text-center">
            <h3 className="text-[24px] leading-snug font-extrabold text-[#43158C]">
              {isAr ? "باقة 24 صفحة" : "24-Page Book"}
            </h3>

            {/* Price Pill */}
            <div className="mt-2.5 flex min-h-[46px] items-center justify-center rounded-full bg-[#F3EAFF] px-6 py-1.5">
              <span className="text-[28px] leading-none font-black text-[#6324C5] tabular-nums">
                {price24}
              </span>
              <span className="ms-1.5 text-sm font-extrabold text-[#43158C]">
                {isAr ? "ج.م" : "EGP"}
              </span>
            </div>

            {/* Gold Gift Ribbon */}
            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF5CC] px-4 py-2 text-[13px] font-extrabold text-[#8A5200]">
              <Gift className="h-4 w-4 shrink-0 text-[#C47B00]" aria-hidden="true" />
              <span>{isAr ? RAQEEM_GIFT_AR : RAQEEM_GIFT_EN}</span>
            </div>

            {/* Package Highlights */}
            <ul className="mt-4 flex w-full flex-1 flex-col gap-2.5 text-start text-[14px] font-bold text-[#241747]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "24 مشهد تلوين في قصة مترابطة"
                    : "24 coloring scenes in one connected story"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "ورق 150 جرام وتجليد سلك متين"
                    : "150gsm thick paper & durable spiral binding"}
                </span>
              </li>
            </ul>

            {/* Primary Filled CTA */}
            <Link
              href="/order?pages=24"
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#6324C5] px-5 py-3 text-[15px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(99,36,197,0.48)] transition-colors hover:bg-[#541CA9]"
            >
              {isAr ? "اطلب باقة 24 صفحة" : "Order 24-Page Package"}
            </Link>
          </div>
        </article>

        {/* ================= Card 3: Corporate Package (باقة المؤسسات) ================= */}
        <article className="group relative flex flex-col overflow-hidden rounded-[28px] border-2 border-[#E2D4F4] bg-[#FFFDF7] shadow-[0_5px_0_#F2DFC5,0_9px_0_#E6CCA9,0_16px_34px_-10px_rgba(99,36,197,0.14)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
          {/* Top Illustrated Artwork */}
          <div className="relative h-[185px] w-full shrink-0 overflow-hidden bg-[#F3EAFF] sm:h-[205px] lg:h-[195px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/package-corporate.png"
              alt={
                isAr
                  ? "مجموعة أطفال يلوّنون كتبهم المخصصة معًا"
                  : "Group of children coloring their custom books together"
              }
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          </div>

          {/* Creamy Paper Details Sheet */}
          <div className="relative -mt-4 flex flex-1 flex-col items-center rounded-t-[24px] bg-[#FFFDF7] px-6 pt-5 pb-6 text-center">
            <h3 className="text-[24px] leading-snug font-extrabold text-[#43158C]">
              {isAr ? "باقة المؤسسات" : "Corporate Package"}
            </h3>

            {/* Starting Quantity Pill (same height as price pills) */}
            <div className="mt-2.5 flex min-h-[46px] items-center justify-center rounded-full bg-[#F3EAFF] px-6 py-1.5">
              <span className="text-[20px] leading-none font-black text-[#6324C5]">
                {isAr ? "تبدأ من 10 كتب" : "Starts from 10 books"}
              </span>
            </div>

            {/* Gold Special Bulk Discount Ribbon */}
            <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF5CC] px-4 py-2 text-[13px] font-extrabold text-[#8A5200]">
              <Gift className="h-4 w-4 shrink-0 text-[#C47B00]" aria-hidden="true" />
              <span>{isAr ? "خصم خاص للكميات" : "Special bulk discount"}</span>
            </div>

            {/* Corporate Highlights */}
            <ul className="mt-4 flex w-full flex-1 flex-col gap-2.5 text-start text-[14px] font-bold text-[#241747]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "كتاب مخصّص لكل مشارك"
                    : "A personalized book for each participant"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "تنسيق مباشر مع فريق المبيعات"
                    : "Direct coordination with our sales team"}
                </span>
              </li>
            </ul>

            {/* Sales WhatsApp CTA */}
            <a
              href={corporateWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#E9DCFF] px-5 py-3 text-[15px] font-extrabold text-[#43158C] shadow-xs transition-colors hover:bg-[#DEC8FF]"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#16875D]" />
              <span>
                {isAr ? "تواصل مع فريق المبيعات" : "Contact Sales Team"}
              </span>
            </a>
          </div>
        </article>
      </div>

      {/* Unified Shared Details Bar Beneath the 3 Books */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 rounded-[24px] border border-[#E8E1F2] bg-[#FFFDF8] px-5 py-4 shadow-[0_8px_24px_-10px_rgba(99,36,197,0.12)]">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] font-extrabold text-[#241747] sm:gap-4">
          {promo2 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EAFF] px-3.5 py-1.5 text-[#541CA9]">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6324C5]" aria-hidden="true" />
              <span>
                {isAr
                  ? `كتابان: خصم ${promo2.percent}%`
                  : `2 Books: ${promo2.percent}% off`}
              </span>
            </span>
          )}

          {promo3 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F6] px-3.5 py-1.5 text-[#b02360]">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F65C96]" aria-hidden="true" />
              <span>
                {isAr
                  ? `3 كتب فأكثر: خصم ${promo3.percent}%`
                  : `3+ Books: ${promo3.percent}% off`}
              </span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 text-[#241747]">
            <Truck className="h-4 w-4 shrink-0 text-[#6324C5]" aria-hidden="true" />
            <span>{isAr ? RAQEEM_SLA_AR : RAQEEM_SLA_EN}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-[#241747]">
            <Wallet className="h-4 w-4 shrink-0 text-[#6324C5]" aria-hidden="true" />
            <span>
              {isAr ? "ديبوزت قبل بدء التنفيذ" : "Deposit before production"}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-[#241747]">
            <MapPin className="h-4 w-4 shrink-0 text-[#6324C5]" aria-hidden="true" />
            <span>
              {isAr ? "الشحن حسب المحافظة" : "Shipping varies by governorate"}
            </span>
          </span>
        </div>

        <p className="text-center text-[12px] leading-relaxed font-semibold text-[#625B75]">
          {isAr
            ? "الخصم يُطبّق على قيمة الكتب فقط (الشحن غير مشمول بالخصم)، وعلبة الألوان 12 لون هدية واحدة مع كل أوردر."
            : "Quantity discounts apply to book subtotal only (shipping is never discounted), and 1 box of 12 colors is gifted per order."}
        </p>
      </div>
    </div>
  );
}
