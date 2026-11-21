# Plan.md — RAQEEM / رقيم Implementation Blueprint
> Google Antigravity execution roadmap · Version 1.0 · 2026-11-19
> Companion documents: `GEMINI.md` (agent rules), `design.md` (UI/UX spec), legacy `plan.md` and `AGENTS.md` (supporting references).

## 0. Executive summary
**Raqeem** is an Egypt-wide, bilingual (Arabic RTL / English LTR) custom **printed** coloring-book service. Parents submit a photo of their child and preferences; Raqeem's team manually transforms it into a cartoon character, produces coloring scenes, prints the book and delivers it. The website converts visitors into **order requests** and the team follows up by WhatsApp/phone. It is **not** a checkout/payment site.

**Core conversion funnel:** landing → proof/portfolio → configure book(s) → upload photo(s) → guardian and delivery details → live estimate → submit request → success → admin alerted → team contacts customer → production → delivery.

**Explicit scope boundary:** no online payment, no online deposit, no receipt upload, no automatic AI coloring-book generation in v1. An earlier competitor reference contained a deposit selector, but the user explicitly chose a contact-first form instead. Payment/deposit is handled privately after staff contact, if applicable.

## 1. Confirmed business requirements

| Decision | Approved behavior |
|---|---|
| Book types | 12 pages and 24 pages |
| 12-page price | **EGP 250** |
| 24-page price | **EGP 350** |
| Two-book offer | **10% discount** on book subtotal |
| Three or more books | **20% discount** on book subtotal |
| Discount calculation | One highest qualifying tier; no stacking; shipping excluded |
| Pricing management | Editable from Admin Dashboard |
| Offers management | Create/edit/toggle promotional tiers in Dashboard |
| Shipping | All **27 Egyptian governorates**; rate editable by governorate |
| Missing shipping rate | Display “confirmed after contact,” never assume free |
| Customer contact | WhatsApp + phone |
| Order submission | Request only; team confirms final quote |
| Admin users | **One admin** for v1 |
| Content management | Full bilingual editing of website text, images, portfolio and banners |
| Portfolio | Real examples (with guardian consent) and clearly labeled demos |
| Alerts | **Web Push + in-app Dashboard + email** |
| Website languages | Arabic default RTL; English LTR |
| Deployment | Next.js on Vercel; Supabase for data/auth/storage |

### Price examples
- 1×12-page book: **250 EGP** excluding shipping.
- 1×24-page book: **350 EGP** excluding shipping.
- 2×12-page: 500 − 10% (50) = **450 EGP** excluding shipping.
- 3×24-page: 1050 − 20% (210) = **840 EGP** excluding shipping.
- 1×12-page + 1×24-page: 600 − 10% (60) = **540 EGP** excluding shipping.
- 4+ books: apply current top qualifying 3+ tier of 20%, unless admin changes it.

Prices and rates are **configuration**, not hard-coded UI logic. Save a pricing snapshot on each order so historical estimates do not change when admin edits the catalog.

## 2. Brand, UX and visual direction
Brand name: **رقيم | Raqeem**. Friendly, premium, emotionally resonant for parents; cheerful purple/yellow/pink; clean white/lavender surfaces, rounded cards, subtle doodles, original book mockups. Hero promise: **“مش مجرد كتاب تلوين... طفلك هيبقى بطل القصة!”**.

**Design tokens:** purple `#6324C5`, dark purple `#541CA9`, yellow `#FFC928`, pink `#F65C96`, background `#F8F5FF`, text `#241747`, border `#E8E1F2`; Arabic **Cairo**, English **Nunito**. Responsive targets 1440 / 768 / 390px; desktop max content width 1200px; WCAG 2.2 AA goal. Full specification is in `design.md`.

**Reference usage:** competitor screenshot informs conversion layout (hero/product gallery, offers, trust elements, testimonials, form, sticky CTA) but must not be copied verbatim; no competitor logos/assets or unapproved deposit UI. Generated concept images are visual references, not production-ready assets. Use original, properly licensed, or guardian-consented images. Do not embed generated Arabic lettering in images.

## 3. Information architecture

### 12 public screen designs
| # | Screen | Suggested route | Key content |
|---|---|---|---|
| 1 | Landing | `/ar`, `/en` | hero, gallery, price cards, process, benefits, testimonials, CTAs |
| 2 | About | `/[locale]/about` | brand story, mission, why choose Raqeem |
| 3 | Portfolio | `/[locale]/portfolio` | real/demo filters, transformations |
| 4 | Portfolio detail | `/[locale]/portfolio/[slug]` | photo→cartoon→line art→printed book |
| 5 | How it works | `/[locale]/how-it-works` | request, contact, design, print, ship |
| 6 | Pricing & offers | `/[locale]/pricing` | 12/24 options, quantity discounts, shipping explanation |
| 7 | Order form | `/[locale]/order` | multi-book form, private photo upload, estimate |
| 8 | Order success | `/[locale]/order/success` | request reference, contact-next explanation |
| 9 | FAQ | `/[locale]/faq` | common questions, CMS editable |
| 10 | Contact | `/[locale]/contact` | verified phone/WhatsApp/contact details |
| 11 | Privacy | `/[locale]/privacy` | guardian photo use, retention, rights |
| 12 | Terms | `/[locale]/terms` | request terms, fulfillment, cancellations |

