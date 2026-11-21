import { useLocale } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";

export function AnnouncementBar() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  return (
    <div className="flex items-center justify-center gap-2 bg-[#6324c5] px-4 py-1 text-center text-[14px] leading-[1.6] font-medium text-white">
      <span
        className="material-symbols-outlined text-[18px] text-[#f4bf1b]"
        aria-hidden="true"
      >
        featured_seasonal_and_gifts
      </span>
      <span>
        {isAr
          ? "كتاب تلوين مخصوص لطفلك ببطولته الحقيقية"
          : "A personalized coloring book starring your child"}
      </span>
      <span className="opacity-40" aria-hidden="true">
        |
      </span>
      <span
        className="material-symbols-outlined text-[18px] text-[#f4bf1b]"
        aria-hidden="true"
      >
        local_shipping
      </span>
      <span>
        {isAr
          ? "توصيل سريع لكافة محافظات مصر"
          : "Fast delivery across all Egyptian governorates"}
      </span>
    </div>
  );
}
