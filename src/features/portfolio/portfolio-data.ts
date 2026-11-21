import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { PortfolioEntryRow } from "@/lib/supabase/types";

export interface PortfolioShowcaseItem {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  shortSummaryAr: string;
  shortSummaryEn: string;
  storyInterestsAr: string;
  storyInterestsEn: string;
  storyIdeaAr: string;
  storyIdeaEn: string;
  storyHeroAr: string;
  storyHeroEn: string;
  childLabelAr: string;
  childLabelEn: string;
  themeAr: string;
  themeEn: string;
  descriptionAr: string;
  descriptionEn: string;
  originalPhotoUrl: string;
  cartoonImageUrl: string;
  coloringPageUrl: string;
  bookMockupUrl: string;
  isDemo: boolean;
  guardianConsentVerified: boolean;
  pageCount: 12 | 24;
}

export const DEFAULT_PORTFOLIO_ITEMS: PortfolioShowcaseItem[] = [
  {
    id: "demo-selim-space",
    slug: "selim-space-explorer",
    titleAr: "مغامرة رائد الفضاء الصغير",
    titleEn: "Little Astronaut Space Adventure",
    shortSummaryAr: "رحلة سليم لاستكشاف الكواكب والنجوم ببدلة الفضاء الخاصة به",
    shortSummaryEn: "Selim's journey exploring planets and stars in his own spacesuit",
    storyInterestsAr:
      "يعشق سليم الصواريخ والكواكب وأفلام الفضاء، ويحلم دائمًا بالسفر إلى القمر واكتشاف مجرات جديدة.",
    storyInterestsEn:
      "Selim loves rockets, planets, and space exploration, dreaming of flying to the moon and discovering new galaxies.",
    storyIdeaAr:
      "صممنا له قصة تلوين متكاملة تبدأ بإطلاق صاروخ يحمل اسمه، ويمر فيها بكواكب مرحة ومخلوقات فضائية لطيفة تتطلب التلوين.",
    storyIdeaEn:
      "We crafted a custom coloring story starting with a rocket bearing his name, visiting friendly planets and playful space scenes.",
    storyHeroAr:
      "حوّلنا ملامح سليم الحقيقية إلى شخصية رائد فضاء كرتونية مبهجة تظهر على الغلاف وفي كل صفحة تلوين كبطل المغامرة.",
    storyHeroEn:
      "We transformed Selim's likeness into a cheerful cartoon astronaut starring on the cover and every single coloring page.",
    childLabelAr: "سليم",
    childLabelEn: "Selim",
    themeAr: "مغامرات الفضاء",
    themeEn: "Space Adventures",
    descriptionAr:
    "رحلة سليم لاستكشاف الكواكب والنجوم ببدلة الفضاء الخاصة به، مرسومة بخطوط واضحة ومطبوعة على ورق سميك 150 جرام.",
    descriptionEn:
    "Selim's journey exploring planets and stars in his own spacesuit, printed on thick 150gsm paper.",
    originalPhotoUrl: "/images/stitch/selim-2-cartoon.png",
    cartoonImageUrl: "/images/stitch/selim-2-cartoon.png",
    coloringPageUrl: "/images/stitch/selim-3-coloring.png",
    bookMockupUrl: "/images/stitch/hero-main.png",
    isDemo: true,
    guardianConsentVerified: false,
    pageCount: 24,
  },
  {
    id: "demo-farida-garden",
    slug: "farida-butterfly-garden",
    titleAr: "مغامرات في حديقة الفراشات",
    titleEn: "Butterfly Garden Adventures",
    shortSummaryAr: "قصة فريدة بين الأزهار والفراشات الملونة في حديقتها السحرية",
    shortSummaryEn: "Farida's story among colorful flowers and butterflies in her magical garden",
    storyInterestsAr:
      "تحب فريدة الفراشات والألوان الزاهية واللعب في الحدائق بين الزهور والعصافير.",
    storyInterestsEn:
      "Farida adores butterflies, bright colors, and playing outdoors among flowers and little birds.",
    storyIdeaAr:
      "ابتكرنا لها عالمًا حالمًا داخل حديقة فراشات سحرية تبحث فيها عن ألوان الربيع المفقودة وتعيد للحديقة بهجتها مع كل صفحة تلونها.",
    storyIdeaEn:
      "We created a dreamy butterfly garden where she brings spring colors back to life on every page she colors.",
    storyHeroAr:
      "أصبحت فريدة بطلة القصة بملامحها الحقيقية وفستانها المفضل، لتعيش مغامرة دافئة تعزز حبها للرسم والتلوين.",
    storyHeroEn:
      "Farida became the story's heroine with her real likeness, inspiring hours of joyful coloring and imagination.",
    childLabelAr: "فريدة",
    childLabelEn: "Farida",
    themeAr: "حديقة الفراشات",
    themeEn: "Butterfly Garden",
    descriptionAr:
    "قصة فريدة بين الأزهار والفراشات الملونة بخطوط تلوين انسيابية مناسبة للأطفال وتجليد سلك معدني آمن.",
    descriptionEn:
    "Farida's story among colorful flowers and butterflies with smooth outlines and safe spiral binding.",
    originalPhotoUrl: "/images/stitch/farida-2-cartoon.png",
    cartoonImageUrl: "/images/stitch/farida-2-cartoon.png",
    coloringPageUrl: "/images/stitch/farida-3-coloring.png",
    bookMockupUrl: "/images/stitch/hero-main.png",
    isDemo: true,
    guardianConsentVerified: false,
    pageCount: 12,
  },
];

