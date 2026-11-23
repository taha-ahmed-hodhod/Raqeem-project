import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  BadgeCheck,
  Brush,
  ClipboardList,
  FileText,
  Gift,
  Layers,
  Pencil,
  Smile,
  Truck,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getPublicCatalogAndCmsData } from "@/features/content/cms-data";
import {
  getPublishedPortfolioItems,
  selectHomePortfolioItems,
} from "@/features/portfolio/portfolio-data";
import { HeroInteractiveSection } from "@/components/shared/hero-interactive-section";
import { PortfolioBookshelfSection } from "@/components/shared/portfolio-bookshelf-section";
import { PackagesGrid } from "@/components/shared/packages-grid";
import { ReviewsCarouselSection } from "@/components/shared/reviews-carousel-section";
import { SocialFollowSection } from "@/components/shared/social-follow-section";
import { PromotionalPosterPopup } from "@/components/shared/promotional-poster-popup";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { OrderRequestForm } from "@/features/orders/order-request-form";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const isAr = typedLocale === "ar";

  const [t, cmsData, portfolioItems] = await Promise.all([
    getTranslations("home"),
    getPublicCatalogAndCmsData(),
    getPublishedPortfolioItems(),
  ]);

  const titleOverride = isAr
    ? cmsData.heroOverrides.titleAr
    : cmsData.heroOverrides.titleEn;
  const subtitleOverride = isAr
    ? cmsData.heroOverrides.subtitleAr
    : cmsData.heroOverrides.subtitleEn;

  const whyCards = [
    {
      key: "hero",
      Icon: Smile,
      iconBg: "bg-[#FFF9DE] text-[#B76B00]",
      titleAr: "طفلك هو البطل",
      descAr:
        "كل صفحة تحمل اسم طفلك وتفاصيل شكله وشخصيته في سيناريوهات شيقة تشعره بالفخر والاعتزاز بنفسه.",
    },
    {
      key: "customArt",
      Icon: Brush,
      iconBg: "bg-[#FFF0F6] text-[#b02360]",
      titleAr: "تصميم يدوي مخصص",
      descAr:
        "فنانون ومصممون محترفون يرسمون خطوط تلوين واضحة ومناسبة لعمر طفلك واهتماماته (فضاء، حيوانات، طيران، أميرات).",
    },
    {
      key: "pageOptions",
      Icon: Layers,
      iconBg: "bg-[#F3EAFF] text-[#6324c5]",
      titleAr: "12 أو 24 صفحة",
      descAr:
        "مرونة تامة في اختيار حجم الكتاب وقصته المناسبة للميزانية وسن طفلك دون أي التزامات معقدة.",
    },
    {
      key: "printQuality",
      Icon: FileText,
      iconBg: "bg-[#F2EEFA] text-[#4a00a2]",
      titleAr: "طباعة وورق ممتاز",
      descAr:
        "نطبع على ورق سميك فاخر 150 جرام مضاد لتسرب ألوان الفلوماستر والخشب، مع غلاف كوشيه مقوى وسلك أمان معدني.",
    },
    {
      key: "egyptDelivery",
      Icon: Truck,
      iconBg: "bg-[#FFF9DE] text-[#B76B00]",
      titleAr: "توصيل سريع لكل مصر",
      descAr:
        "شحن مؤمن بعناية وتغليف هدية مميز يصلك في القاهرة، الإسكندرية، والدلتا، والصعيد بكل سلاسة وأمان.",
    },
    {
      key: "familyOffers",
      Icon: Gift,
      iconBg: "bg-[#FFF0F6] text-[#b02360]",
      titleAr: "خصومات وباقات عائلية",
      descAr:
        "خصم فوري 10% عند طلب كتابين للأخوة، و20% عند طلب 3 كتب أو أكثر لتوفير هدايا استثنائية لأبناء العائلة.",
    },
  ] as const;

  return (
    <div className="flex w-full flex-col">
      {/* Promotional Poster Popup (shown once per session when enabled in Admin) */}
      <PromotionalPosterPopup poster={cmsData.posterPopup} />

      {/* 1. Hero Section (Live Admin-editable Hero Text & Image) */}
      <HeroInteractiveSection
        bookVariants={cmsData.bookVariants}
        titleOverride={titleOverride}
        subtitleOverride={subtitleOverride}
        heroImageUrl={cmsData.heroOverrides.imageUrl}
      />

      {/* 2. Why Raqeem? (لماذا كتاب رقيم؟) */}
      <section className="w-full bg-white py-16 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 lg:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EAFF] px-3 py-1 text-[14px] font-bold text-[#6324c5]">
                <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("whyRaqeem.badge")}</span>
              </div>
              <h2 className="text-[26px] leading-[1.4] font-extrabold text-[#241747] lg:text-[34px] lg:leading-[1.35]">
                {t("whyRaqeem.title")}
              </h2>
              <p className="text-[16px] leading-[1.8] text-[#625B75]">
                {isAr
                  ? "صممنا تجربة كتب رقيم لتشجيع الأطفال على الابتعاد عن شاشات الموبايل والاستمتاع بتجربة إبداعية بطلها هو طفلك نفسه."
                  : t("whyRaqeem.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {whyCards.map((card) => {
              const CardIcon = card.Icon;
              return (
                <div
                  key={card.key}
                  className="group flex flex-col gap-3 rounded-2xl bg-[#F8F5FF] p-6 shadow-sm transition-all hover:bg-[#ede4ff]/40"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${card.iconBg}`}
                  >
                    <CardIcon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[21px] leading-[1.4] font-bold text-[#241747] lg:text-[24px]">
                      {isAr
                        ? card.titleAr
                        : t(`whyRaqeem.cards.${card.key}.title`)}
                    </h3>
                    <p className="text-[16px] leading-relaxed text-[#625B75]">
                      {isAr
                        ? card.descAr
                        : t(`whyRaqeem.cards.${card.key}.description`)}
                    </p>
                  </div>
                </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* 3. Transformation Portfolio / Wooden Bookshelf ("أبطال من عالم رقيم") */}
      <section id="portfolio-section" className="w-full bg-[#F8F5FF] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <PortfolioBookshelfSection
            items={selectHomePortfolioItems(portfolioItems)}
          />
        </div>
      </section>

      {/* 4. Pricing & Special Offers (باقات كتب التلوين المخصصة) */}
      <section id="pricing-section" className="w-full bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
            <h2 className="text-[28px] leading-[1.3] font-extrabold text-[#43158C] sm:text-[36px] lg:text-[42px]">
              {isAr
                ? "باقات كتب التلوين المخصصة"
                : t("pricingSection.title")}
            </h2>
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-2"
            >
              <span className="h-1.5 w-36 rounded-full bg-gradient-to-r from-[#FFC928]/40 via-[#FFC928] to-[#F59E0B] sm:w-44" />
              <Pencil className="h-5 w-5 -rotate-12 text-[#F59E0B]" />
            </div>
          </div>

          {/* 3 Storybook-Series Packages + Unified Shared Details Bar */}
          <ScrollReveal>
            <PackagesGrid
              locale={typedLocale}
              bookVariants={cmsData.bookVariants}
              promotions={cmsData.promotions}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* 5. Customer Reviews Carousel & Submission Popup */}
      <div className="w-full bg-[#F8F5FF]">
        <ScrollReveal>
          <ReviewsCarouselSection reviews={cmsData.reviews} />
        </ScrollReveal>
      </div>

      {/* 6. Embedded Order Form Section ("اطلب كتابك الآن") */}
      <section
        id="order-form-section"
        className="w-full bg-white py-16"
      >
        <ScrollReveal className="mx-auto flex max-w-6xl flex-col gap-8 px-6 lg:px-10">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6324c5] text-white shadow-md">
              <ClipboardList className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-[26px] leading-[1.4] font-extrabold text-[#241747] lg:text-[34px] lg:leading-[1.35]">
              {isAr ? "اطلب كتابك الآن" : "Order Your Book Now"}
            </h2>
            <p className="max-w-lg text-[16px] leading-[1.8] text-[#625B75]">
              {isAr
                ? "املأ البيانات التالية لنفسك أو لمن تحب وسيتواصل معك فريق رقيم لتأكيد التفاصيل والشحن — مدة التنفيذ والتوصيل من 5 إلى 7 أيام."
                : "Fill in the details below for yourself or a loved one and the Raqeem team will confirm everything — production & delivery take 5 to 7 days."}
            </p>
          </div>

          <OrderRequestForm
            initialPageCount={12}
            bookVariants={cmsData.bookVariants}
            promotions={cmsData.promotions}
            governorates={cmsData.governorates}
          />
        </ScrollReveal>
      </section>

      {/* 7. Social Media Follow Section (Admin-Managed Links) */}
      <div className="w-full bg-[#F8F5FF]">
        <ScrollReveal>
          <SocialFollowSection
            locale={typedLocale}
            links={cmsData.socialLinks}
          />
        </ScrollReveal>
      </div>
    </div >
  );
}
