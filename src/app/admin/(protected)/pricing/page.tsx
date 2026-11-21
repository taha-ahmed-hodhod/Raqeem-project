import { BookOpen, Info } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { updateBookVariantPriceAction } from "@/features/admin/actions";

export default async function AdminPricingPage() {
  const { bookVariants } = await getAdminCommercialAndCmsData();

  async function handleSaveVariant(formData: FormData) {
    "use server";
    await updateBookVariantPriceAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          إدارة أسعار باقات الكتب (12 و24 صفحة)
        </h1>
        <p className="text-sm text-muted-foreground">
          عدّل أسعار باقات كتب التلوين وعناوينها بالعربية والإنجليزية بدون أي
          تعديل برمجي. التغييرات تطبق فوراً على الطلبات الجديدة ولا تغير لقطات
          أسعار الطلبات السابقة.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {bookVariants.map((variant) => (
          <form
            key={variant.page_count}
            action={handleSaveVariant}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
          >
            <input type="hidden" name="pages" value={variant.page_count} />

            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-extrabold text-foreground">
                  باقة {variant.page_count} صفحة تلوين
                </h2>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-700">
                السعر الحالي: {variant.price_egp} ج.م
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`price-${variant.page_count}`}
                className="text-xs font-bold text-foreground"
              >
                السعر بالجنيه المصري (EGP)
              </label>
              <input
                id={`price-${variant.page_count}`}
                name="priceEgp"
                type="number"
                min={1}
                max={100000}
                required
                defaultValue={variant.price_egp}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-base font-extrabold text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`title-ar-${variant.page_count}`}
                className="text-xs font-bold text-foreground"
              >
                العنوان باللغة العربية
              </label>
              <input
                id={`title-ar-${variant.page_count}`}
                name="titleAr"
                type="text"
                required
                defaultValue={variant.title_ar}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`title-en-${variant.page_count}`}
                className="text-xs font-bold text-foreground"
              >
                العنوان باللغة الإنجليزية (English Title)
              </label>
              <input
                id={`title-en-${variant.page_count}`}
                name="titleEn"
                type="text"
                dir="ltr"
                required
                defaultValue={variant.title_en}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-start text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                name="active"
                defaultChecked={variant.active}
                className="h-4 w-4 rounded accent-primary-500"
              />
              <span>الباقة مفعّلة ومتاحة للطلب في الموقع</span>
            </label>

            <button
              type="submit"
              className="mt-2 min-h-[44px] w-full cursor-pointer rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600"
            >
              حفظ تعديلات باقة {variant.page_count} صفحة
            </button>
          </form>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-muted p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
        <p>
          تُحفظ الأسعار في قاعدة البيانات بوحدة القرش (`price_piastres`) لضمان
          الدقة المحاسبية التامة، وتُلتقط نسخة ثابتة من السعر مع كل طلب جديد عند
          إرساله.
        </p>
      </div>
    </div>
  );
}