### Homepage sections
1. Announcement bar: personalized books and delivery across Egypt.
2. Sticky nav with logo, links, AR/EN toggle and CTA.
3. Hero: strong Arabic headline, child/book mockups, photo→cartoon visual proof, two CTAs.
4. Product options: 12 pages 250 EGP; 24 pages 350 EGP.
5. Benefits: personal, quality print, fun, convenient, delivered.
6. Four steps: send photo → team contacts → design/print → home delivery.
7. Portfolio: real/demo tags; before/after transformations.
8. Pricing/offers: 2 books 10%, 3+ books 20%.
9. Genuine testimonials only (placeholders clearly marked until supplied).
10. About brand, FAQ preview, final CTA and footer.
11. Mobile sticky request CTA; ensure it does not obscure content.

### Admin views
- `/admin/login` (secure single-admin sign-in)
- `/admin` overview (KPIs, recent requests, trends)
- `/admin/orders` searchable/filterable table
- `/admin/orders/[id]` secure details, private photos, notes, status timeline, WhatsApp/call
- `/admin/portfolio` media and consent management
- `/admin/content` bilingual CMS (copy, images, FAQs, testimonials, SEO)
- `/admin/pricing` book variants
- `/admin/promotions` discount rules
- `/admin/shipping` rates for all governorates
- `/admin/notifications` read/unread, click-through
- `/admin/settings` account, notification preferences, site/contact settings

## 4. Order request form: functional specification
**Each book item**: choose 12 or 24 pages; child name, age, interests/theme, photo, optional notes; support multiple different children/books in one request. Decide operational policy for duplicate copies later, but don't silently treat different children as identical copies.

**Guardian section**: full name, valid Egyptian mobile, optional different WhatsApp number, governorate (all 27), detailed delivery address, optional order notes. Require unchecked guardian consent for child-photo processing and link privacy policy.

**Upload UX**: select/drop image, mobile gallery/camera where available, preview, progress, replace/remove, error/retry. Backend validates actual file signature/MIME, size and authorization; store in private Supabase Storage with random paths. Do not publicly expose originals or put images in analytics.

**Live pricing summary**: per-item page count/price, number of books, subtotal, highest applicable discount, shipping by governorate if configured, total estimated cost; otherwise clearly label shipping pending and display books-only subtotal. Server recalculates all amounts and snapshots the rule on submission.

**Submit**: button **“إرسال الطلب”**; note **“إرسال الطلب مجاني، ومش معناه تأكيد الشراء. فريق رقيم هيتواصل معاك لتأكيد التفاصيل.”** Prevent duplicate submissions, validate inputs, preserve drafts on recoverable errors, return safe request reference. Success: **“تم استلام طلبك بنجاح! هيتواصل معاك فريق رقيم قريبًا لتأكيد التفاصيل والسعر والتوصيل.”** No payment/deposit controls.

## 5. Proposed architecture
```text
Browser (ar/en public site, protected admin)
  ├─ Next.js App Router: SSR/SEO, localized UI, forms
  ├─ Next.js secure server actions / route handlers
  │    ├─ Zod validation, rate limit, pricing engine
  │    ├─ Supabase Postgres (RLS, transactional order writes)
  │    ├─ Supabase Auth (one allowlisted admin)
  │    ├─ Supabase private Storage (child images)
  │    └─ Durable notification outbox
  └─ Admin notification experience
       ├─ DB in-app notifications (+ optional Supabase Realtime)
       ├─ Web Push sender (VAPID) → Service Worker → OS notification
       └─ Resend email alerts
Deployment: Vercel + Supabase
```
Server actions/route handlers must enforce permissions; never trust browser-supplied totals, admin flags or file paths. A worker/cron or reliable background dispatcher processes notification outbox; verify deployment constraints before choosing implementation.

### Suggested repo layout
```text
src/
  app/
    [locale]/(marketing)/...
    [locale]/order/...
    admin/login/...
    admin/(protected)/...
  components/ui/
  components/shared/
  features/orders/
  features/pricing/
  features/portfolio/
  features/content/
  features/notifications/
  lib/supabase/
  lib/i18n/
  lib/security/
  messages/ar.json
  messages/en.json
public/sw.js
supabase/migrations/
tests/
.env.example
GEMINI.md
Plan.md
design.md
```
Adapt to existing repo conventions after inspecting files.

## 6. Database blueprint
| Table | Essential fields / purpose |
|---|---|
| `admin_profiles` | auth user id, allowlisted admin |
| `book_variants` | `page_count` 12/24, active, price |
| `promotions` | min quantity, percent, active, schedule, localized title |
| `governorates` | 27 codes, Arabic/English names, active |
| `shipping_rates` | governorate, nullable price, active |
| `orders` | reference, guardian contact/address, governorate, status, consent time, original price snapshots, shipping estimate, final quote, timestamps |
| `order_items` | order id, child details, page count, private photo path, price snapshot, quantity policy |
| `order_status_events` | old/new status, timestamp, actor, note |
| `portfolio_entries` | bilingual content, media paths, real/demo, consent verified, publish flag |
| `site_content` | key, locale, structured value, update timestamp |
| `site_settings` | key, JSON config |
| `admin_notifications` | type, order id, read time, timestamps |
| `push_subscriptions` | admin id, endpoint, encryption keys, disabled time |
| `notification_outbox` | event key unique, channel, attempts, retry scheduling/status |

