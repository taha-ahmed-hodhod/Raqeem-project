import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { OrderTrackerClient } from "@/features/orders/order-tracker-client";

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  const { ref } = await searchParams;
  setRequestLocale(locale);
  const isAr = (locale as Locale) === "ar";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full bg-[#F3EAFF] px-4 py-1 text-xs font-extrabold text-[#6324c5]">
          {isAr ? "متابعة حالة الطلب" : "Order Status Tracking"}
        </span>
        <h1 className="text-3xl font-extrabold text-[#241747] sm:text-4xl">
          {isAr ? "تتبّع طلبك في رقيم" : "Track Your Raqeem Order"}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#625B75] sm:text-base">
          {isAr
            ? "أدخل رقم التتبّع الظاهر لك بعد إرسال الطلب لمعرفة المرحلة الحالية لتجهيز وطباعة كتابك."
            : "Enter the tracking reference shown after submitting your request to see your book's current stage."}
        </p>
      </header>

      <OrderTrackerClient initialRef={ref ?? ""} />
    </div>
  );
}
