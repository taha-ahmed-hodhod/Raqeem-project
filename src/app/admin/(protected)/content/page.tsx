import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { HeroImageManager } from "@/features/admin/hero-image-manager";
import { CmsContentEditorForm } from "@/features/admin/cms-content-editor-form";

export const dynamic = "force-dynamic";

const EDITABLE_CMS_KEYS: Array<{
  key: string;
  label: string;
  hint?: string;
  defaultAr: string;
  defaultEn: string;
}> = [
  {
    key: "hero_title",
    label: "العنوان الرئيسي للهيرو في الصفحة الرئيسية (Hero Title)",
    defaultAr: "طفلك بطل كتاب التلوين",
    defaultEn: "Your Child Is the Hero of Their Coloring Book",
  },
  {
    key: "hero_subtitle",
    label: "النص الفرعي للهيرو في الصفحة الرئيسية (Hero Subtitle)",
    defaultAr: "من صورته واسمه، نصمّم له مغامرة يلوّنها بإيده.",
    defaultEn:
      "From their photo and name, we craft an adventure they color by hand.",
  },
  {
    key: "announcement_bar",
    label: "شريط الإعلان العلوي (Announcement Bar)",
    hint: "يمكنك كتابة رسالة واحدة، أو رسالتين مفصولتين بعلامة | ليظهر بينهما فاصل وأيقونات الهدية والتوصيل.",
    defaultAr: "كتاب تلوين مخصوص لطفلك | توصيل لكل محافظات مصر",
    defaultEn:
      "Personalized coloring book for your child | Delivery across all of Egypt",
  },
  {
    key: "seo_description",
    label: "وصف محركات البحث (SEO Meta Description)",
    defaultAr:
      "حوّل صورة طفلك لكتاب تلوين مطبوع مخصوص باسمه وشخصيته مع توصيل لجميع محافظات مصر.",
    defaultEn:
      "Turn your child's photo into a custom printed coloring book featuring their name and character, delivered across Egypt.",
  },
];

export default async function AdminContentPage() {
  const { siteContent } = await getAdminCommercialAndCmsData();
  const contentMap = new Map(siteContent.map((c) => [c.key, c]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          إدارة محتوى الموقع ثنائي اللغة (CMS)
        </h1>
        <p className="text-sm text-muted-foreground">
          تعديل صورة ونصوص الهيرو وشريط الإعلان العلوي والـ SEO باللغتين العربية
          (RTL) والإنجليزية (LTR) وتحديثها في الموقع فورًا بدون إعادة نشر الكود.
        </p>
      </header>

      <HeroImageManager
        initialImageUrl={
          contentMap.get("hero_image_url")?.value ||
          "/images/stitch/hero-main.png"
        }
      />

      <div className="flex flex-col gap-5">
        {EDITABLE_CMS_KEYS.map((item) => {
          const existing = contentMap.get(item.key);
          return (
            <CmsContentEditorForm
              key={item.key}
              contentKey={item.key}
              label={item.label}
              hint={item.hint}
              initialAr={existing?.value ?? item.defaultAr}
              initialEn={existing?.value_en ?? item.defaultEn}
            />
          );
        })}
      </div>
    </div>
  );
}