Use SQL migrations, foreign keys, constraints, indexes, strict RLS, audit trails and appropriate data retention. Public visitors can create validated requests through secured server paths, but must **not** read other people's orders or uploaded child photos.

## 7. Notifications and service worker
- On successful order creation, persist an in-app notification and outbox event as part of the durable workflow.
- Server sends **Web Push** using VAPID and `web-push` to admin device subscriptions; **Service Worker** receives/displays and handles click navigation.
- Send an admin email through **Resend**, without sensitive details in subject or preview.
- Dashboard notification bell + notification feed + read/unread and optional Realtime.
- Browser push requires HTTPS, permission, compatible environment; iOS Home Screen requirements must be tested. Treat delivery as best-effort; email and in-app are backups.
- Deduplicate events, retry transient failures, deactivate invalid subscriptions, secure subscription endpoints, never embed keys in client bundles.

## 8. Privacy, trust, accessibility and SEO
**Child photo safety:** explicit guardian consent; private storage; short-lived signed URLs for authorized admins; no public display without separately verified publication consent; documented retention/deletion and access requests; secure logging and upload restrictions. Set actual upload limits and retention period only after owner approval.

**Admin security:** Supabase Auth, single allowlisted admin, RLS and server checks, session management, CSRF-aware mutations, rate limits, secrets in server env only, audit trail, backups.

**UX/a11y:** semantic structure, keyboard navigation, focus rings, screen-reader labels, 44px targets, accessible contrast, reduced motion, RTL/LTR parity, mobile no-overflow, useful loading/empty/error/success states.

**SEO:** localized metadata, hreflang/canonical, fast optimized public images, descriptive alt text, truthful structured data, no indexing of admin or private files. Analytics must never include child names/photos/contact information.

## 9. Milestones and build order
All items are initially **not yet verified**; do not mark done until implementation/tests prove them.

### M0 — Repository and foundation
- [x] Audit current repository and existing files, dependencies and git status. *(Verified 2026-11-19: repo started with `GEMINI.md`, `PLAN.md`, `DESIGN.md`; initialized git; confirmed Supabase MCP `raqeem` project `ojdlkoqettqnlluqfnmt` is `ACTIVE_HEALTHY`; recorded Stitch MCP auth blocker below.)*
- [x] Create Next.js App Router + strict TypeScript + Tailwind + shadcn/ui. *(Next.js 16.4.6, React 19, strict TS with `noUncheckedIndexedAccess`, Tailwind CSS v4, shadcn/ui base `Button`, `Badge`, `Card`, `components.json`.)*
- [x] Configure `next-intl`, locale routing, Arabic RTL and English LTR. *(`src/lib/i18n/{routing,navigation,request}.ts`, `src/proxy.ts`, `src/messages/{ar,en}.json`, `/ar` default RTL and `/en` LTR.)*
- [x] Implement design tokens, typography, responsive shell, header/footer. *(`src/app/globals.css`, `Cairo` + `Nunito` via `next/font/google`, `AnnouncementBar`, `SiteHeader`, `LanguageSwitcher`, `SiteFooter`, responsive foundation landing page.)*
- [x] Create `.env.example`, lint/typecheck/test scripts, initial CI. *(`.env.example`, ESLint 9 flat config, Vitest + Testing Library `tests/foundation.test.tsx`, `.github/workflows/ci.yml`.)*
- [x] Create Supabase client/server helpers and SQL migration workflow. *(`src/lib/env.ts`, `src/lib/supabase/{client,server}.ts`, `supabase/migrations/README.md`.)*
**Acceptance:** both locales render (`/ar` and `/en` statically built), no leaked secrets, `npm run lint`, `npm run typecheck`, `npm test` (4/4), and `npm run build` all pass.

> **Stitch MCP connected (2026-11-19):** Verified connectivity to Google Stitch project **`Raqeem Coloring Books Platform`** (`projects/14364235548691248844`) with 7 design screens, 6 image assets (including `Logo Raqeem.png` and `Hero Photo.png`), and `design.md`.

### M1 — Database, auth and privacy baseline
- [x] Seed 12/24 variants (250/350 EGP) and offers (2→10%, 3+→20%). *(Verified in `public.book_prices` / `public.book_variants` and `public.discount_rules` / `public.promotions` on Supabase project `ojdlkoqettqnlluqfnmt`.)*
- [x] Seed 27 governorates, leave shipping prices unknown until entered. *(Verified all 27 Egyptian governorates in `public.shipping_rates` / `public.governorates` with Arabic + English names and `fee_piastres = NULL`.)*
- [x] Create orders/items, CMS, portfolio, notification tables and indexes. *(Verified `orders`, `order_items`, `order_status_events`, `portfolio` / `portfolio_entries`, `site_content`, `site_settings`, `admin_notifications`, `notification_outbox`, `push_subscriptions`, `notification_jobs`, and FK/query indexes.)*
- [x] Enforce RLS, one admin allowlist and private image storage. *(Verified `public.admin_account` singleton + `private.is_admin()` / `public.is_project_admin()`, private `child-photos` bucket `public=false`, 2MB limit, `image/jpeg|png|webp`, and `src/lib/security/admin-auth.ts`.)*
- [x] Add server-side validation, anti-spam/rate limiting and guardian consent. *(Implemented `src/lib/security/upload-validation.ts` with magic-byte verification, `src/lib/security/rate-limit.ts` sliding-window + honeypot, and `src/lib/validation/order-request.ts` enforcing explicit `consentAccepted: true`.)*
**Acceptance:** unauthorized reads/writes blocked; public uploads not accessible by URL; seeds correct. *(Verified via live Supabase + unit test suite in `tests/m1-database-security.test.ts` — 18/18 tests passing.)*

