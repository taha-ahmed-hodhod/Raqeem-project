# Raqeem | رقيم — Launch, Deployment, Rollback & Owner Handoff Guide

> Version 1.0 — Production Checklist & Operations Manual for **Raqeem | رقيم** (Personalized Printed Children's Coloring Books in Egypt).

---

## 1. Environment Variables Checklist (Vercel Production)

Configure these variables in **Vercel Project Settings → Environment Variables** (NEVER commit real values to Git; keep `.env.example` placeholder-only):

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client & Server | Yes | Production HTTPS origin (e.g. `https://raqeem.eg`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes | Supabase project URL (`https://ojdlkoqettqnlluqfnmt.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Yes | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Yes | Privileged server key for automatic outbox Web Push / Resend dispatch |
| `ADMIN_ALLOWED_EMAIL` | **Server-Only** | Yes | Single allowlisted admin email matching `public.admin_account` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client & Server | Yes (Push) | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | **Server-Only** | Yes (Push) | Web Push VAPID private key |
| `VAPID_SUBJECT` | **Server-Only** | Yes (Push) | `mailto:<owner-email>` (must be a real email, not `example.com`) |
| `RESEND_API_KEY` | **Server-Only** | Yes (Email) | Resend API key for admin email alerts |
| `RESEND_FROM_EMAIL` | **Server-Only** | Yes (Email) | Verified sender domain email in Resend (e.g. `alerts@raqeem.eg`) |
| `ADMIN_NOTIFICATION_EMAIL` | **Server-Only** | Yes (Email) | Destination email for new order alerts |

---

## 2. Database Migrations & Rollback Guide

All schema changes live in `supabase/migrations/`:
1. `20261119021702_initial_schema.sql` — Core tables, RLS, `admin_account`, `child-photos` private bucket.
2. `20261119024442_products_catalog.sql` — Seeded catalog defaults.
3. `20261119070500_m1_raqeem_domain_extensions.sql` — 27 bilingual governorates, `order_items`, `order_status_events`, `admin_notifications`, `notification_outbox`, `portfolio_entries` consent check, `site_settings`.
4. `20261119183000_m3_transactional_order_submission.sql` — Atomic `submit_order_request` RPC with `idempotency_key` deduplication and scoped `child-photos` upload policy.
5. `20261119231000_m5_notifications_outbox_admin_policy.sql` — Admin outbox retry update policy and `push_subscriptions` metadata.

### Rollback Procedure
- **Application Rollback (Vercel):** In Vercel Dashboard → **Deployments** → select the last known-good deployment → **Promote to Production** (takes < 30 seconds).
- **Database Rollback (Supabase):**
  - Enable **Supabase Daily Backups / Point-in-Time Recovery (PITR)** before going live.
  - Because all migrations are strictly additive, rolling back an app release does not break existing database rows or historical order price snapshots.

---

## 3. Privacy, Child Photo Retention & Security Checklist

- [x] **Private Storage:** `child-photos` bucket has `public = false`, 2 MB file size limit, and allows only `image/jpeg`, `image/png`, `image/webp`.
- [x] **Client Compression & EXIF Stripping:** Images are resized to max `1280px` and re-encoded via `<canvas>` to WebP/JPEG before upload, automatically stripping GPS/EXIF metadata.
- [x] **Short-Lived Signed URLs:** Admin order details generate 10-minute signed URLs server-side only after verifying `requireAdminAccess()`.
- [x] **No PII in Notifications:** Web Push (`public/sw.js`) and Resend emails contain ONLY the order reference (`RQM-XXXXXXXX`), book count, and a link to `/admin/orders/[id]`.
- [x] **Guardian Consent:** Order form checkbox starts unchecked and is enforced both client-side and in `submit_order_request`. Portfolio real work requires `guardian_consent_verified = true` at the database constraint level.
- [ ] **Owner Action — Retention Policy:** Define and document your child-photo deletion window (e.g., delete raw uploaded child photos from `child-photos` 30 days after an order reaches `delivered` or `cancelled`) and update `/ar/privacy` and `/en/privacy` accordingly.

---

## 4. دليل المالك لإدارة الموقع وتثبيت تطبيق لوحة التحكم (Owner Walkthrough)

### أ. تثبيت لوحة التحكم كتطبيق (Admin-Only PWA)
التطبيق مخصص **للوحة التحكم فقط (`/admin`)** ولا يظهر للزوار على صفحات المتجر:
1. افتح `/admin` وسجل الدخول بحساب المسؤول.
2. من القائمة الجانبية (أو من شريط العنوان في Chrome / Edge)، اضغط زر **«تثبيت لوحة التحكم كتطبيق»**.
3. على **iPhone / iPad (Safari)**: افتح `/admin` ← اضغط زر المشاركة ← **إضافة إلى الشاشة الرئيسية (Add to Home Screen)** ← افتح التطبيق من الأيقونة لتفعيل إشعارات Web Push.

### ب. تعديل الأسعار والعروض والشحن والمحتوى بدون أي كود
1. **أسعار الكتب (`/admin/pricing`):** عدّل سعر باقة 12 صفحة أو 24 صفحة واضغط حفظ. التغيير يُطبق فورًا على الطلبات الجديدة فقط دون المساس بأسعار الطلبات السابقة.
2. **عروض الكميات (`/admin/promotions`):** عدّل نسبة الخصم أو الحد الأدنى للكتب أو فعّل/أوقف العرض.
3. **شحن الـ 27 محافظة (`/admin/shipping`):** أدخل سعر الشحن بالجنيه لكل محافظة، أو اتركه فارغًا ليظهر للعميل «يُحدد بعد التواصل» (ولن يظهر مجانيًا أبدًا).
4. **معرض الأعمال (`/admin/portfolio`):** أضف أعمالًا حقيقية بعد تأكيد موافقة ولي الأمر (`guardian_consent_verified`) أو نماذج توضيحية (`sample`).
5. **المحتوى ثنائي اللغة (`/admin/content`) وبيانات التواصل (`/admin/settings`):** حدّث النصوص العربية والإنجليزية ورقم الواتساب والهاتف ومواعيد العمل.
6. **الإشعارات (`/admin/notifications`):** فعّل إشعارات المتصفح على جهازك، جرب زر **«إرسال إشعار تجريبي»**، وراقب طابور الإرسال (Outbox).
