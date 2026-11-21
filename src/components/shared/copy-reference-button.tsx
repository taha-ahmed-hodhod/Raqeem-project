"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyReferenceButton({
  reference,
  isAr,
}: {
  reference: string;
  isAr: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#6324c5]/30 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#6324c5] transition-colors hover:bg-[#F3EAFF]"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#16875D]" aria-hidden="true" />
          <span className="text-[#16875D]">
            {isAr ? "تم النسخ!" : "Copied!"}
          </span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isAr ? "نسخ رقم التتبّع" : "Copy Tracking Code"}</span>
        </>
      )}
    </button>
  );
}
