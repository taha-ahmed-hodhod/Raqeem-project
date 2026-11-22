import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Pencil, Sparkles } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getPublishedPortfolioItems } from "@/features/portfolio/portfolio-data";
import { PortfolioWorksGrid } from "@/components/shared/portfolio-works-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = (locale as Locale) === "ar";
  return {
    title: isAr ? "أعمالنا | رقيم" : "Our Works | Raqeem",
    description: isAr
      ? "تصفّح جميع كتب التلوين المخصصة التي صمّمها فريق رقيم لأبطالنا الصغار والكبار."
      : "Browse all personalized coloring books crafted by the Raqeem team.",
  };
}

export default async function WorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = (locale as Locale) === "ar";

  const items = await getPublishedPortfolioItems();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-6 lg:px-10 lg:py-16">
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EAFF] px-4 py-1.5 text-xs font-extrabold text-[#6324C5]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isAr ? "أعمالنا" : "Our Works"}</span>
        </span>
        <h1 className="text-[32px] leading-[1.3] font-extrabold text-[#43158C] sm:text-[40px] lg:text-[44px]">
          {isAr ? "أبطال من عالم رقيم" : "Heroes from Raqeem's World"}
        </h1>
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-2"
        >
          <span className="h-1.5 w-36 rounded-full bg-gradient-to-r from-[#FFC928]/40 via-[#FFC928] to-[#F59E0B] sm:w-44" />
          <Pencil className="h-5 w-5 -rotate-12 text-[#F59E0B]" />
        </div>
        <p className="mt-1 text-[16px] leading-[1.8] text-[#625B75]">
          {isAr
            ? "كل كتاب هنا يحكي قصة حقيقية مصممة خصيصًا لتشبه صاحبها وتجسّد اهتماماته. اضغط على أي كتاب لقراءة قصته الكاملة."
            : "Every book here tells a custom story crafted around its hero's real likeness and passions. Click any book to read its full story."}
        </p>
      </header>

      <PortfolioWorksGrid items={items} />

      <div className="mt-4 flex flex-col items-center gap-3 rounded-[28px] border border-[#E8E1F2] bg-white p-8 text-center shadow-xs">
        <h2 className="text-xl font-extrabold text-[#241747] sm:text-2xl">
          {isAr ? "جاهز تجعل طفلك البطل القادم؟" : "Ready to make your child the next hero?"}
        </h2>
        <p className="max-w-lg text-sm text-[#625B75]">
          {isAr
            ? "أرسل تفاصيل القصة وصورة واضحة، وسيتواصل معك فريق رقيم لتنفيذ كتاب تلوين مخصوص يُطبع ويصلك خلال 5 إلى 7 أيام."
            : "Share the story details and a clear photo, and our team will craft and deliver your printed book in 5 to 7 days."}
        </p>
        <Link
          href="/order"
          className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#6324C5] px-8 py-3 text-base font-extrabold text-white shadow-md transition-colors hover:bg-[#541CA9]"
        >
          {isAr ? "اطلب كتابك الآن" : "Order Your Book Now"}
        </Link>
      </div>
    </div>
  );
}