### M2 — Public UI and CMS
- [x] Homepage hero, product gallery, benefits, process, portfolio, prices, offers and CTAs. *(Implemented from Stitch Desktop `839b7fc5304a440680ebbf420a5f2b5d` & Mobile `b2d653310f034cb98b980d8d79e9b71d` in `src/app/[locale]/page.tsx`, `HeroInteractiveSection`, `PortfolioFilterGrid`, and `FaqAccordion` with official Stitch assets in `public/images/`.)*
- [x] About, portfolio list/detail, how-it-works, pricing, FAQ, contact, privacy, terms. *(All 12 public routes implemented under `src/app/[locale]/` for both `/ar` and `/en`.)*
- [x] Bilingual CMS editing for text/images/SEO; real/demo labels. *(`src/features/content/cms-data.ts` and `src/features/portfolio/portfolio-data.ts` fetch live data from Supabase `book_variants`, `promotions`, `governorates`, `portfolio_entries`, `site_content`, `site_settings` with explicit real/demo badges.)*
- [x] Mobile/tablet/desktop and English LTR variants. *(Responsive 390/768/1440px grids, mobile sticky CTA bar, and full Arabic RTL / English LTR parity verified in `tests/m2-public-ui-cms.test.tsx`.)*
**Acceptance:** matches `design.md`, all CTAs route correctly, no fabricated reviews, CMS changes publish without redeploy. *(Verified: 22/22 tests pass, `next build` builds all 28 localized routes cleanly.)*

### M3 — Order form and pricing
- [x] Multi-book selection, child details, private photo upload. *(Implemented in `src/features/orders/order-request-form.tsx` and `src/features/orders/actions.ts` `uploadChildPhotoAction` with repeatable child book configurator, theme chips, identical-copies stepper, and magic-byte verified private storage upload to `child-photos`.)*
- [x] Guardian contact/address/governorate and explicit consent. *(All 27 Egyptian governorates, Egyptian mobile normalization/validation, optional WhatsApp, detailed address, unchecked-by-default guardian consent checkbox, and anti-spam honeypot.)*
- [x] Shared pricing engine and dynamic estimate/discount/shipping. *(Implemented in `src/features/pricing/pricing-engine.ts` using exact integer piastres; handles mixed 12/24 variants, 1/2/3/4+ book tiers, non-stacking highest qualifying discount, and nullable `pending_confirmation` vs `known` governorate shipping.)*
- [x] Server-side transactional order creation with price snapshots and idempotency. *(Implemented via `submitOrderRequestAction` + atomic Postgres RPC `public.submit_order_request` in `supabase/migrations/20261119183000_m3_transactional_order_submission.sql` writing `orders`, `order_items`, `order_status_events`, `admin_notifications`, and `notification_outbox` with `idempotency_key` deduplication.)*
- [x] Success state with safe reference and no payment. *(Implemented in `src/app/[locale]/order/success/page.tsx` displaying safe non-PII `RQM-XXXXXXXX` reference and 3-step contact/production/delivery explanation.)*
**Acceptance:** pricing tests cover mixed variants and 1/2/3/4+ books; unknown shipping labeled pending; no duplicate orders; private photos secured. *(Verified in `tests/m3-order-pricing.test.tsx` — 29/29 total tests passing across 4 test files.)*

### M4 — Admin operations
- [x] Secure admin login and protected dashboard. *(Implemented Stitch-aligned split login at `src/app/admin/login/page.tsx` + `src/features/admin/admin-login-form.tsx`, protected layout `src/app/admin/(protected)/layout.tsx`, and RTL right-sidebar shell `src/components/admin/admin-shell.tsx` enforcing `verifyAdminAccess` / `requireAdminAccess` + database `is_project_admin()`.)*
- [x] Orders list, filters, detail, WhatsApp/call actions, status history and notes. *(Implemented Overview `src/app/admin/(protected)/page.tsx`, Orders table & filters `src/app/admin/(protected)/orders/page.tsx`, and Order Detail `src/app/admin/(protected)/orders/[id]/page.tsx` with 10-minute signed URLs for private `child-photos`, click-to-WhatsApp/call, 9-stage lifecycle selector, confirmed shipping/quote inputs, internal notes, and `order_status_events` audit timeline.)*
- [x] Portfolio manager, bilingual content editor. *(Implemented `src/app/admin/(protected)/portfolio/page.tsx` enforcing `guardian_consent_verified` for real `'authorized'` work, and `src/app/admin/(protected)/content/page.tsx` for bilingual AR/EN CMS editing.)*
- [x] Pricing, promotion and governorate shipping editors. *(Implemented `src/app/admin/(protected)/pricing/page.tsx`, `src/app/admin/(protected)/promotions/page.tsx`, and `src/app/admin/(protected)/shipping/page.tsx` for all 27 Egyptian governorates with nullable "confirmed after contact" shipping support.)*
- [x] Admin settings, empty/error/loading states. *(Implemented `src/app/admin/(protected)/notifications/page.tsx` and `src/app/admin/(protected)/settings/page.tsx`.)*
**Acceptance:** one admin can manage entire workflow; changes persist; unauthorized users cannot access data. *(Verified in `tests/m4-admin-operations.test.tsx` — 34/34 total tests passing across 5 test files; all 38 routes build cleanly.)*

