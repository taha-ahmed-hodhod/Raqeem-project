import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";
import { isRtlLocale, routing } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("M0 Foundation", () => {
  it("configures Arabic as default RTL locale and English as LTR", () => {
    expect(routing.defaultLocale).toBe("ar");
    expect(routing.locales).toEqual(["ar", "en"]);
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
  });

  it("maintains full translation key parity between ar.json and en.json", () => {
    const arKeys = collectKeys(arMessages).sort();
    const enKeys = collectKeys(enMessages).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("merges Tailwind classes safely with cn()", () => {
    expect(cn("px-4", "px-6", "text-sm")).toBe("px-6 text-sm");
  });

  it("renders accessible Button with 44px minimum touch target", () => {
    render(<Button>اطلب كتابك</Button>);
    const btn = screen.getByRole("button", { name: "اطلب كتابك" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("min-h-[44px]");
  });
});
