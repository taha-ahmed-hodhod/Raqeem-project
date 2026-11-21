import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { evaluateAdminAccess, type AdminCheckClient } from "@/lib/security/admin-auth";
import {
  generatePrivatePhotoPath,
  MAX_CHILD_PHOTO_BYTES,
  validateChildPhotoUpload,
} from "@/lib/security/upload-validation";
import {
  isSpamHoneypotTripped,
  SlidingWindowRateLimiter,
} from "@/lib/security/rate-limit";
import {
  EGYPT_GOVERNORATE_CODES,
  orderRequestInputSchema,
} from "@/lib/validation/order-request";

const VALID_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const VALID_WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("M1 — Database, Auth, and Privacy Baseline", () => {
  describe("Single-admin allowlist authorization", () => {
    it("denies unauthenticated requests", async () => {
      const mockClient: AdminCheckClient = {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        rpc: async () => ({ data: false, error: null }),
      };

      const res = await evaluateAdminAccess(mockClient);
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("unauthenticated");
    });

    it("denies authenticated user when email is not in ADMIN_ALLOWED_EMAIL", async () => {
      const mockClient: AdminCheckClient = {
        auth: {
          getUser: async () => ({
            data: {
              user: { id: "user-1", email: "intruder@example.com" },
            },
            error: null,
          }),
        },
        rpc: async () => ({ data: true, error: null }),
      };

      const res = await evaluateAdminAccess(mockClient, "owner@raqeem.eg");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("email_not_allowlisted");
    });

    it("denies authenticated user when database is_project_admin() returns false", async () => {
      const mockClient: AdminCheckClient = {
        auth: {
          getUser: async () => ({
            data: {
              user: { id: "user-2", email: "owner@raqeem.eg" },
            },
            error: null,
          }),
        },
        rpc: async () => ({ data: false, error: null }),
      };

      const res = await evaluateAdminAccess(mockClient, "owner@raqeem.eg");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("not_project_admin");
    });

    it("authorizes the single allowlisted admin when both auth and DB check pass", async () => {
      const mockClient: AdminCheckClient = {
        auth: {
          getUser: async () => ({
            data: {
              user: { id: "admin-uuid", email: "owner@raqeem.eg" },
            },
            error: null,
          }),
        },
        rpc: async () => ({ data: true, error: null }),
      };

      const res = await evaluateAdminAccess(mockClient, "owner@raqeem.eg");
      expect(res.authorized).toBe(true);
      expect(res.userId).toBe("admin-uuid");
    });
  });

  describe("Child photo upload signature & privacy validation", () => {
    it("accepts valid JPEG, PNG, and WebP binary signatures", () => {
      expect(
        validateChildPhotoUpload({
          bytes: VALID_JPEG_BYTES,
          declaredMime: "image/jpeg",
        }),
      ).toEqual({
        valid: true,
        detectedMime: "image/jpeg",
        extension: "jpg",
        byteLength: 12,
      });

      expect(
        validateChildPhotoUpload({
          bytes: VALID_PNG_BYTES,
          declaredMime: "image/png",
        }),
      ).toEqual({
        valid: true,
        detectedMime: "image/png",
        extension: "png",
        byteLength: 12,
      });

      expect(
        validateChildPhotoUpload({
          bytes: VALID_WEBP_BYTES,
          declaredMime: "image/webp",
        }),
      ).toEqual({
        valid: true,
        detectedMime: "image/webp",
        extension: "webp",
        byteLength: 12,
      });
    });

    it("rejects spoofed files where declared MIME is image/jpeg but bytes are HTML/script", () => {
      const spoofedBytes = new TextEncoder().encode(
        "<script>alert('xss')</script>",
      );
      const res = validateChildPhotoUpload({
        bytes: spoofedBytes,
        declaredMime: "image/jpeg",
      });
      expect(res).toEqual({
        valid: false,
        errorCode: "signature_mismatch",
      });
    });

    it("rejects oversized files exceeding 2 MB", () => {
      const oversized = new Uint8Array(MAX_CHILD_PHOTO_BYTES + 1);
      oversized.set(VALID_JPEG_BYTES, 0);

      const res = validateChildPhotoUpload({
        bytes: oversized,
        declaredMime: "image/jpeg",
      });
      expect(res).toEqual({
        valid: false,
        errorCode: "file_too_large",
      });
    });

    it("generates randomized private photo storage paths with no child PII", () => {
      const orderId = "a0c0c941-44c8-460c-ac69-c1cefa42ef71";
      const path1 = generatePrivatePhotoPath(orderId, "image/jpeg");
      const path2 = generatePrivatePhotoPath(orderId, "image/jpeg");

      expect(path1).toMatch(
        /^orders\/a0c0c941-44c8-460c-ac69-c1cefa42ef71\/[0-9a-f-]{36}\.jpg$/,
      );
      expect(path1).not.toBe(path2);
    });
  });

  describe("Server-side order request validation, guardian consent, and rate limiting", () => {
    const validOrderPayload = {
      idempotencyKey: "11111111-2222-4333-8444-555555555555",
      items: [
        {
          pageCount: 12 as const,
          quantity: 1,
          childName: "آدم",
          childAge: 6,
          interests: "الفضاء والديناصورات",
          photoPath:
            "orders/11111111-2222-4333-8444-555555555555/22222222-3333-4444-8555-666666666666.jpg",
        },
      ],
      customerName: "أحمد محمد",
      phone: "+20 101 234 5678",
      governorate: "cairo" as const,
      address: "شارع التحرير، الدقي، عمارة 10",
      consentAccepted: true as const,
      honeypot: "",
    };

    it("covers all 27 Egyptian governorates and normalizes Egyptian mobile numbers", () => {
      expect(EGYPT_GOVERNORATE_CODES).toHaveLength(27);
      const parsed = orderRequestInputSchema.parse(validOrderPayload);
      expect(parsed.phone).toBe("01012345678");
    });

    it("rejects submissions without explicit guardian consent", () => {
      const result = orderRequestInputSchema.safeParse({
        ...validOrderPayload,
        consentAccepted: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects path traversal in private photo paths", () => {
      const result = orderRequestInputSchema.safeParse({
        ...validOrderPayload,
        items: [
          {
            ...validOrderPayload.items[0],
            photoPath: "orders/../secret/file.jpg",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("detects honeypot spam and enforces sliding-window rate limits", () => {
      expect(isSpamHoneypotTripped("")).toBe(false);
      expect(isSpamHoneypotTripped("http://spam.bot")).toBe(true);

      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 2,
        windowMs: 10_000,
      });
      expect(limiter.check("ip-1", 1000).allowed).toBe(true);
      expect(limiter.check("ip-1", 2000).allowed).toBe(true);

      const blocked = limiter.check("ip-1", 3000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBe(8000);

      // Allowed again after window expires
      expect(limiter.check("ip-1", 11_001).allowed).toBe(true);
    });
  });

  describe("Live Supabase RLS & Seed Verification", () => {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://ojdlkoqettqnlluqfnmt.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZGxrb3FldHRxbmxsdXFmbm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDEyOTYsImV4cCI6MjExMDYxNzI5Nn0.X2MLR-ywUe3GqtTfhapEQkWQvc3N9V46NYUk1XOe04o";

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

      it("verifies live book variants (12 & 24 pages), promotions (2->10%, 3+->20%), and 27 governorates", async () => {
        const { data: variants, error: vErr } = await anonClient
          .from("book_variants")
          .select("*")
          .order("page_count");
        expect(vErr).toBeNull();
        expect(variants).toHaveLength(2);
        expect(variants?.[0]?.page_count).toBe(12);
        expect(variants?.[0]?.price_egp).toBeGreaterThan(0);
        expect(variants?.[1]?.page_count).toBe(24);
        expect(variants?.[1]?.price_egp).toBeGreaterThanOrEqual(
          variants?.[0]?.price_egp ?? 0,
        );

        const { data: promos, error: pErr } = await anonClient
          .from("promotions")
          .select("*")
          .order("min_quantity");
        expect(pErr).toBeNull();
        expect(promos).toHaveLength(2);
        expect(promos?.[0]?.min_quantity).toBe(2);
        expect(promos?.[0]?.percent).toBe(10);
        expect(promos?.[1]?.min_quantity).toBe(3);
        expect(promos?.[1]?.percent).toBe(20);

        const { data: govs, error: gErr } = await anonClient
          .from("governorates")
          .select("*")
          .order("sort_order");
        expect(gErr).toBeNull();
        expect(govs).toHaveLength(27);
        expect(
          govs?.every((g) => g.fee_piastres === null || g.fee_piastres >= 0),
        ).toBe(true);
        expect(govs?.every((g) => g.name_ar.length > 0 && g.name_en.length > 0)).toBe(
          true,
        );
      });

      it("blocks unauthorized anon reads and writes to protected tables and private child-photos storage", async () => {
        // admin_account has 1 real row in DB; anon must be completely blocked from reading it
        const { data: adminData, error: adminErr } = await anonClient
          .from("admin_account")
          .select("*");
        expect(adminErr).not.toBeNull();
        expect(adminData).toBeNull();

        // orders must deny SELECT to anon
        const { data: ordersData, error: ordersErr } = await anonClient
          .from("orders")
          .select("*");
        expect(ordersErr).not.toBeNull();
        expect(ordersData).toBeNull();

        // order_items, admin_notifications, notification_outbox must return 0 rows and block INSERT for anon
        const { data: itemsData } = await anonClient
          .from("order_items")
          .select("*");
        expect(itemsData ?? []).toHaveLength(0);

        const { error: itemInsertErr } = await anonClient
          .from("order_items")
          .insert({
            order_id: "11111111-2222-4333-8444-555555555555",
            page_count: 12,
            quantity: 1,
            child_name: "Test",
            child_age: 5,
            photo_path: "orders/test/photo.jpg",
            unit_price_piastres: 25000,
          });
        expect(itemInsertErr).not.toBeNull();

        const { error: notifInsertErr } = await anonClient
          .from("admin_notifications")
          .insert({
            type: "system",
            title_ar: "اختبار",
            title_en: "Test",
          });
        expect(notifInsertErr).not.toBeNull();

        // Catalog tables must deny UPDATE to anon
        const { error: priceUpdateErr } = await anonClient
          .from("book_prices")
          .update({ price_piastres: 100 })
          .eq("pages", 12);
        expect(priceUpdateErr).not.toBeNull();

        // Private storage bucket must deny public/anon upload and listing
        const { error: uploadErr } = await anonClient.storage
          .from("child-photos")
          .upload("orders/test/unauthorized.jpg", VALID_JPEG_BYTES, {
            contentType: "image/jpeg",
          });
        expect(uploadErr).not.toBeNull();

        const { data: listData } = await anonClient.storage
          .from("child-photos")
          .list("orders");
        expect(listData ?? []).toHaveLength(0);
      });
    });
  });
