import { Check, Gift } from "lucide-react";
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
      ? "أهلاً فريق مبيعات رقيم، أرغب في الاستفسار عن باقة المؤسسات (بحد أدنى 10 كتب)."
      : "Hello Raqeem Sales Team, I would like to inquire about the Corporate Package (min 10 books).",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        {/* Package 1: 12 Pages */}
        <article className="flex flex-col rounded-[28px] border border-[#E8E1F2] bg-white p-7 shadow-[0_8px_24px_-6px_rgba(36,23,71,0.06)] transition-transform duration-300 hover:-translate-y-1">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#F3EAFF] px-3 py-1 text-xs font-extrabold text-[#6324c5]">
                {isAr ? "بداية مثالية" : "Great Starter"}
              </span>
              <span className="text-xs font-bold text-[#625B75]">
                {isAr ? "12 صفحة تلوين" : "12 Coloring Pages"}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#241747]">
                {isAr ? "باقة 12 صفحة" : "12-Page Book"}
              </h3>
              <div className="mt-2 flex min-h-[44px] items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#6324c5]">
                  {price12}
                </span>
                <span className="text-sm font-bold text-[#625B75]">
                  {isAr ? "ج.م / للكتاب" : "EGP / book"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#FFF9DE] px-3.5 py-2.5 text-xs font-extrabold text-[#B76B00]">
              <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? RAQEEM_GIFT_AR : RAQEEM_GIFT_EN}</span>
            </div>

            <ul className="flex flex-col gap-2.5 text-sm text-[#4a4454]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "غلاف ملون مخصص باسم وصورة صاحب الكتاب"
                    : "Custom full-color cover with name & character"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "12 مشهد تلوين مرسوم على ورق سميك 150 جرام"
                    : "12 custom coloring scenes on thick 150gsm paper"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>{isAr ? RAQEEM_SLA_AR : RAQEEM_SLA_EN}</span>
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-6">
            <Link
              href="/order?pages=12"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#F3EAFF] px-5 py-3 text-sm font-extrabold text-[#6324c5] transition-colors hover:bg-[#6324c5] hover:text-white"
            >
              {isAr ? "اطلب باقة 12 صفحة" : "Order 12-Page Book"}
            </Link>
          </div>
        </article>

        {/* Package 2: 24 Pages (Most Popular — Only Highlighted Card) */}
        <article className="relative flex flex-col rounded-[28px] border-2 border-[#6324c5] bg-white p-7 shadow-[0_18px_40px_-10px_rgba(99,36,197,0.18)] transition-transform duration-300 hover:-translate-y-1">
          <span className="absolute -top-3.5 start-6 rounded-full bg-[#b02360] px-3.5 py-1 text-xs font-extrabold text-white shadow-sm">
            {isAr ? "الأكثر طلباً ⭐" : "Most Popular ⭐"}
          </span>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#6324c5]/10 px-3 py-1 text-xs font-extrabold text-[#6324c5]">
                {isAr ? "قيمة مضاعفة" : "Double Adventure"}
              </span>
              <span className="text-xs font-bold text-[#625B75]">
                {isAr ? "24 صفحة تلوين" : "24 Coloring Pages"}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#241747]">
                {isAr ? "باقة 24 صفحة" : "24-Page Book"}
              </h3>
              <div className="mt-2 flex min-h-[44px] items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#6324c5]">
                  {price24}
                </span>
                <span className="text-sm font-bold text-[#625B75]">
                  {isAr ? "ج.م / للكتاب" : "EGP / book"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#FFF9DE] px-3.5 py-2.5 text-xs font-extrabold text-[#B76B00]">
              <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? RAQEEM_GIFT_AR : RAQEEM_GIFT_EN}</span>
            </div>

            <ul className="flex flex-col gap-2.5 text-sm text-[#4a4454]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "ضعف عدد الصفحات (24 مشهد قصة مترابطة)"
                    : "Double the scenes (24 rich story coloring pages)"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "ورق رسم فاخر 150 جرام وتجليد سلك متين"
                    : "Thick 150gsm art paper & durable spiral binding"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>{isAr ? RAQEEM_SLA_AR : RAQEEM_SLA_EN}</span>
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-6">
            <Link
              href="/order?pages=24"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#6324c5] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#541CA9]"
            >
              {isAr ? "اطلب باقة 24 صفحة" : "Order 24-Page Book"}
            </Link>
          </div>
        </article>

        {/* Package 3: Corporate / Institutional Package (Matching 12-Page Light Card Style) */}
        <article className="flex flex-col rounded-[28px] border border-[#E8E1F2] bg-white p-7 shadow-[0_8px_24px_-6px_rgba(36,23,71,0.06)] transition-transform duration-300 hover:-translate-y-1">
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#F3EAFF] px-3 py-1 text-xs font-extrabold text-[#6324c5]">
                {isAr ? "للمؤسسات" : "Organizations"}
              </span>
              <span className="text-xs font-bold text-[#625B75]">
                {isAr ? "مدارس وحضانات وشركات" : "Schools, Nurseries & Companies"}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-[#241747]">
                {isAr ? "باقة المؤسسات" : "Corporate Package"}
              </h3>
              <div className="mt-2 flex min-h-[44px] items-baseline gap-1.5">
                <span className="text-sm font-bold text-[#625B75]">
                  {isAr ? "تبدأ من" : "Starts from"}
                </span>
                <span className="text-4xl font-black text-[#6324c5]">10</span>
                <span className="text-sm font-bold text-[#625B75]">
                  {isAr ? "كتب" : "books"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#FFF9DE] px-3.5 py-2.5 text-xs font-extrabold text-[#B76B00]">
              <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? "خصم خاص للكميات" : "Special Volume Discount"}
              </span>
            </div>

            <ul className="flex flex-col gap-2.5 text-sm text-[#4a4454]">
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "كتاب مخصّص لكل مشارك باسمه وشخصيته"
                    : "Custom book for each participant with their name & character"}
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
              <li className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#16875D]"
                  aria-hidden="true"
                />
                <span>
                  {isAr
                    ? "التنفيذ والتوصيل من 5 إلى 7 أيام"
                    : RAQEEM_SLA_EN}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-6">
            <a
              href={corporateWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#F3EAFF] px-5 py-3 text-sm font-extrabold text-[#6324c5] transition-colors hover:bg-[#6324c5] hover:text-white"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              <span>
                {isAr ? "تواصل مع فريق المبيعات" : "Contact Sales Team"}
              </span>
            </a>
          </div>
        </article>
      </div>

      {/* Quantity Discounts Strip for Individual Orders */}
      {(promo2 || promo3) && (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#E8E1F2] bg-white px-5 py-4 text-xs font-bold text-[#241747] shadow-2xs">
          {promo2 && (
            <span className="rounded-full bg-[#F3EAFF] px-3.5 py-1.5 text-[#6324c5]">
              {isAr
                ? `🎉 طلب كتابين: خصم ${promo2.percent}% على الكتب`
                : `🎉 2 Books: ${promo2.percent}% off books`}
            </span>
          )}
          {promo3 && (
            <span className="rounded-full bg-[#FFF0F6] px-3.5 py-1.5 text-[#b02360]">
              {isAr
                ? `🔥 3 كتب أو أكثر: خصم ${promo3.percent}% على الكتب`
                : `🔥 3+ Books: ${promo3.percent}% off books`}
            </span>
          )}
          <span className="text-[#625B75]">
            {isAr
              ? "• هدية علبة الألوان (12 لون) تُضاف مرة واحدة مع كل أوردر • الشحن يُحدد حسب المحافظة"
              : "• One 12-color pencil box gift included per order • Shipping varies by governorate"}
          </span>
        </div>
      )}
    </div>
  );
}
