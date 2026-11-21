import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { verifyAdminAccess } from "@/lib/security/admin-auth";
import { AdminLoginForm } from "@/features/admin/admin-login-form";

export default async function AdminLoginPage() {
  const access = await verifyAdminAccess();
  if (access.authorized) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top Bar from Stitch Login Screen */}
      <header className="border-b border-border/70 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/ar" className="inline-flex items-center gap-2.5">
            <Image
              src="/images/logo-raqeem.png"
              alt="رقيم | Raqeem"
              width={120}
              height={36}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/ar"
            className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary-600"
          >
            العودة للموقع الرئيسي
          </Link>
        </div>
      </header>

      {/* Main Split Card Container (Stitch Desktop & Mobile Login Design) */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-12 lg:py-14">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_50px_-12px_rgba(99,36,197,0.12)] lg:grid-cols-12">
          {/* Side A: Brand & Security Showcase (5 Cols on Desktop) */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-50 via-surface-muted to-primary-50 p-8 lg:col-span-5 lg:p-10">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-surface/90 px-3.5 py-1.5 text-xs font-extrabold text-primary-700 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>بوابة إدارة منصة رقيم</span>
              </div>
              <h1 className="text-2xl leading-snug font-extrabold text-foreground lg:text-3xl">
                لوحة تحكم العمليات والإنتاج
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                إدارة طلبات أولياء الأمور، معاينة صور الأطفال الخاصة بأمان،
                وتحديث الأسعار والعروض ومصاريف الشحن والمحتوى ثنائي اللغة.
              </p>
            </div>

            <div className="relative z-10 my-6 flex justify-center">
              <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-2xl border border-border bg-surface/80 p-2.5 shadow-md">
                <Image
                  src="/images/hero-child-coloring-2.png"
                  alt="لوحة تحكم رقيم"
                  width={240}
                  height={240}
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2.5 text-xs font-semibold text-foreground">
              <div className="flex items-center gap-2.5 rounded-xl bg-surface/80 p-3 shadow-2xs">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span>وصول حصري لمسؤول النظام المعتمد في جدول admin_account</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-surface/80 p-3 shadow-2xs">
                <Lock
                  className="h-4 w-4 shrink-0 text-primary-600"
                  aria-hidden="true"
                />
                <span>روابط موقعة مؤقتة (Signed URLs) لحماية صور الأطفال</span>
              </div>
            </div>
          </div>

          {/* Side B: Login Form Card (7 Cols on Desktop) */}
          <div className="flex flex-col justify-center bg-surface p-8 sm:p-10 lg:col-span-7 lg:p-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">
                  تسجيل دخول المسؤول
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  أدخل البريد الإلكتروني وكلمة المرور الخاصة بحساب الإدارة.
                </p>
              </div>

              <AdminLoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