### M5 — Notifications / PWA
- [x] Service Worker + PWA manifest where appropriate. *(Implemented `public/sw.js` handling `push` + `notificationclick` -> `/admin/orders/[id]` and `public/manifest.webmanifest` linked from `src/app/admin/layout.tsx` with Apple Web App PWA meta tags.)*
- [x] Opt-in push subscription management and VAPID backend. *(Implemented explicit user-click `PushSubscriptionCard` in `src/features/notifications/push-subscription-card.tsx`, `src/features/notifications/actions.ts`, and `web-push` VAPID delivery with automatic 404/410 expired-subscription pruning.)*
- [x] Durable in-app notifications and outbox dispatcher. *(Implemented `src/features/notifications/dispatcher.ts`, `src/features/notifications/payload.ts`, `src/app/api/admin/notifications/dispatch/route.ts`, and migration `supabase/migrations/20261119231000_m5_notifications_outbox_admin_policy.sql`, wired into `submitOrderRequestAction` and `/admin/notifications`.)*
- [x] Resend email alerts, retry/duplicate protection. *(Implemented PII-free bilingual Resend HTML/text email alerts, exponential backoff retries up to `MAX_OUTBOX_ATTEMPTS`, and already-sent idempotency skipping.)*
- [x] Test push click routing, permission denied, expired subscription and fallback. *(Verified in `tests/m5-notifications-pwa.test.tsx` — 7/7 tests passing, `lint` 0 errors, `typecheck` 0 errors, and `next build` passing.)*
**Acceptance:** new request creates in-app notification and triggers best-effort push/email; no sensitive data in previews. *(Verified.)*

### M6 — QA, launch and handoff
- [x] Unit/integration tests for pricing, auth, upload, CMS, notifications. *(46/46 tests across 7 test suites `tests/foundation.test.tsx`, `m1`–`m6` covering pricing, RLS, magic-byte uploads, CMS, admin auth, notifications/PWA, and SEO.)*
- [x] E2E visitor request and admin fulfillment scenarios. *(Verified transactional `submit_order_request` RPC with idempotency, multi-child UI flow, and admin fulfillment/notification pipeline.)*
- [x] WCAG/RTL/LTR/responsive review; performance and SEO checks. *(Added `src/app/robots.ts` blocking `/admin` & `/api/`, bilingual `src/app/sitemap.ts`, client-side WebP/JPEG image compression with EXIF stripping, and Admin-Only installable PWA scoped strictly to `/admin` with 192×192 & 512×512 icons.)*
- [x] Privacy/terms review, retention policy, backups and monitoring. *(Documented in `docs/LAUNCH_AND_HANDOFF_GUIDE.md`; private `child-photos` bucket, 10-min signed URLs, PII-free push/email notifications, guardian consent enforced.)*
- [x] Vercel/Supabase production env, migrations, deployment and rollback guide. *(Completed in `docs/LAUNCH_AND_HANDOFF_GUIDE.md`.)*
- [x] Owner walkthrough for editing prices, offers, shipping and content. *(Arabic owner guide included in `docs/LAUNCH_AND_HANDOFF_GUIDE.md`.)*
**Acceptance:** build/tests pass; secrets safe; launch checklist signed off by owner. *(All automated checks verified; awaiting final owner sign-off and production Vercel deployment.)*

## 10. Critical test matrix
1. 12 pages = 250; 24 pages = 350.
2. Two books = 10% off subtotal; three/four books = 20%; mixed variants correct.
3. No discount on shipping; nullable shipping never displayed as free.
4. Admin price/promotion changes affect new quotes, not historical order snapshots.
5. Multiple children each retain own image and configuration.
6. Invalid/oversized/spoofed file rejected; unauthorized image read denied.
7. Request double-click/network retry does not duplicate order or notifications.
8. Only allowlisted admin can view/edit orders, CMS and pricing.
9. RTL Arabic and LTR English remain usable at 390/768/1440px.
10. Web Push denied/offline/expired still leaves persistent in-app alert; email attempts retried.
11. Real gallery items require consent; demo items visibly labeled.
12. No deposit selector, payment form or checkout appears anywhere.

## 11. Decisions pending owner input
- Official logo, final approved images, real testimonials and publishing permissions.
- Exact shipping rates for 27 governorates; remote-area rules.
- Accepted image formats, maximum file size, retention/deletion timeline.
- Physical book dimensions, binding, printing definition of 12/24 pages.
- WhatsApp/phone/email/domain/social URLs.
- Exact policy for identical copies vs separate personalized book configurations.
- Contact response time, production/delivery estimates.
- Legal privacy/terms, cancellation/refund rules and any **offline** deposit process.
- Supabase, Vercel, Resend, VAPID credentials (must remain private).

