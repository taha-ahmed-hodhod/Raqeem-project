import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PwaInstallButton } from "@/components/admin/pwa-install-button";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("M6 — QA, Admin-Only PWA, SEO & Launch Readiness", () => {
  describe("Full-Site Mobile PWA Manifest & Dashboard Install Control", () => {
    it("configures manifest.webmanifest for the full website (scope '/') with valid 192x192 & 512x512 square PNG icons", () => {
      const manifestPath = path.join(
        process.cwd(),
        "public",
        "manifest.webmanifest",
      );
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        id: string;
        start_url: string;
        scope: string;
        display: string;
        icons: Array<{ src: string; sizes: string; type: string }>;
      };

      expect(manifest.id).toBe("/");
      expect(manifest.start_url).toBe("/ar");
      expect(manifest.scope).toBe("/");
      expect(manifest.display).toBe("standalone");

      const icon192Path = path.join(
        process.cwd(),
        "public",
        "icons",
        "admin-icon-192.png",
      );
      const icon512Path = path.join(
        process.cwd(),
        "public",
        "icons",
        "admin-icon-512.png",
      );

      expect(fs.existsSync(icon192Path)).toBe(true);
      expect(fs.existsSync(icon512Path)).toBe(true);

      const buf192 = fs.readFileSync(icon192Path);
      expect(buf192.readUInt32BE(16)).toBe(192);
      expect(buf192.readUInt32BE(20)).toBe(192);

      const buf512 = fs.readFileSync(icon512Path);
      expect(buf512.readUInt32BE(16)).toBe(512);
      expect(buf512.readUInt32BE(20)).toBe(512);
    });

    it("links manifest.webmanifest on both public /[locale] and /admin layouts while keeping PwaInstallButton in Dashboard only", () => {
      const publicLayout = fs.readFileSync(
        path.join(process.cwd(), "src", "app", "[locale]", "layout.tsx"),
        "utf8",
      );
      const adminLayout = fs.readFileSync(
        path.join(process.cwd(), "src", "app", "admin", "layout.tsx"),
        "utf8",
      );

      expect(publicLayout).toContain('manifest: "/manifest.webmanifest"');
      expect(adminLayout).toContain('manifest: "/manifest.webmanifest"');
      expect(publicLayout).not.toContain("PwaInstallButton");
    });

    it("renders PwaInstallButton, registers SW on scope '/', and triggers deferred beforeinstallprompt when clicked", async () => {
      const registerMock = vi.fn(async () => ({}));
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: { register: registerMock },
      });

      render(<PwaInstallButton />);

      expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });

      const promptMock = vi.fn(async () => {});
      const beforeInstallEvent = new Event("beforeinstallprompt") as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
      };
      beforeInstallEvent.prompt = promptMock;
      beforeInstallEvent.userChoice = Promise.resolve({
        outcome: "accepted",
        platform: "web",
      });

      act(() => {
        window.dispatchEvent(beforeInstallEvent);
      });

      const installBtn = screen.getByRole("button", {
        name: /تثبيت تطبيق رقيم/,
      });
      await act(async () => {
        fireEvent.click(installBtn);
      });

      expect(promptMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("SEO Robots & Bilingual Sitemap", () => {
    it("disallows /admin and /api in robots.ts and lists both /ar and /en routes in sitemap.ts", () => {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;

      expect(rules?.disallow).toContain("/admin");
      expect(rules?.disallow).toContain("/api/");

      const entries = sitemap();
      const urls = entries.map((e) => e.url);
      expect(urls.some((u) => u.endsWith("/ar"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/en"))).toBe(true);
      expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    });
  });

  describe("Commercial Policy Guard (No Online Checkout / Deposit Selector)", () => {
    it("contains zero online payment / deposit selector strings in OrderRequestForm", () => {
      const formSource = fs.readFileSync(
        path.join(
          process.cwd(),
          "src",
          "features",
          "orders",
          "order-request-form.tsx",
        ),
        "utf8",
      );

      // Strip comments so policy notes in comments don't trigger false positives
      const codeWithoutComments = formSource
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "");

      expect(codeWithoutComments).not.toMatch(
        /Pay Now|دفع العربون|إيصال التحويل|فودافون كاش|InstaPay/i,
      );
      expect(codeWithoutComments).toContain("إرسال الطلب");
    });
  });
});
