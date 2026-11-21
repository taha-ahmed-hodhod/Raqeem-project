import { Percent, Plus } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { upsertPromotionTierAction } from "@/features/admin/actions";

export default async function AdminPromotionsPage() {
  const { promotions } = await getAdminCommercialAndCmsData();

  async function handleSavePromo(formData: FormData) {
    "use server";
    await upsertPromotionTierAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          إدارة عروض وخصومات الكميات
        </h1>
        <p className="text-sm text-muted-foreground">
          تتحكم هذه الشرائح في خصومات الإخوة والمجموعات (مثل خصم 10% لكتابين
          و20% لـ 3 كتب فأكثر). يُطبق النظام تلقائياً أعلى شريحة خصم مستحقة
          فقط على إجمالي سعر الكتب بدون الشحن.
        </p>
      </header>

      {/* Existing Promotion Tiers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {promotions.map((promo) => (
          <form
            key={promo.min_quantity}
            action={handleSavePromo}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
          >
            <input
              type="hidden"
              name="bookCount"
              value={promo.min_quantity}
            />

            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-yellow-50 text-warning">
                  <Percent className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-extrabold text-foreground">
                  عرض {promo.min_quantity} كتب أو أكثر
                </h2>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-extrabold text-success">
                خصم {promo.percent}%
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`percent-${promo.min_quantity}`}
                className="text-xs font-bold text-foreground"
              >
                نسبة الخصم المئوية (%)
              </label>
              <input
                id={`percent-${promo.min_quantity}`}
                name="percent"
                type="number"
                min={0}
                max={90}
                required
                defaultValue={promo.percent}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-base font-extrabold text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`promo-ar-${promo.min_quantity}`}
                className="text-xs font-bold text-foreground"
              >
                عنوان العرض بالعربية
              </label>
              <input
                id={`promo-ar-${promo.min_quantity}`}
                name="titleAr"
                type="text"
                required
                defaultValue={promo.title_ar}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`promo-en-${promo.min_quantity}`}
                className="text-xs font-bold text-foreground"
              >
                عنوان العرض بالإنجليزية (English Title)
              </label>
              <input
                id={`promo-en-${promo.min_quantity}`}
                name="titleEn"
                type="text"
                dir="ltr"
                required
                defaultValue={promo.title_en}
                className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3.5 text-start text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                name="active"
                defaultChecked={promo.active}
                className="h-4 w-4 rounded accent-primary-500"
              />
              <span>تفعيل هذه الشريحة في حسابات الموقع</span>
            </label>

            <button
              type="submit"
              className="mt-2 min-h-[44px] w-full cursor-pointer rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600"
            >
              حفظ تعديلات العرض
            </button>
          </form>
        ))}
      </div>

      {/* Add / Upsert New Tier Card */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-500" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-foreground">
            إضافة أو تحديث شريحة كمية إضافية
          </h2>
        </div>

        <form
          action={handleSavePromo}
          className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-bookCount"
              className="text-xs font-bold text-foreground"
            >
              الحد الأدنى لعدد الكتب
            </label>
            <input
              id="new-bookCount"
              name="bookCount"
              type="number"
              min={2}
              max={50}
              required
              placeholder="مثال: 4"
              className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-percent"
              className="text-xs font-bold text-foreground"
            >
              نسبة الخصم (%)
            </label>
            <input
              id="new-percent"
              name="percent"
              type="number"
              min={1}
              max={90}
              required
              placeholder="مثال: 25"
              className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-titleAr"
              className="text-xs font-bold text-foreground"
            >
              العنوان بالعربية
            </label>
            <input
              id="new-titleAr"
              name="titleAr"
              type="text"
              placeholder="خصم 25% لـ 4 كتب فأكثر"
              className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-titleEn"
              className="text-xs font-bold text-foreground"
            >
              العنوان بالإنجليزية
            </label>
            <input
              id="new-titleEn"
              name="titleEn"
              type="text"
              dir="ltr"
              placeholder="25% off for 4+ books"
              className="h-11 w-full rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
            />
          </div>

          <div>
            <input type="hidden" name="active" value="true" />
            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-xl bg-primary-500 px-4 text-sm font-extrabold text-white transition-colors hover:bg-primary-600"
            >
              حفظ الشريحة
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
