import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Banknote,
  CloudUpload,
  Headphones,
  Lock,
  MessageCircle,
  PackageCheck,
  Palette,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import { OrderRequestForm } from "@/features/orders/order-request-form";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pages?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  setRequestLocale(locale);
  const isAr = (locale as Locale) === "ar";

  const [tOrder, tHome, cmsData] = await Promise.all([
    getTranslations("pages.order"),
    getTranslations("home"),
    getPublicCatalogAndCmsData(),
  ]);

  const initialPageCount = resolvedSearch.pages === "24" ? 24 : 12;

  const howSteps = [
    {
      num: "1",
      key: "step1",
      TopIcon: CloudUpload,
      badgeBg: "bg-[#F3EAFF] text-[#6324c5]",
      titleAr: "ارسل بياناتك وصورة الكتاب",
      descAr:
        "سجل الاسم والعمر والاهتمامات، وارفق الصورة الواضحة عبر النموذج مع خصوصية تامة.",
      TagIcon: Lock,
      tagAr: "الصور مشفرة وفي تخزين خاص",
      tagColor: "text-[#16875D]",
    },
    {
      num: "2",
      key: "step2",
      TopIcon: MessageCircle,
      badgeBg: "bg-[#FFF9DE] text-[#B76B00]",
      titleAr: "تواصل مباشر وتأكيد",
      descAr:
        "يتواصل معك فريق رقيم لمراجعة تفاصيل القصة وتأكيد الديبوزت وعنوان ومصاريف الشحن لمحافظتك.",
      TagIcon: Headphones,
      tagAr: "متابعة شخصية ودودة",
      tagColor: "text-[#625B75]",
    },
    {
      num: "3",
      key: "step3",
      TopIcon: Palette,
      badgeBg: "bg-[#FFF0F6] text-[#b02360]",
      titleAr: "الرسم والتنفيذ والطباعة",
      descAr:
        "فنان رقيم يرسم الملامح كشخصية كرتونية مبهجة، ثم يُطبع الكتاب ويُغلّف بالسلك المعدني الأنيق.",
      TagIcon: Sparkles,
      tagAr: "مراجعة الغلاف قبل الطباعة",
      tagColor: "text-[#6324c5]",
    },
    {
      num: "4",
      key: "step4",
      TopIcon: PackageCheck,
      badgeBg: "bg-[#F2EEFA] text-[#6324c5]",
      titleAr: "استلام عند باب البيت",
      descAr:
        "يصلك طرد الهدية الأنيق مع علبة الألوان الهدية خلال 5 إلى 7 أيام حتى باب منزلك.",
      TagIcon: Banknote,
      tagAr: "مدة التنفيذ والتوصيل 5 إلى 7 أيام",
      tagColor: "text-[#16875D]",
    },
  ] as const;

  return (
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-6 lg:px-10 lg:py-14">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-2.5 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold text-primary-600">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isAr ? "اطلب كتابك الآن" : tOrder("title")}</span>
          </div>
          <h1 className="text-[30px] leading-tight font-extrabold text-foreground lg:text-[42px]">
            {isAr ? "اطلب كتابك الآن" : tOrder("title")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {tOrder("subtitle")}
          </p>
        </header>

        <OrderRequestForm
          initialPageCount={initialPageCount}
          bookVariants={cmsData.bookVariants}
          promotions={cmsData.promotions}
          governorates={cmsData.governorates}
        />

        {/* 4 Easy Steps Section (Moved from Homepage to right after Order Form) */}
        <ScrollReveal>
          <section
            id="how-it-works-section"
            className="flex flex-col gap-10 pt-4"
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5 text-center">
              <span className="rounded-full bg-[#ffd9e2]/50 px-3 py-1 text-[14px] font-bold text-[#660032]">
                {isAr ? "بكل بساطة ودون تعقيد" : tHome("howItWorks.badge")}
              </span>
              <h2 className="text-[26px] leading-[1.4] font-extrabold text-[#241747] lg:text-[34px] lg:leading-[1.35]">
                {tHome("howItWorks.title")}
              </h2>
              <p className="text-[16px] leading-[1.8] text-[#625B75]">
                {isAr
                  ? "نراجع كل خطوة معك شخصياً عبر واتساب لتضمن أفضل نتيجة تسعد قلبك."
                  : tHome("howItWorks.subtitle")}
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {howSteps.map((step) => {
                const TopIcon = step.TopIcon;
                const TagIcon = step.TagIcon;
                return (
                  <div
                    key={step.key}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[#E8E1F2] bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-[24px] font-bold ${step.badgeBg}`}
                      >
                        {step.num}
                      </div>
                      <TopIcon
                        className="h-6 w-6 text-[#625B75]"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[21px] leading-[1.4] font-bold text-[#241747]">
                        {isAr
                          ? step.titleAr
                          : tHome(`howItWorks.steps.${step.key}.title`)}
                      </h3>
                      <p className="text-[14px] leading-relaxed font-medium text-[#625B75]">
                        {isAr
                          ? step.descAr
                          : tHome(`howItWorks.steps.${step.key}.description`)}
                      </p>
                    </div>
                    <div
                      className={`mt-auto flex items-center gap-1.5 pt-2 text-[12px] font-medium ${step.tagColor}`}
                    >
                      <TagIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? step.tagAr
                          : tHome(`howItWorks.steps.${step.key}.tag`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollReveal>
      </div>
      );
}
