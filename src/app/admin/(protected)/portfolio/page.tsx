import { Home, Images } from "lucide-react";
import { getAdminCommercialAndCmsData } from "@/features/admin/queries";
import { PortfolioStoryForm } from "@/features/admin/portfolio-story-form";
import { PortfolioAdminCard } from "@/features/admin/portfolio-admin-card";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const { portfolio } = await getAdminCommercialAndCmsData();
  const totalHomeSelected = portfolio.filter((item) => item.show_on_home).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          معرض الأعمال وقصص النجاح (أعمالنا)
        </h1>
        <p className="text-sm text-muted-foreground">
          أضف أعمالك أو بدّل صورة الغلاف في أي وقت (المقاس الإرشادي للغلاف 1200×900
          بكسل بنسبة 4:3)؛ تظهر الكتب المختارة على رف الصفحة الرئيسية بحد أقصى 3
          كتب، بينما تعرض صفحة «أعمالنا» جميع الأعمال المنشورة.
        </p>
      </header>

      <PortfolioStoryForm />

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary-500" aria-hidden="true" />
            <h2 className="text-lg font-extrabold text-foreground">
              الأعمال المسجلة ({portfolio.length})
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EAFF] px-3.5 py-1 text-xs font-extrabold text-[#6324C5]">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>المختار للرئيسية: {totalHomeSelected} / 3</span>
          </div>
        </div>

        {portfolio.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا توجد قصص مسجلة بعد في قاعدة البيانات — يتم عرض القصص الافتراضية
            حتى تضيف أول قصة هنا.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <PortfolioAdminCard
                key={item.id}
                item={item}
                totalHomeSelected={totalHomeSelected}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
