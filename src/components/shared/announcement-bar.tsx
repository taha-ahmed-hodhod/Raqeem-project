import { useLocale } from "next-intl";
import { Gift, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";

export function AnnouncementBar() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  return (
    <div className="flex items-center justify-center gap-2 bg-[#6324c5] px-4 py-1 text-center text-[14px] leading-[1.6] font-medium text-white">
      <Gift className="h-4 w-4 shrink-0 text-[#f4bf1b]" aria-hidden="true" />
      <span>
        {isAr
          ? "كتاب تلوين مخصوص لطفلك ببطولته الحقيقية"
          : "A personalized coloring book starring your child"}
      </span>
      <span className="opacity-40" aria-hidden="true">
        |
      </span>
      <Truck className="h-4 w-4 shrink-0 text-[#f4bf1b]" aria-hidden="true" />
      <span>
        {isAr
          ? "توصيل سريع لكافة محافظات مصر"
          : "Fast delivery across all Egyptian governorates"}
      </span>
    </div>
  );
}
