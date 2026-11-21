import Image from "next/image";
import { useLocale } from "next-intl";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import {
  RAQEEM_WHATSAPP_BASE_URL,
  RAQEEM_WHATSAPP_LOCAL,
} from "@/lib/brand";
import { WhatsAppIcon } from "./whatsapp-icon";

export function SiteFooter() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  return (
    <footer className="w-full border-t border-[#E8E1F2] bg-white pt-16 pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand (5 cols) */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo-raqeem.png"
                alt="شعار رقيم"
                width={148}
                height={44}
                className="h-10 w-auto object-contain md:h-12"
              />
            </div>
            <p className="max-w-md text-[16px] leading-[1.8] text-[#625B75]">
              {isAr
                ? "نحول صورة طفلك الحقيقية وقصصه اليومية المفضلة إلى مغامرة كرتونية مرسومة باليد للتلوين. نصنع له ذكريات دافئة بطلها الحقيقي هو طفلك في كل صفحة."
                : "We turn your child's real photo and favorite everyday stories into a hand-crafted cartoon coloring adventure—creating warm memories starring your child on every page."}
            </p>
            <div className="flex items-center gap-2 text-[14px] font-medium text-[#16875D]">
              <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? "ضمان رضا 100% | مراجعة قبل الطباعة النهائية"
                  : "100% Satisfaction Guarantee | Reviewed Before Final Printing"}
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="flex flex-col gap-3 lg:col-span-3">
            <h3 className="text-[21px] leading-[1.4] font-bold text-[#241747]">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/about"
                  className="text-[14px] font-medium text-[#625B75] transition-colors hover:text-[#1e182e]"
                >
                  {isAr ? "عن منصة رقيم" : "About Raqeem"}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[14px] font-medium text-[#625B75] transition-colors hover:text-[#1e182e]"
                >
                  {isAr ? "خطوات تجهيز كتابك" : "How We Prepare Your Book"}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[14px] font-medium text-[#625B75] transition-colors hover:text-[#1e182e]"
                >
                  {isAr ? "باقات الصفحات والأسعار" : "Packages & Pricing"}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-[14px] font-medium text-[#625B75] transition-colors hover:text-[#1e182e]"
                >
                  {isAr ? "الأسئلة الشائعة والأمان" : "FAQ & Photo Safety"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help & Orders (4 cols) */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <h3 className="text-[21px] leading-[1.4] font-bold text-[#241747]">
              {isAr ? "المساعدة والطلبات" : "Help & Requests"}
            </h3>
            <p className="text-[14px] leading-[1.6] font-medium text-[#625B75]">
              {isAr
                ? "فريق العمل جاهز لمساعدتك عبر واتساب ومراجعة تفاصيل طفلك خطوة بخطوة."
                : "Our team is ready to assist you via WhatsApp and review your child's book details step by step."}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={RAQEEM_WHATSAPP_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  isAr
                    ? `محادثة واتساب مباشرة مع رقيم ${RAQEEM_WHATSAPP_LOCAL}`
                    : `Direct WhatsApp Chat with Raqeem ${RAQEEM_WHATSAPP_LOCAL}`
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-[14px] font-medium text-[#241747] shadow-[0_2px_6px_-1px_rgba(36,23,71,0.04)] transition-colors hover:bg-[#ede4ff]"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#16875D]" />
                <span>
                  {isAr
                    ? `واتساب مباشر (${RAQEEM_WHATSAPP_LOCAL})`
                    : `Direct WhatsApp (${RAQEEM_WHATSAPP_LOCAL})`}
                </span>
              </a>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#F2EEFA] p-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-[#6324c5]"
                aria-hidden="true"
              />
              <p className="text-[12px] leading-[1.5] font-medium text-[#625B75]">
                {isAr
                  ? "الدفع والتأكيد مع فريق العمل، بدون أي دفع إلكتروني إجباري أثناء الطلب. خصوصية صور أطفالكم مشفرة ومحمية بالكامل."
                  : "Confirmation and payment are arranged with our team—no mandatory online payment during request submission. Children's photos are encrypted and protected."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[12px] font-medium text-[#625B75] sm:flex-row">
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="transition-colors hover:text-[#1e182e]"
            >
              {isAr ? "سياسة الخصوصية وحماية الصور" : "Privacy & Photo Policy"}
            </Link>
            <span className="opacity-40">•</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-[#1e182e]"
            >
              {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
            </Link>
          </div>
          <p>
            {isAr
              ? "رَقِيم (Raqeem) — لأبطالنا الصغار في مصر والعالم العربي."
              : "Raqeem — For our little heroes in Egypt and the Arab world."}
          </p>
        </div>
      </div>
    </footer>
  );
}
