"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { adminSignInAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

interface AdminLoginFormProps {
  customSignInHandler?: typeof adminSignInAction;
}

export function AdminLoginForm({ customSignInHandler }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);

      const handler = customSignInHandler ?? adminSignInAction;
      const res = await handler(fd);

      if (!res.ok) {
        setErrorMsg(
          res.error ?? "تعذر تسجيل الدخول. تأكد من صلاحية حساب الأدمن.",
        );
        setIsLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMsg("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error/40 bg-error/5 p-4 text-sm font-bold text-error"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-email"
          className="text-sm font-bold text-foreground"
        >
          البريد الإلكتروني لمسؤول النظام
        </label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute start-3.5 h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="admin-email"
            name="email"
            type="email"
            dir="ltr"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@raqeem.eg"
            className="h-[52px] w-full rounded-xl border border-border bg-surface-muted/60 ps-11 pe-4 text-start text-base text-foreground transition-all focus:border-primary-500 focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-password"
          className="text-sm font-bold text-foreground"
        >
          كلمة المرور
        </label>
        <div className="relative flex items-center">
          <Lock
            className="pointer-events-none absolute start-3.5 h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            dir="ltr"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-[52px] w-full rounded-xl border border-border bg-surface-muted/60 ps-11 pe-12 text-start text-base text-foreground transition-all focus:border-primary-500 focus:bg-surface focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"
            }
            className="absolute end-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="mt-1 min-h-[52px] w-full text-base shadow-[0_8px_24px_-4px_rgba(99,36,197,0.25)]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>جاري التحقق من صلاحيات الأدمن...</span>
          </>
        ) : (
          <>
            <span>تسجيل الدخول للوحة التحكم</span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </Button>

      <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        <span>
          دخول محمي لحساب الأدمن الواحد المعتمد فقط (Supabase Auth + RLS)
        </span>
      </div>
    </form>
  );
}
