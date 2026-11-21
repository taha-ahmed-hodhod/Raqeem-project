"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { FaqItem } from "@/features/content/cms-data";
import { cn } from "@/lib/utils";

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const locale = useLocale() as Locale;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const question = locale === "ar" ? item.questionAr : item.questionEn;
        const answer = locale === "ar" ? item.answerAr : item.answerEn;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs transition-colors"
          >
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                id={`faq-trigger-${item.id}`}
                className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-start text-base font-bold text-foreground transition-colors hover:bg-primary-50/50"
              >
                <span>{question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-primary-500 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div
                id={`faq-panel-${item.id}`}
                role="region"
                aria-labelledby={`faq-trigger-${item.id}`}
                className="border-t border-border/60 bg-surface-muted/30 px-5 py-4 text-sm leading-relaxed text-muted-foreground"
              >
                {answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
