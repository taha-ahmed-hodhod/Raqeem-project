"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/toast-provider";
import { updateSiteContentAction } from "./actions";

interface CmsContentEditorFormProps {
  contentKey: string;
  label: string;
  hint?: string;
  initialAr: string;
  initialEn: string;
}

export function CmsContentEditorForm({
  contentKey,
  label,
  hint,
  initialAr,
  initialEn,
}: CmsContentEditorFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [valueAr, setValueAr] = useState(initialAr);
  const [valueEn, setValueEn] = useState(initialEn);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("key", contentKey);
        fd.set("valueAr", valueAr);
        fd.set("valueEn", valueEn);
        const res = await updateSiteContentAction(fd);

        if (!res.ok) {
          showToast({
            variant: "error",
            title: res.error ?? "تعذر حفظ النص. حاول مرة أخرى.",
          });
          if (res.requiresLogin) {
            router.push("/admin/login");
          }
          return;
        }

        showToast({
          variant: "success",
          title: "تم حفظ ونشر النص بنجاح",
          description: "سيظهر التعديل فورًا على الموقع.",
        });
        router.refresh();
      } catch {
        showToast({
          variant: "error",
          title: "حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs"
    >
      <div className="flex flex-col gap-1 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-500" aria-hidden="true" />
          <h2 className="text-base font-extrabold text-foreground">{label}</h2>
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`ar-${contentKey}`}
            className="text-xs font-bold text-foreground"
          >
            النص باللغة العربية (RTL)
          </label>
          <textarea
            id={`ar-${contentKey}`}
            name="valueAr"
            rows={3}
            required
            value={valueAr}
            onChange={(e) => setValueAr(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`en-${contentKey}`}
            className="text-xs font-bold text-foreground"
          >
            النص باللغة الإنجليزية (English LTR)
          </label>
          <textarea
            id={`en-${contentKey}`}
            name="valueEn"
            rows={3}
            dir="ltr"
            value={valueEn}
            onChange={(e) => setValueEn(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-muted/60 p-3 text-start text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl bg-primary-500 px-6 py-2 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <span>حفظ ونشر النص</span>
        </button>
      </div>
    </form>
  );
}
