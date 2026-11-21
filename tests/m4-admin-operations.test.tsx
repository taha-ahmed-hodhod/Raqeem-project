import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminLoginForm } from "@/features/admin/admin-login-form";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  formatWhatsAppLink,
  LIFECYCLE_LABELS_AR,
} from "@/features/admin/queries";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock,
  }),
  redirect: vi.fn(),
}));

describe("M4 — Admin Operations Dashboard", () => {
  describe("AdminLoginForm (Single-Admin Sign-In & Password Toggle)", () => {
    it("toggles password visibility and displays denial error for unauthorized accounts", async () => {
      const mockDeniedSignIn = vi.fn(async () => ({
        ok: false,
        error:
          "هذا الحساب غير مُدرج في قائمة مسؤول النظام المعتمد (Single Admin Allowlist).",
      }));

      render(<AdminLoginForm customSignInHandler={mockDeniedSignIn} />);

      const emailInput = screen.getByLabelText(
        /البريد الإلكتروني لمسؤول النظام/,
      );
      const passwordInput = screen.getByLabelText("كلمة المرور");
      expect(passwordInput).toHaveAttribute("type", "password");

      // Toggle show password
      const toggleBtn = screen.getByRole("button", {
        name: /عرض كلمة المرور/,
      });
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute("type", "text");

      fireEvent.change(emailInput, {
        target: { value: "intruder@example.com" },
      });
      fireEvent.change(passwordInput, { target: { value: "wrongpass" } });

      fireEvent.click(
        screen.getByRole("button", { name: /تسجيل الدخول للوحة التحكم/ }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /Single Admin Allowlist/,
        );
      });
    });

    it("redirects to /admin upon successful allowlisted admin sign-in", async () => {
      replaceMock.mockReset();
      const mockAllowedSignIn = vi.fn(async () => ({ ok: true }));

      render(<AdminLoginForm customSignInHandler={mockAllowedSignIn} />);

      fireEvent.change(
        screen.getByLabelText(/البريد الإلكتروني لمسؤول النظام/),
        { target: { value: "owner@raqeem.eg" } },
      );
      fireEvent.change(screen.getByLabelText("كلمة المرور"), {
        target: { value: "StrongSecret123!" },
      });

      fireEvent.click(
        screen.getByRole("button", { name: /تسجيل الدخول للوحة التحكم/ }),
      );

      await waitFor(() => {
        expect(mockAllowedSignIn).toHaveBeenCalledTimes(1);
        expect(replaceMock).toHaveBeenCalledWith("/admin");
      });
    });
  });

  describe("AdminShell Navigation, Badges, and Quick Search", () => {
    it("renders all 9 admin sections, displays new orders & unread notifications badges, and routes quick search", () => {
      pushMock.mockReset();

      render(
        <AdminShell
          adminEmail="owner@raqeem.eg"
          newOrdersCount={5}
          unreadNotificationsCount={3}
        >
          <div data-testid="admin-child-view">محتوى النظرة العامة</div>
        </AdminShell>,
      );

      expect(screen.getByText("نظرة عامة")).toBeInTheDocument();
      expect(screen.getByText("الطلبات وإدارة الإنتاج")).toBeInTheDocument();
      expect(screen.getByText("معرض الأعمال والموافقات")).toBeInTheDocument();
      expect(screen.getByText("إدارة المحتوى (CMS)")).toBeInTheDocument();
      expect(screen.getByText("أسعار باقات الكتب")).toBeInTheDocument();
      expect(screen.getByText("عروض وخصومات الكميات")).toBeInTheDocument();
      expect(screen.getByText("مصاريف الشحن والمحافظات")).toBeInTheDocument();
      expect(screen.getByText("الإشعارات والتنبيهات")).toBeInTheDocument();
      expect(screen.getByText("إعدادات النظام والتواصل")).toBeInTheDocument();

      // Badges and admin email
      expect(screen.getByText("owner@raqeem.eg")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();

      // Quick search routing
      const searchInput = screen.getByPlaceholderText(/بحث سريع برقم الطلب/);
      fireEvent.change(searchInput, { target: { value: "RQM-1234" } });
      fireEvent.submit(searchInput.closest("form")!);

      expect(pushMock).toHaveBeenCalledWith("/admin/orders?q=RQM-1234");
    });
  });

  describe("WhatsApp Contact Helper & Full Order Lifecycle Labels", () => {
    it("formats Egyptian phone numbers into wa.me links with order reference", () => {
      const link = formatWhatsAppLink("01012345678", "RQM-ABCD1234");
      expect(link).toContain("https://wa.me/201012345678?text=");
      expect(decodeURIComponent(link)).toContain("RQM-ABCD1234");
    });

    it("provides Arabic labels for all 9 order lifecycle stages", () => {
      const stages = Object.keys(LIFECYCLE_LABELS_AR);
      expect(stages).toEqual([
        "new",
        "contacted",
        "confirmed",
        "designing",
        "printing",
        "shipped",
        "delivered",
        "on_hold",
        "cancelled",
      ]);
    });
  });
});