## 12. Antigravity starting instruction
1. Read `GEMINI.md`, `Plan.md`, `design.md` and inspect existing project.
2. Identify already implemented features; do not reset or overwrite them.
3. Execute **M0** first, verify checks, and update checkboxes with actual evidence.
4. Continue milestone by milestone, keeping UI/DB/security consistent.
5. Report changes, tests run, blockers and next steps; never claim an unverified feature works.

**Definition of success:** a polished bilingual Raqeem website that accurately explains personalized printed books, captures secure requests, lets one admin manage content/pricing/orders/shipping, and delivers new-order notifications through dashboard, browser push and email—without collecting payment online.

## 13. Existing Stitch project → Antigravity implementation (mandatory)
The frontend UI/UX already exists as a **Google Stitch project** and must be consumed using **Stitch MCP**, not redesigned independently in Antigravity. Project identifier/URL has not yet been supplied in this chat; request it or discover it through the connected MCP, never guess.

### Stitch integration gate (before frontend M2/M3/M4 screens)
- [x] Configure and verify Stitch MCP connectivity inside Antigravity. *(Verified 2026-11-19 via `StitchMCP` `list_projects` and `list_screens`.)*
- [x] Identify and confirm the existing Raqeem Stitch project. *(Confirmed `projects/14364235548691248844` — "Raqeem Coloring Books Platform".)*
- [x] Inventory screens, variants, mobile/desktop layouts, components, typography, colors and assets. *(Inventoried 7 design screens + 6 image assets + `design.md`.)*
- [x] Retrieve supported design/code/assets and create a screen-to-route mapping. *(Downloaded Desktop/Mobile HTML + `logo-raqeem.png`, `hero-photo.png`, `hero-child-coloring-1.png`, `hero-child-coloring-2.png` to `public/images/`.)*
- [x] Identify any design gaps or obsolete business behavior and reconcile with `GEMINI.md` and this plan. *(Reconciled: removed unapproved mobile sticky 290 EGP / 35–65 EGP shipping range in favor of 250/350 EGP + "confirmed after contact"; excluded customer sign-up gate; added explicit demo/preview badges on default samples/testimonials.)*
- [x] Implement Stitch-derived UI as maintainable Next.js components using Tailwind/shadcn/ui, with correct Arabic RTL/English LTR. *(Completed for M2 public screens; M3 order form & M4 admin dashboard next.)*
- [x] Connect frontend to Supabase, order form, pricing rules, CMS, admin and notifications. *(Completed across M2–M5.)*
- [ ] Perform side-by-side visual QA against Stitch screenshots at 1440px, 768px and 390px.

**Stop condition:** If Stitch MCP cannot access the project, report the missing connection/project ID and do not fabricate a design or claim visual fidelity. Stitch-generated code must still pass security, accessibility, responsiveness and build checks. Existing approved business rules override outdated UI, especially any online deposit/payment elements.

---

## 14. v2 Product Expansion Roadmap (Phases 1–7 — Approved 2026-11-20)
> Explicit owner-approved roadmap building on the live M0–M6 platform. Executed strictly one phase at a time with DB migrations, Admin CMS controls, Public UI, and verification before advancing.

### Phase 1 (P1) — Motion, Navbar Active State, Brand WhatsApp & Unified Toast System
- **Scope:** Scroll-reveal animations (staggered, once-per-entry, `prefers-reduced-motion` safe) + modal open/close transitions; proper WhatsApp SVG icon + accessible label in Navbar; unified single-source-of-truth brand WhatsApp (`01038639918` / `https://wa.me/201038639918`) across Navbar, Footer, Contact, Packages, and CMS defaults (independent of customer order phones); dynamic Navbar active state for routes AND homepage scroll sections (including direct hash loads and browser back/forward, removing hardcoded active styling from "الرئيسية"); unified Toast system (`ToastProvider`) for public site (form validation errors + focus/scroll to first invalid field) and Admin Dashboard (realtime/polling toast once per newly arrived order, never re-firing for old orders on reload).
- **DB Changes:** Update default `site_settings` (`key = 'contact'`) seed/fallback to `01038639918`.
- **Acceptance:** Test Navbar links + mobile scroll active states; submit incomplete form from bottom of page and verify visible Toast + focus jump to first invalid field; open Admin Dashboard and submit a new order from another tab and verify one-time Toast.
- **Tasks:**
  - [x] Create centralized brand config (`src/lib/brand.ts`) with WhatsApp `01038639918` + `https://wa.me/201038639918` and unified SLA `"مدة التنفيذ والتوصيل من 5 إلى 7 أيام"`.
  - [x] Create `ScrollReveal` motion helper & CSS keyframes with `prefers-reduced-motion` support + modal transition classes.
  - [x] Create unified `ToastProvider` + `useToast()` mounted in both `[locale]/layout.tsx` and `admin/(protected)/layout.tsx` + `AdminNewOrderToastWatcher`.
  - [x] Upgrade `SiteHeader` (WhatsApp SVG icon, dynamic route + IntersectionObserver section active state, remove fixed active state from Home) and `SiteFooter` (unified WhatsApp).
  - [x] Wire `OrderRequestForm` validation errors to Toast + auto-focus/scroll to first missing field.

