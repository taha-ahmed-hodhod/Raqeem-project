import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import { RAQEEM_WHATSAPP_LOCAL } from "@/lib/brand";
import type {
  BookVariantRow,
  CustomerReviewRow,
  GovernorateRow,
  PosterPopupSettings,
  PromotionRow,
  SocialLinkRow,
} from "@/lib/supabase/types";

export interface FaqItem {
  id: string;
  category: "process" | "privacy" | "quality" | "pricing";
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export interface TestimonialItem {
  id: string;
  quoteAr: string;
  quoteEn: string;
  authorAr: string;
  authorEn: string;
  metaAr: string;
  metaEn: string;
  isDemoPlaceholder: boolean;
}

export interface PublicCatalogAndCmsData {
  bookVariants: BookVariantRow[];
  promotions: PromotionRow[];
  governorates: GovernorateRow[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  heroOverrides: {
    titleAr?: string;
    titleEn?: string;
    subtitleAr?: string;
    subtitleEn?: string;
    imageUrl?: string;
  };
  announcementBar: {
    ar: string | null;
    en: string | null;
  };
  reviews: CustomerReviewRow[];
  socialLinks: SocialLinkRow[];
  posterPopup: PosterPopupSettings;
  contactSettings: {
    whatsappNumber: string | null;
    phoneNumber: string | null;
    email: string | null;
    workingHoursAr: string;
    workingHoursEn: string;
  };
}

export const DEFAULT_BOOK_VARIANTS: BookVariantRow[] = [
  {
    page_count: 12,
    price_piastres: 25000,
    price_egp: 250,
    active: true,
    title_ar: "كتاب تلوين 12 صفحة",
    title_en: "12-Page Coloring Book",
    updated_at: "2026-11-19T00:00:00Z",
  },
  {
    page_count: 24,
    price_piastres: 35000,
    price_egp: 350,
    active: true,
    title_ar: "كتاب تلوين 24 صفحة",
    title_en: "24-Page Coloring Book",
    updated_at: "2026-11-19T00:00:00Z",
  },
];

export const DEFAULT_PROMOTIONS: PromotionRow[] = [
  {
    min_quantity: 2,
    percent: 10,
    active: true,
    title_ar: "خصم 10% عند طلب كتابين",
    title_en: "10% off when ordering 2 books",
    starts_at: null,
    ends_at: null,
    updated_at: "2026-11-19T00:00:00Z",
  },
  {
    min_quantity: 3,
    percent: 20,
    active: true,
    title_ar: "خصم 20% عند طلب 3 كتب أو أكثر",
    title_en: "20% off when ordering 3 or more books",
    starts_at: null,
    ends_at: null,
    updated_at: "2026-11-19T00:00:00Z",
  },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-how-to-order",
    category: "process",
    questionAr: "هل أحتاج لدفع أي مبلغ أونلاين عند إرسال الطلب؟",
    questionEn: "Do I need to pay anything online when submitting a request?",
    answerAr:
      "لا إطلاقاً. إرسال الطلب عبر موقع رقيم مجاني تماماً ولا يتطلب أي بطاقة بنكية أو دفع إلكتروني. بعد إرسال الطلب، يتواصل معك فريقنا عبر واتساب أو الهاتف لتأكيد تفاصيل القصة والسعر النهائي والشحن وطريقة الدفع المناسبة لك.",
    answerEn:
      "Not at all. Submitting a request on Raqeem is completely free and requires no online payment or credit card. After submission, our team contacts you via WhatsApp or phone to confirm story details, final price, shipping, and offline payment arrangements.",
  },
  {
    id: "faq-photo-privacy",
    category: "privacy",
    questionAr: "كيف تحافظون على خصوصية وأمان صور أطفالي؟",
    questionEn: "How do you protect the privacy and safety of my child's photo?",
    answerAr:
      "خصوصية أطفالكم أولويتنا القصوى. تُحفظ الصور المرفوعة في مساحة تخزين خاصة ومشفرة لا يمكن لأي زائر الوصول إليها، ولا يطلع عليها سوى فريق التصميم المختص لتنفيذ كتابك. لا يتم نشر أي صورة لطفل في معرض أعمالنا أبداً إلا بعد الحصول على موافقة كتابية منفصلة وصريحة من ولي الأمر.",
    answerEn:
      "Your child's privacy is our top priority. Uploaded photos are stored in a private, access-controlled storage bucket inaccessible to the public and viewed only by our design team to prepare your book. No child photo is ever published in our portfolio without separate, explicit guardian consent.",
  },
  {
    id: "faq-12-vs-24",
    category: "quality",
    questionAr: "ما الفرق بين نسخة 12 صفحة ونسخة 24 صفحة؟",
    questionEn: "What is the difference between the 12-page and 24-page books?",
    answerAr:
      "كلا النسختين تُطبعان بنفس الجودة الفاخرة (غلاف ملون مقوى بملامح واسم طفلك، ورق رسم أبيض سميك 150 جرام لا يسرب الألوان، وتجليد سلك لولبي متين). نسخة 12 صفحة (250 ج.م) مثالية للأعمار الصغيرة كبداية خفيفة، بينما نسخة 24 صفحة (350 ج.م) تقدم ضعف عدد المشاهد ومغامرة أطول وأغنى بالتفاصيل.",
    answerEn:
      "Both editions share the exact same premium print quality (custom full-color hardcover with your child's name and likeness, thick 150gsm bleed-resistant paper, and durable spiral binding). The 12-page book (250 EGP) is great for younger kids, while the 24-page book (350 EGP) offers double the coloring scenes for a richer adventure.",
  },
  {
    id: "faq-quantity-discounts",
    category: "pricing",
    questionAr: "كيف تعمل خصومات الإخوة والكميات؟ وهل يمكن الدمج بين 12 و24 صفحة؟",
    questionEn: "How do quantity discounts work? Can I mix 12-page and 24-page books?",
    answerAr:
      "نعم! يمكنك طلب أكثر من كتاب لأطفال مختلفين أو جمع نسخ 12 صفحة و24 صفحة في طلب واحد. عند طلب كتابين تحصل تلقائياً على خصم 10% على إجمالي سعر الكتب، وعند طلب 3 كتب أو أكثر تحصل على خصم 20% على إجمالي سعر الكتب (يُطبق أعلى خصم مستحق على سعر الكتب قبل الشحن).",
    answerEn:
      "Yes! You can request books for different children or mix 12-page and 24-page books in a single request. Ordering 2 books gives you 10% off the books subtotal, and ordering 3 or more books gives you 20% off the books subtotal (the single highest qualifying tier applies to books before shipping).",
  },
  {
    id: "faq-shipping",
    category: "pricing",
    questionAr: "كم تبلغ مصاريف الشحن؟ وهل توصلون لجميع محافظات مصر؟",
    questionEn: "How much is shipping, and do you deliver to all Egyptian governorates?",
    answerAr:
      "نوصل لجميع محافظات مصر الـ 27. تختلف تكلفة الشحن حسب المحافظة المختارة، وإذا لم تكن تكلفة الشحن محددة تلقائياً لمحافظتك أثناء الطلب فسيتم تأكيدها معك بوضوح عبر واتساب أو الهاتف قبل البدء في التنفيذ.",
    answerEn:
      "We deliver to all 27 Egyptian governorates. Shipping cost varies by governorate; if a rate is not yet pre-configured for your governorate at request time, our team will confirm the exact shipping fee with you via WhatsApp or phone before production begins.",
  },
];

/**
 * Default testimonials pulled from the Stitch design layout, explicitly flagged
 * with `isDemoPlaceholder: true` so the UI labels them as design preview placeholders
 * until verified customer reviews are published from the Admin CMS (GEMINI.md §6 & §10).
 */
export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "demo-review-1",
    quoteAr:
      "الفكرة رائعة والكتاب طلع أجمل من المتوقع. ابني كان سعيد جداً وشعر إنه بطل القصة فعلاً!",
    quoteEn:
      "The concept is wonderful and the book turned out even nicer than expected. My son was thrilled and truly felt like the hero of the story!",
    authorAr: "والدة ياسين (نموذج معاينة)",
    authorEn: "Yassin's Mom (Preview Sample)",
    metaAr: "نسخة 24 صفحة • نموذج معاينة تجريبي",
    metaEn: "24-Page Edition • Design Preview Placeholder",
    isDemoPlaceholder: true,
  },
  {
    id: "demo-review-2",
    quoteAr:
      "أول مرة بنتي تفضل ماسكة ألوان ومركزة بالساعات ومبسوطة، جودة الورق السلك والطباعة ممتازة جداً.",
    quoteEn:
      "For the first time my daughter spent hours happily focused on coloring away from screens. The spiral binding and thick paper quality are outstanding.",
    authorAr: "والدة مريم (نموذج معاينة)",
    authorEn: "Mariam's Mom (Preview Sample)",
    metaAr: "نسخة 12 صفحة • نموذج معاينة تجريبي",
    metaEn: "12-Page Edition • Design Preview Placeholder",
    isDemoPlaceholder: true,
  },
  {
    id: "demo-review-3",
    quoteAr:
      "هدية عيد ميلاد كانت مختلفة ومميزة جداً لإخوات، فرحة الأولاد لما شافوا أسمائهم وملامحهم على الغلاف لا توصف.",
    quoteEn:
      "A truly unique birthday gift for siblings. Their joy seeing their own names and faces illustrated on the cover was priceless.",
    authorAr: "والدة عمر (نموذج معاينة)",
    authorEn: "Omar's Mom (Preview Sample)",
    metaAr: "باقة الأخوة (كتابين) • نموذج معاينة تجريبي",
    metaEn: "Siblings Bundle (2 Books) • Design Preview Placeholder",
    isDemoPlaceholder: true,
  },
];

