import { Eye, EyeOff, Images, Trash2 } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import {
  deletePortfolioItemAction,
  togglePortfolioPublishAction,
} from "@/features/admin/media-actions";
import { PortfolioStoryForm } from "@/features/admin/portfolio-story-form";

export default async function AdminPortfolioPage() {
  const { portfolio } = await getAdminCommercialAndCmsData();

    async function handleToggle(formData: FormData) {
      "use server";
      await togglePortfolioPublishAction(formData);
    }

    async function handleDelete(formData: FormData) {
      "use server";
      await deletePortfolioItemAction(formData);
    }

            return (
            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold text-foreground">
                  معرض الأعمال وقصص النجاح (Case Studies)
                </h1>
                <p className="text-sm text-muted-foreground">
                  تحكم كامل في صورة الكارت، الاسم، النبذة القصيرة، وتفاصيل قصة العمل
                  التي تظهر في النافذة المنبثقة للزوار، مع إمكانية النشر أو الإخفاء في
                  أي وقت.
                </p>
              </header>

              <PortfolioStoryForm />

              <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xs">
                <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-3">
                  <Images className="h-5 w-5 text-primary-500" aria-hidden="true" />
                  <h2 className="text-lg font-extrabold text-foreground">
                    الأعمال المسجلة ({portfolio.length})
                  </h2>
                </div>

                {portfolio.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    لا توجد قصص مسجلة بعد في قاعدة البيانات — يتم عرض القصص الافتراضية
                    حتى تضيف أول قصة هنا.
                  </p>
                  ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {portfolio.map((item) => (
                      <article
                        key={item.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
                      >
                        <div className="relative aspect-[4/3] w-full bg-primary-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.title_ar}
                            className="h-full w-full object-cover"
                          />
                          <span
                            className={`absolute top-2.5 end-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.published
                                ? "bg-success text-white"
                                : "bg-foreground/75 text-white"
                              }`}
                          >
                            {item.published ? "منشور" : "مخفي"}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                          <div>
                            <h3 className="text-base font-extrabold text-foreground">
                              {item.title_ar}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {item.short_summary_ar || item.description_ar || "—"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                            <form action={handleToggle}>
                              <input type="hidden" name="id" value={item.id} />
                              <input
                                type="hidden"
                                name="published"
                                value={String(!item.published)}
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-foreground hover:bg-primary-50"
                              >
                                {item.published ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>إخفاء</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>نشر</span>
                                  </>
                                )}
                              </button>
                            </form>

                            <form action={handleDelete}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                aria-label={`حذف ${item.title_ar}`}
                                className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-error/10 px-3 text-xs font-bold text-error hover:bg-error/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>حذف</span>
                              </button>
                            </form>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
        )}
          </section>
      </div>
    );
  }