### Phase 2 (P2) — Hero Image CMS Upload & Single-Card Case Study Portfolio Popup
- **Scope:** Admin CMS upload/preview/replace for homepage Hero image (stored in public `site-media` bucket, falling back to current `/images/stitch/hero-main.png`); redesign Portfolio section from 3-image strips into single-image story cards (1 uploaded image + title + short summary) that open an animated accessible Case Study Popup (`Escape`, close button, focus restoration) showing 3 admin-editable fields: hero interests, how we turned them into a story idea, and how they became the hero; remove public text `"تمت الموافقة من والد الطفل"` from visitor UI while keeping strict separation between private `child-photos` and public `site-media` portfolio uploads.
- **DB Changes:** Additive migration `v2_p2_hero_and_portfolio_case_study`: create public storage bucket `site-media` (admin-only write, public read), add `short_summary_ar/en`, `story_interests_ar/en`, `story_idea_ar/en`, `story_hero_ar/en` columns to `public.portfolio` and expose in `public.portfolio_entries`.
- **Acceptance:** Upload a new Hero image in Admin CMS, add a portfolio story card with case study fields, open it on mobile and verify popup displays the exact selected story and restores focus on close.
- **Tasks:**
  - [x] Apply migration `v2_p2_hero_and_portfolio_case_study` (`site-media` bucket + portfolio case-study columns).
  - [x] Add Admin Hero image upload/preview/replace in `/admin/content` + render live Hero image on homepage.
  - [x] Upgrade `/admin/portfolio` to upload single cover image + manage title, short summary, 3 case-study fields, and publish/hide toggle.
  - [x] Redesign public `PortfolioFilterGrid` into single-image cards + animated accessible Case Study Popup (and remove public consent badge text from visitor cards).

### Phase 3 (P3) — Packages, Free 12-Color Gift, Corporate Package & Unified SLA
- **Scope:** Keep 12-page & 24-page individual packages synced with live Admin DB prices; add clear gift line `"علبة ألوان 12 لون هدية مع الأوردر"` (1 per order, never multiplied per book); add 3rd card `"باقة المؤسسات"` (min 10 books, custom discount agreed with sales, NO invented price/percentage, CTA `"تواصل مع فريق المبيعات"` opening Raqeem WhatsApp `201038639918` with prefilled message); unify delivery timeline wording everywhere to `"مدة التنفيذ والتوصيل من 5 إلى 7 أيام"`.
- **DB Changes:** None required (reads live `book_variants` and `promotions`).
- **Acceptance:** Three packages render cleanly; individual prices match Admin Dashboard; Corporate package shows min 10 books and opens `https://wa.me/201038639918` with prefilled inquiry text; 5–7 days SLA consistent across pages.
- **Tasks:**
  - [x] Update homepage pricing section & `/[locale]/pricing` with gift line, Corporate package card, and 5–7 days SLA.
  - [x] Unify `"مدة التنفيذ والتوصيل من 5 إلى 7 أيام"` across FAQ, How It Works, Order Form, and Success page.

### Phase 4 (P4) — "اطلب كتابك الآن", Adult Age (>18), Mandatory Deposit (100/200/300 EGP) & Admin Receipt Confirmation
- **Scope:** Rename order section to `"اطلب كتابك الآن"`; update labels to fit ordering for oneself or someone else; support existing ages plus `"أكبر من 18 سنة"`; add mandatory horizontal pill selector `"اختار قيمة الديبوزت"` (`100` / `200` / `300` EGP, dark active pill + light bordered inactive pills, touch & keyboard accessible, showing selected amount); disclose before submit that deposit is required before production and SLA is 5–7 days; validate deposit server-side in piastres (reject deposit > books total so remaining balance is never negative); snapshot `deposit_selected_piastres` separately from `deposit_status` (`pending` / `received` / `not_specified`) and `deposit_received_at`; add manual Admin "تأكيد استلام الديبوزت" control in `/admin/orders/[id]`; display deposit & receipt status in Admin Order Detail and Admin Email (keeping lock-screen Web Push PII-free); legacy orders display `"لم يُحدد"`.
- **DB Changes:** Additive migration `v2_p4_orders_deposit_and_adult_age`: allow `child_age` up to `99` (with `age_label` / `19+` support for `"أكبر من 18 سنة"`), add `deposit_selected_piastres integer`, `deposit_status text default 'not_specified'`, `deposit_received_at timestamptz` to `public.orders`, update `submit_order_request` RPC to validate and snapshot deposit in piastres.
- **Acceptance:** Submit an order for `"أكبر من 18 سنة"` with 200 EGP deposit; verify 200 EGP appears in Admin Dashboard & Admin Email as pending receipt until manually confirmed by Admin; test deposit > books total rejection and unknown shipping handling.
- **Tasks:**
  - [x] Apply migration `v2_p4_orders_deposit_and_adult_age`.
  - [x] Update validation schema, pricing engine, and `submitOrderRequestAction` for adult age + deposit piastres validation.
  - [x] Upgrade `OrderRequestForm` ("اطلب كتابك الآن", inclusive labels, >18 option, 100/200/300 deposit selector pills, remaining balance calculation, SLA disclosure).
  - [x] Update `/admin/orders/[id]` (deposit display, manual "تأكيد استلام الديبوزت" action, legacy `"لم يُحدد"` handling) and Admin Email payload.