export async function getPublicCatalogAndCmsData(): Promise<PublicCatalogAndCmsData> {
  const fallback: PublicCatalogAndCmsData = {
    bookVariants: DEFAULT_BOOK_VARIANTS,
    promotions: DEFAULT_PROMOTIONS,
    governorates: [],
    faqs: DEFAULT_FAQS,
    testimonials: DEFAULT_TESTIMONIALS,
    heroOverrides: {
      imageUrl: "/images/stitch/hero-main.png",
    },
    announcementBar: {
      ar: null,
      en: null,
    },
    reviews: [],
    socialLinks: [
      {
        id: "default-whatsapp",
        platform: "whatsapp",
        label_ar: "واتساب",
        label_en: "WhatsApp",
        icon_key: "whatsapp",
        url: "https://wa.me/201038639918",
        active: true,
        sort_order: 1,
        updated_at: "2026-11-20T00:00:00Z",
      },
    ],
    posterPopup: {
      enabled: false,
      imageUrl: null,
      buttonTextAr: "اطلب كتابك الآن",
      buttonTextEn: "Order Your Book Now",
      buttonUrl: "/ar/order",
    },
    contactSettings: {
      whatsappNumber: RAQEEM_WHATSAPP_LOCAL,
      phoneNumber: RAQEEM_WHATSAPP_LOCAL,
      email: null,
      workingHoursAr: "يومياً من 10 صباحاً حتى 10 مساءً (بتوقيت القاهرة)",
      workingHoursEn: "Daily from 10:00 AM to 10:00 PM (Cairo Time)",
    },
  };

  try {
    const env = getPublicEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return fallback;
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      },
    );

    const [
      variantsRes,
      promosRes,
      govsRes,
      contentRes,
      settingsRes,
      reviewsRes,
      socialRes,
    ] = await Promise.all([
      supabase
        .from("book_variants")
        .select("*")
        .eq("active", true)
        .order("page_count", { ascending: true }),
      supabase
        .from("promotions")
        .select("*")
        .eq("active", true)
        .order("min_quantity", { ascending: true }),
      supabase
        .from("governorates")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("site_content").select("*"),
      supabase.from("site_settings").select("*"),
      supabase
        .from("customer_reviews")
        .select("*")
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("social_links")
        .select("*")
        .eq("active", true)
        .not("url", "is", null)
        .order("sort_order", { ascending: true }),
    ]);

    const bookVariants =
      variantsRes.data && variantsRes.data.length > 0
        ? (variantsRes.data as BookVariantRow[])
        : DEFAULT_BOOK_VARIANTS;

    const promotions =
      promosRes.data && promosRes.data.length > 0
        ? (promosRes.data as PromotionRow[])
        : DEFAULT_PROMOTIONS;

    const governorates =
      govsRes.data && govsRes.data.length > 0
        ? (govsRes.data as GovernorateRow[])
        : [];

    const heroOverrides: PublicCatalogAndCmsData["heroOverrides"] = {};
    const announcementBar: PublicCatalogAndCmsData["announcementBar"] = {
      ar: null,
      en: null,
    };
    let faqs = DEFAULT_FAQS;
    let testimonials = DEFAULT_TESTIMONIALS;

    if (contentRes.data) {
      for (const row of contentRes.data as Array<{
        key: string;
        value: string;
        value_en?: string | null;
        value_json?: unknown;
      }>) {
        if (row.key === "hero_title" && row.value?.trim()) {
          heroOverrides.titleAr = row.value.trim();
          if (row.value_en?.trim()) heroOverrides.titleEn = row.value_en.trim();
        }
        if (row.key === "hero_subtitle" && row.value?.trim()) {
          heroOverrides.subtitleAr = row.value.trim();
          if (row.value_en?.trim())
            heroOverrides.subtitleEn = row.value_en.trim();
        }
        if (row.key === "hero_image_url" && row.value?.trim()) {
          heroOverrides.imageUrl = row.value.trim();
        }
        if (row.key === "announcement_bar") {
          announcementBar.ar = row.value?.trim() || null;
          announcementBar.en = row.value_en?.trim() || null;
        }
        if (row.key === "faqs" && Array.isArray(row.value_json)) {
          faqs = row.value_json as FaqItem[];
        }
        if (row.key === "testimonials" && Array.isArray(row.value_json)) {
          testimonials = row.value_json as TestimonialItem[];
        }
      }
    }

    const contactSettings = { ...fallback.contactSettings };
    const posterPopup: PosterPopupSettings = { ...fallback.posterPopup };
    if (settingsRes.data) {
      for (const row of settingsRes.data as Array<{
        key: string;
        value: Record<string, unknown>;
      }>) {
        if (row.key === "contact" && row.value) {
            if (typeof row.value.whatsappNumber === "string" && row.value.whatsappNumber.trim()) {
              contactSettings.whatsappNumber = row.value.whatsappNumber;
            }
              if (typeof row.value.phoneNumber === "string" && row.value.phoneNumber.trim()) {
                contactSettings.phoneNumber = row.value.phoneNumber;
              }
              if (typeof row.value.email === "string") {
                contactSettings.email = row.value.email;
              }
            }
            if (row.key === "poster_popup" && row.value) {
              posterPopup.enabled = Boolean(row.value.enabled);
              posterPopup.imageUrl =
                typeof row.value.imageUrl === "string" && row.value.imageUrl.trim()
                  ? row.value.imageUrl.trim()
                  : null;
              if (typeof row.value.buttonTextAr === "string" && row.value.buttonTextAr.trim()) {
                posterPopup.buttonTextAr = row.value.buttonTextAr.trim();
              }
              if (typeof row.value.buttonTextEn === "string" && row.value.buttonTextEn.trim()) {
                posterPopup.buttonTextEn = row.value.buttonTextEn.trim();
              }
              if (typeof row.value.buttonUrl === "string" && row.value.buttonUrl.trim()) {
                posterPopup.buttonUrl = row.value.buttonUrl.trim();
              }
            }
          }
        }

        const reviews = (reviewsRes.data ?? []) as CustomerReviewRow[];
        const socialLinks =
          socialRes.data && socialRes.data.length > 0
            ? (socialRes.data as SocialLinkRow[])
            : fallback.socialLinks;

        return {
          bookVariants,
          promotions,
          governorates,
          faqs,
          testimonials,
          heroOverrides: {
            ...heroOverrides,
            imageUrl: heroOverrides.imageUrl || "/images/stitch/hero-main.png",
          },
          announcementBar,
          reviews,
          socialLinks,
          posterPopup,
          contactSettings,
        };
      } catch {
        return fallback;
      }
    }

export async function getAnnouncementBarContent(): Promise<{
  ar: string | null;
  en: string | null;
}> {
  try {
    const env = getPublicEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { ar: null, en: null };
    }

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      },
    );

    const { data } = await supabase
      .from("site_content")
      .select("value, value_en")
      .eq("key", "announcement_bar")
      .maybeSingle();

    if (!data) return { ar: null, en: null };
    return {
      ar: typeof data.value === "string" && data.value.trim() ? data.value.trim() : null,
      en: typeof data.value_en === "string" && data.value_en.trim() ? data.value_en.trim() : null,
    };
  } catch {
    return { ar: null, en: null };
  }
}
