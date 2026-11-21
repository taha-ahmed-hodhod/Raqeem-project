import { MapPin } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { updateGovernorateShippingAction } from "@/features/admin/actions";

export default async function AdminShippingPage() {
  const { governorates } = await getAdminCommercialAndCmsData();

  async function handleSaveShipping(formData: FormData) {
    "use server";
    await updateGovernorateShippingAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          مصاريف الشحن لجميع محافظات مصر ({governorates.length} محافظة)
        </h1>
        <p className="text-sm text-muted-foreground">
          حدد تكلفة الشحن بالجنيه المصري لكل محافظة، أو اترك الحقل فارغاً ليظهر
          للعميل{" "}
          <strong>&ldquo;مصاريف الشحن هتتأكد معاك بعد إرسال الطلب&rdquo;</strong>{" "}
          (لا يفترض النظام أبداً أن الشحن الفارغ مجاني).
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {governorates.map((gov) => {
            const feeEgp =
              gov.fee_piastres !== null
                ? Math.round(gov.fee_piastres / 100)
                : "";

            return (
              <form
                key={gov.code}
                action={handleSaveShipping}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-background p-4 shadow-2xs"
              >
                <input type="hidden" name="code" value={gov.code} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 text-primary-500"
                      aria-hidden="true"
                    />
                    <div>
                      <h2 className="text-sm font-extrabold text-foreground">
                        {gov.name_ar}
                      </h2>
                      <span className="text-[11px] text-muted-foreground">
                        {gov.name_en} ({gov.code})
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      gov.fee_piastres !== null
                        ? "bg-success/10 text-success"
                        : "bg-accent-yellow-50 text-warning"
                    }`}
                  >
                    {gov.fee_piastres !== null
                      ? `${feeEgp} ج.م`
                      : "يتأكد بعد التواصل"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="feeEgp"
                    min={0}
                    max={10000}
                    defaultValue={feeEgp}
                    placeholder="فارغ = يتأكد بعد التواصل"
                    aria-label={`سعر الشحن لمحافظة ${gov.name_ar}`}
                    className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm font-bold text-foreground focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 cursor-pointer rounded-xl bg-primary-500 px-3.5 text-xs font-extrabold text-white transition-colors hover:bg-primary-600"
                  >
                    حفظ
                  </button>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={gov.active}
                    className="h-3.5 w-3.5 rounded accent-primary-500"
                  />
                  <span>المحافظة متاحة في قائمة الطلب</span>
                </label>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
