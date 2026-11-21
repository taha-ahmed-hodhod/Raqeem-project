import { Plus, Share2, Trash2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PosterPopupSettings, SocialLinkRow } from "@/lib/supabase/types";
import {
  deleteSocialLinkAction,
  saveSocialLinkAction,
} from "@/features/social/actions";
import { PosterPopupManager } from "@/features/admin/poster-popup-manager";

export default async function AdminSocialAndPosterPage() {
  const supabase = await createSupabaseServerClient();
  const [linksRes, posterRes] = await Promise.all([
    supabase.from("social_links").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "poster_popup")
      .maybeSingle(),
  ]);

  const links = (linksRes.data ?? []) as SocialLinkRow[];
  const posterVal = (posterRes.data?.value ?? {}) as Record<string, unknown>;
  const initialPoster: PosterPopupSettings = {
    enabled: Boolean(posterVal.enabled),
    imageUrl:
      typeof posterVal.imageUrl === "string" ? posterVal.imageUrl : null,
    buttonTextAr:
      typeof posterVal.buttonTextAr === "string"
        ? posterVal.buttonTextAr
        : "اطلب كتابك الآن",
    buttonTextEn:
      typeof posterVal.buttonTextEn === "string"
        ? posterVal.buttonTextEn
        : "Order Your Book Now",
    buttonUrl:
      typeof posterVal.buttonUrl === "string"
        ? posterVal.buttonUrl
        : "/ar/order",
  };

  async function handleSaveLink(formData: FormData) {
    "use server";
    await saveSocialLinkAction(formData);
  }

  async function handleDeleteLink(formData: FormData) {
    "use server";
    await deleteSocialLinkAction(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          السوشيال ميديا والبوستر الترويجي
        </h1>
        <p className="text-sm text-muted-foreground">
          إدارة روابط صفحات رقيم الرسمية (لا يظهر للزوار إلا المنصات المفعّلة
          ذات الروابط الصحيحة) والتحكم الكامل في البوستر المنبثق عند دخول
          الموقع.
        </p>
      </header>

      <PosterPopupManager initialPoster={initialPoster} />

      {/* Existing Social Platforms */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <Share2 className="h-5 w-5 text-primary-500" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-foreground">
            روابط صفحات السوشيال ميديا ({links.length})
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {links.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4"
            >
              <form
                action={handleSaveLink}
                className="grid grid-cols-1 items-end gap-3 md:grid-cols-12"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="platform" value={item.platform} />
                <input type="hidden" name="iconKey" value={item.icon_key} />

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    الاسم (عربي)
                  </label>
                  <input
                    type="text"
                    name="labelAr"
                    defaultValue={item.label_ar}
                    required
                    className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-bold text-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    الاسم (إنجليزي)
                  </label>
                  <input
                    type="text"
                    name="labelEn"
                    dir="ltr"
                    defaultValue={item.label_en}
                    className="h-10 rounded-xl border border-border bg-surface px-3 text-start text-sm text-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-5">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    الرابط (https://...)
                  </label>
                  <input
                    type="url"
                    name="url"
                    dir="ltr"
                    defaultValue={item.url ?? ""}
                    placeholder="https://..."
                    className="h-10 rounded-xl border border-border bg-surface px-3 text-start font-mono text-xs text-foreground"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 md:col-span-3">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-foreground">
                    <input
                      type="checkbox"
                      name="active"
                      value="true"
                      defaultChecked={item.active}
                      className="h-4 w-4 accent-primary-500"
                    />
                    <span>ظاهر</span>
                  </label>

                  <button
                    type="submit"
                    className="h-10 cursor-pointer rounded-xl bg-primary-500 px-4 text-xs font-extrabold text-white hover:bg-primary-600"
                  >
                    حفظ
                  </button>
                </div>
              </form>

              {item.platform !== "whatsapp" && (
                <div className="flex justify-end">
                  <form action={handleDeleteLink}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-error hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>حذف المنصة</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Platform */}
        <form
          action={handleSaveLink}
          className="mt-2 grid grid-cols-1 items-end gap-3 rounded-2xl border border-dashed border-primary-500/40 bg-primary-50/30 p-4 md:grid-cols-12"
        >
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] font-bold text-foreground">
              اسم منصة جديدة
            </label>
            <input
              type="text"
              name="labelAr"
              required
              placeholder="مثال: يوتيوب"
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[11px] font-bold text-foreground">
              الأيقونة
            </label>
            <select
              name="iconKey"
              defaultValue="globe"
              className="h-10 rounded-xl border border-border bg-surface px-2 text-xs font-bold text-foreground"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="youtube">YouTube</option>
              <option value="globe">موقع / أخرى</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-5">
            <label className="text-[11px] font-bold text-foreground">
              رابط الحساب (https://...)
            </label>
            <input
              type="url"
              name="url"
              dir="ltr"
              placeholder="https://..."
              className="h-10 rounded-xl border border-border bg-surface px-3 text-start font-mono text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-between gap-2 md:col-span-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                name="active"
                value="true"
                defaultChecked
                className="h-4 w-4 accent-primary-500"
              />
              <span>إظهار</span>
            </label>

            <button
              type="submit"
              className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-xl bg-[#241747] px-4 text-xs font-extrabold text-white hover:bg-[#3a266e]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>إضافة</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
