"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { OrderLifecycleStage } from "@/lib/supabase/types";
import { useToast } from "@/components/shared/toast-provider";
import { updateOrderStatusAndNotesAction } from "./actions";

const STAGE_OPTIONS: Array<{ value: OrderLifecycleStage; label: string }> = [
  { value: "new", label: "جديد (بانتظار التواصل)" },
  { value: "contacted", label: "تم التواصل" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "designing", label: "جاري الرسم والتحويل" },
  { value: "printing", label: "قيد الطباعة والتجليد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "on_hold", label: "معلق مؤقتاً" },
  { value: "cancelled", label: "ملغي" },
];

export function OrderStatusUpdateForm({
  orderId,
  initialStage,
  initialShippingEgp,
  initialFinalQuoteEgp,
  initialAdminNotes,
}: {
  orderId: string;
  initialStage: OrderLifecycleStage;
  initialShippingEgp: number | null;
  initialFinalQuoteEgp: number | null;
  initialAdminNotes: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [lifecycleStage, setLifecycleStage] =
    useState<OrderLifecycleStage>(initialStage);
  const [shippingEgp, setShippingEgp] = useState(
    initialShippingEgp !== null ? String(initialShippingEgp) : "",
  );
  const [finalQuoteEgp, setFinalQuoteEgp] = useState(
    initialFinalQuoteEgp !== null ? String(initialFinalQuoteEgp) : "",
  );
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("orderId", orderId);
      fd.append("lifecycleStage", lifecycleStage);
      fd.append("shippingEgp", shippingEgp);
      fd.append("finalQuoteEgp", finalQuoteEgp);
      fd.append("adminNotes", adminNotes);

      const res = await updateOrderStatusAndNotesAction(fd);
      if (!res.ok) {
        showToast({
          variant: "error",
          title: "تعذر تحديث حالة الطلب",
          description: res.error ?? "حدث خطأ غير متوقع.",
        });
        return;
      }

      const stageLabel =
        STAGE_OPTIONS.find((s) => s.value === lifecycleStage)?.label ??
        lifecycleStage;
      showToast({
        variant: "success",
        title: "تم حفظ حالة الطلب بنجاح",
        description: `الحالة الحالية الآن: ${stageLabel}`,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="lifecycleStage"
          className="text-xs font-bold text-foreground"
        >
          حالة الطلب في مسار الإنتاج
        </label>
        <select
          id="lifecycleStage"
          name="lifecycleStage"
          value={lifecycleStage}
          onChange={(e) =>
            setLifecycleStage(e.target.value as OrderLifecycleStage)
          }
          className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm font-bold text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none"
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="shippingEgp"
            className="text-xs font-bold text-foreground"
          >
            مصاريف الشحن المؤكدة (ج.م)
          </label>
          <input
            id="shippingEgp"
            name="shippingEgp"
            type="number"
            min={0}
            step={1}
            value={shippingEgp}
            onChange={(e) => setShippingEgp(e.target.value)}
            placeholder="اتركه فارغاً إذا لم يُحدد"
            className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="finalQuoteEgp"
            className="text-xs font-bold text-foreground"
          >
            الإجمالي النهائي المؤكد (ج.م)
          </label>
          <input
            id="finalQuoteEgp"
            name="finalQuoteEgp"
            type="number"
            min={0}
            step={1}
            value={finalQuoteEgp}
            onChange={(e) => setFinalQuoteEgp(e.target.value)}
            placeholder="اختياري"
            className="h-11 rounded-xl border border-border bg-surface-muted/60 px-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="adminNotes"
          className="text-xs font-bold text-foreground"
        >
          ملاحظات داخلية لفريق الإنتاج
        </label>
        <textarea
          id="adminNotes"
          name="adminNotes"
          rows={3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="ملاحظات التواصل أو تفاصيل التعديلات..."
          className="rounded-xl border border-border bg-surface-muted/60 p-3 text-sm text-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-primary-600 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{isPending ? "جاري الحفظ..." : "حفظ التغييرات وتحديث الحالة"}</span>
      </button>
    </form>
  );
}