### Phase 5 (P5) — Customer Reviews Carousel, Visitor Submission & Admin Moderation
- **Scope:** Responsive auto-advancing Reviews Carousel with pagination dots (pauses on interaction and with `prefers-reduced-motion`; hides dots/autoplay when <= 1 review); `"قول رأيك في الكتاب"` button opening animated Popup (`name`, `age`, `comment`, `rating 1–5`, no photo upload); deterministic sequential assignment of 3 Raqeem illustration avatars persisted per review; Toast `"وصل رأيك وهو قيد المراجعة"` on submit; saved with `status = 'pending'` (hidden from public until Admin approves); new `/admin/reviews` dashboard section to list pending/approved/hidden reviews, edit text, approve, reject, or hide (enforced server-side and via RLS).
- **DB Changes:** Additive migration `v2_p5_customer_reviews`: create `public.customer_reviews` (`id`, `reviewer_name`, `reviewer_age`, `rating`, `comment`, `avatar_index`, `status`, `created_at`, `approved_at`) with RLS (public SELECT only `status = 'approved'`, public INSERT restricted to `status = 'pending'`, Admin full access).
- **Acceptance:** Submit a visitor review, verify it is hidden publicly and shows pending toast; edit and approve it in `/admin/reviews`, verify it appears in public Carousel with approved text and persistent avatar.
- **Tasks:**
  - [x] Apply migration `v2_p5_customer_reviews`.
  - [x] Build public `ReviewsCarouselSection` + `"قول رأيك في الكتاب"` modal + `submitCustomerReviewAction` (rate-limited, sequential avatar).
  - [x] Build `/admin/reviews` moderation view + add to `AdminShell` navigation.

### Phase 6 (P6) — Social Media CMS & Promotional Poster Popup
- **Scope:** Replace homepage `"جاهز لتصنع لطفلك مفاجأة"` CTA section with `"تابعونا على صفحات السوشيال ميديا"` supporting Facebook, Instagram, WhatsApp (`201038639918`), TikTok, and custom admin-added platforms (never inventing links — only active platforms with valid URLs render); add `/admin/social` management view (add/edit/toggle visibility/delete platforms); add Promotional Poster Popup (`site_settings` key `poster_popup`) configurable in `/admin/content` or `/admin/social` (upload poster image to `site-media`, preview, button label, target URL, active toggle); easy mobile close, shows once per browser session (`sessionStorage`), never opens empty when disabled or missing valid image, server-validated URLs.
- **DB Changes:** Additive migration `v2_p6_social_links`: create `public.social_links` (`id`, `platform`, `label_ar`, `label_en`, `url`, `icon_key`, `active`, `sort_order`) with RLS (public read active, admin full write) and seed WhatsApp (`https://wa.me/201038639918`) active + Facebook/Instagram/TikTok inactive (no invented URLs).
- **Acceptance:** Hide a platform and verify it disappears; upload Poster image + edit button text/URL and verify once-per-session popup; disable Poster and verify it does not open in a new session.
- **Tasks:**
  - [x] Apply migration `v2_p6_social_links`.
  - [x] Build `/admin/social` (Social Links CRUD + Poster Popup manager with image upload/preview/toggle).
  - [x] Build public `SocialFollowSection` (replacing final CTA section) and `PromotionalPosterPopup`.

### Phase 7 (P7) — Public Order Tracking Page (`/track`)
- **Scope:** Replace `"كيف نعمل؟"` link in Navbar with `"تتبّع طلبك"` linking to `/[locale]/track` (keep `/how-it-works` page intact); visitor enters non-guessable tracking reference (`RQM-XXXXXXXX`) copied from order success screen; rate-limited server lookup returning ONLY `{ reference, lifecycleStage, createdAt, updatedAt }` (zero names, phones, addresses, photos, or financials); clear stage progress tracker (`تم استلام الطلب` → `تم التأكيد` → `طباعة وتجليد` → `تم التوصيل`) handling cancelled, on-hold, and legacy orders; reminder of `"مدة التنفيذ والتوصيل من 5 إلى 7 أيام"` and `"مع كل أوردر علبة ألوان 12 لون هدية"`; friendly not-found/invalid message; copyable tracking reference button on `/[locale]/order/success`.
- **DB Changes:** Additive migration `v2_p7_public_order_tracking_rpc`: create `public.lookup_order_tracking_status(p_reference text)` `SECURITY DEFINER` returning ONLY `reference`, `lifecycle_stage`, `status`, `created_at`, `updated_at` (never any PII or financial column).
- **Acceptance:** Create test order, copy reference from success screen, search as visitor on `/ar/track`, change status in Admin Dashboard, and confirm `/ar/track` reflects the updated stage with zero customer PII exposed.
- **Tasks:**
  - [x] Apply migration `v2_p7_public_order_tracking_rpc`.
  - [x] Update `SiteHeader` Navbar (replace `"كيف نعمل؟"` with `"تتبّع طلبك"` -> `/track`) and enhance `/order/success` with one-click copy reference + direct track link.
  - [x] Build `/[locale]/track` page + rate-limited server action + stage timeline UI.
  - [x] Run full QA (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) and update `PLAN.md`.
