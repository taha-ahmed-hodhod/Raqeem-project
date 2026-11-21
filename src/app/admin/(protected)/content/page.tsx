import { Globe } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { updateSiteContentAction } from "@/features/admin/actions";
import { HeroImageManager } from "@/features/admin/hero-image-manager";

const EDITABLE_CMS_KEYS: Array<{
  key: string;
  label: string;
  defaultAr: string;
  defaultEn: string;
}> = [
  {
    key: "hero_subtitle",
    label: "النص الفرعي للهيرو في الصفحة الرئيسية (Hero Subtitle)",
    defaultAr:
      "حوّل صورة طفلك لكتاب تلوين مخصوص باسمه وشخصيته، مليان مغامرات ورسومات ممتعة، مطبوع بجودة عالية وبيوصلك لحد البيت.",
    defaultEn:
      "Turn your child's photo into a personalized coloring book with their own name and character, printed in high quality and delivered to your door.",
  },
  {
    key: "announcement_bar",
    label: "شريط الإعلان العلوي (Announcement Bar)",
    defaultAr: "🎁 كتاب تلوين مخصوص لطفلك | 🚚 توصيل لجميع محافظات مصر",
    defaultEn:
      "🎁 A personalized coloring book for your child | 🚚 Delivery across all Egyptian governorates",
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

  async function handleSaveContent(formData: FormData) {
    "use server";
    await updateSiteContentAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          إدارة محتوى الموقع ثنائي اللغة (CMS)
        </h1>
        <p className="text-sm text-muted-foreground">
          تعديل نصوص الواجهة والـ SEO باللغتين العربية (RTL) والإنجليزية (LTR)
          وتحديثها في الموقع مباشرةً بدون إعادة نشر الكود.
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
            <form
              key={item.key}
              action={handleSaveContent}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
            >
              <input type="hidden" name="key" value={item.key} />

              <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                <Globe
                  className="h-5 w-5 text-primary-500"
                  aria-hidden="true"
                />
                <h2 className="text-base font-extrabold text-foreground">
                  {item.label}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`ar-${item.key}`}
                    className="text-xs font-bold text-foreground"
                  >
                    النص باللغة العربية (RTL)
                  </label>
                  <textarea
                    id={`ar-${item.key}`}
                    name="valueAr"
                    rows={3}
                    required
                    defaultValue={existing?.value ?? item.defaultAr}
                    className="w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`en-${item.key}`}
                    className="text-xs font-bold text-foreground"
                  >
                    النص باللغة الإنجليزية (English LTR)
                  </label>
                  <textarea
                    id={`en-${item.key}`}
                    name="valueEn"
                    rows={3}
                    dir="ltr"
                    defaultValue={existing?.value_en ?? item.defaultEn}
                    className="w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-start text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="min-h-[42px] cursor-pointer rounded-xl bg-primary-500 px-6 py-2 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600"
                >
                  حفظ ونشر النص
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