function mapDbRowToShowcase(row: PortfolioEntryRow): PortfolioShowcaseItem {
  const isDemo = row.kind === "sample" || !row.guardian_consent_verified;
  const slug = row.slug || row.id;
  const summaryAr =
    row.short_summary_ar ||
    row.description_ar ||
    "قصة تلوين مخصصة مرسومة بعناية لتجعل صاحب الكتاب بطل الحكاية.";
  const summaryEn =
    row.short_summary_en ||
    row.description_en ||
    "A hand-crafted personalized coloring story starring the book owner as the hero.";

  return {
    id: row.id,
    slug,
    titleAr: row.title_ar || row.title,
    titleEn: row.title_en || row.title,
    shortSummaryAr: summaryAr,
    shortSummaryEn: summaryEn,
    storyInterestsAr:
      row.story_interests_ar ||
      "تم تصميم هذه القصة خصيصًا بناءً على اهتمامات وهوايات صاحب الكتاب المفضلة.",
    storyInterestsEn:
      row.story_interests_en ||
      "Crafted around the book owner's favorite hobbies and everyday passions.",
    storyIdeaAr:
      row.story_idea_ar ||
      "حوّل فريق رقيم هذه الاهتمامات إلى سيناريو ومشاهد تلوين مترابطة مليئة بالتفاصيل الممتعة.",
    storyIdeaEn:
      row.story_idea_en ||
      "Our artists turned those passions into a cohesive coloring adventure packed with joyful scenes.",
    storyHeroAr:
      row.story_hero_ar ||
      "تم رسم ملامح البطل بعناية ليتصدر الغلاف وكل صفحة في الكتاب بطباعة فاخرة على ورق سميك.",
    storyHeroEn:
      row.story_hero_en ||
      "Their likeness was hand-illustrated onto the cover and every page, printed on thick premium paper.",
    childLabelAr: row.title_ar || row.title,
    childLabelEn: row.title_en || row.title,
    themeAr: summaryAr,
    themeEn: summaryEn,
    descriptionAr: summaryAr,
    descriptionEn: summaryEn,
    originalPhotoUrl: row.image_url,
    cartoonImageUrl: row.cartoon_image_url || row.image_url,
    coloringPageUrl: row.coloring_page_url || row.image_url,
    bookMockupUrl: row.book_mockup_url || row.image_url,
    isDemo,
    guardianConsentVerified: row.guardian_consent_verified,
    pageCount: 24,
  };
}

export async function getPublishedPortfolioItems(): Promise<
  PortfolioShowcaseItem[]
> {
  try {
    const env = getPublicEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return DEFAULT_PORTFOLIO_ITEMS;
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("portfolio_entries")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_PORTFOLIO_ITEMS;
    }

    return (data as PortfolioEntryRow[]).map(mapDbRowToShowcase);
  } catch {
    return DEFAULT_PORTFOLIO_ITEMS;
  }
}

export async function getPortfolioItemBySlug(
  slug: string,
): Promise<PortfolioShowcaseItem | null> {
  const items = await getPublishedPortfolioItems();
  return items.find((item) => item.slug === slug) ?? null;
}
