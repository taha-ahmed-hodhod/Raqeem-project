import { Phone, ShieldCheck } from "lucide-react";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { updateContactSettingsAction } from "@/features/admin/actions";

export default async function AdminSettingsPage() {
  const [access, { contactSettings }] = await Promise.all([
    verifyAdminAccess(),
    getAdminCommercialAndCmsData(),
  ]);

  async function handleSaveContact(formData: FormData) {
    "use server";
    await updateContactSettingsAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          إعدادات النظام وقنوات التواصل
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة بيانات التواصل الرسمية المعروضة للزوار، ومراجعة حالة حساب
          المسؤول المعتمد.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Public Contact Settings Form */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xs lg:col-span-7">
          <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-3">
            <Phone className="h-5 w-5 text-primary-500" aria-hidden="true" />
            <h2 className="text-lg font-extrabold text-foreground">
              بيانات التواصل الرسمية للموقع
            </h2>
          </div>

          <form action={handleSaveContact} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="whatsappNumber"
                  className="text-xs font-bold text-foreground"
                >
                  رقم واتساب خدمة العملاء
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  dir="ltr"
                  defaultValue={contactSettings.whatsappNumber ?? ""}
                  placeholder="مثال: 01012345678"
                  className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phoneNumber"
                  className="text-xs font-bold text-foreground"
                >
                  رقم الهاتف للاتصال
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  dir="ltr"
                  defaultValue={contactSettings.phoneNumber ?? ""}
                  placeholder="مثال: 01012345678"
                  className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold text-foreground"
              >
                البريد الإلكتروني الرسمي
              </label>
              <input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                defaultValue={contactSettings.email ?? ""}
                placeholder="hello@raqeem.eg"
                className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="workingHoursAr"
                className="text-xs font-bold text-foreground"
              >
                مواعيد العمل (بالعربية)
              </label>
              <input
                id="workingHoursAr"
                name="workingHoursAr"
                type="text"
                defaultValue={contactSettings.workingHoursAr}
                className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="workingHoursEn"
                className="text-xs font-bold text-foreground"
              >
                مواعيد العمل (بالإنجليزية)
              </label>
              <input
                id="workingHoursEn"
                name="workingHoursEn"
                type="text"
                dir="ltr"
                defaultValue={contactSettings.workingHoursEn}
                className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-start text-sm text-foreground"
              />
            </div>

            <div>
              <button
                type="submit"
                className="min-h-[44px] cursor-pointer rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-xs hover:bg-primary-600"
              >
                حفظ إعدادات التواصل
              </button>
            </div>
          </form>
        </section>

        {/* Admin Account & Security Summary */}
        <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <ShieldCheck
              className="h-5 w-5 text-success"
              aria-hidden="true"
            />
            <h2 className="text-lg font-extrabold text-foreground">
              حالة حساب المسؤول والأمان
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                البريد الإلكتروني للمسؤول الحالي:
              </span>
              <p className="font-mono font-bold text-foreground">
                {access.email ?? "غير متاح"}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">
                معرف المستخدم (Auth User UUID):
              </span>
              <p className="font-mono text-xs text-muted-foreground">
                {access.userId}
              </p>
            </div>

            <div className="rounded-xl bg-success/10 p-3.5 text-xs leading-relaxed font-semibold text-success">
              ✓ سياسة المسؤول الواحد (Single Admin Allowlist) مفعلة عبر جدول
              `public.admin_account` ودالة `private.is_admin()` وسياسات RLS على
              جميع الجداول وبوكت الصور الخاص `child-photos`.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
