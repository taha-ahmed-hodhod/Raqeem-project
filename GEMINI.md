# GEMINI.md — Raqeem / رقيم
> Agent operating manual for Google Antigravity. Version 1.0 — 2026-11-19.
> Read this file, `Plan.md`, and `design.md` before changing code. `Plan.md` is the execution roadmap; `design.md` is the UI/UX specification.

## 1. Mission and immutable business facts
Build **Raqeem | رقيم**, an Arabic-first (RTL) and English (LTR) website and single-admin operations dashboard for **personalized PHYSICALLY PRINTED children's coloring books in Egypt**. A guardian uploads a child's photograph; the Raqeem team manually turns the child's likeness into a cartoon, makes coloring scenes, prints the finished book and delivers it. The website **captures a request, not a completed purchase**. After submission, staff contact the customer via **WhatsApp and/or phone** to confirm details, final price, shipping and any offline payment arrangements.

**DO NOT add:** checkout, online payment, deposit selection, deposit payment, receipt upload, Pay Now, customer account requirements, auto-generated AI artwork, courier integrations or multiple admin roles without explicit approval. The competitor screenshot showed a deposit feature, but the latest approved user decision explicitly removes it from the customer experience. Competitor screenshots are *inspiration*, not a license to copy.

## 2. Approved commercial policy
| Book | Initial price |
|---|---:|
| 12 coloring pages | EGP 250 |
| 24 coloring pages | EGP 350 |

- **2 books:** 10% off total book subtotal.
- **3 or more books:** 20% off total book subtotal (until user changes rule).
- Highest qualifying discount only; **no stacking**; shipping is never discounted.
- Mixed 12-/24-page books count together for quantity discounts.
- Shipping price varies by **Egyptian governorate** (27 options); do not invent rates. Unknown rate = “confirmed after contact,” not EGP 0.
- All book prices, discount thresholds/rates/active flags, shipping rates, offers, and public content must be editable by the admin without code changes.
- Calculate estimates on client for UX, but **recalculate and snapshot server-side** on submission. Use exact decimal or integer minor units.
- Example: 2×12-page books = 500 − 50 discount = 450 EGP **before shipping**; 3×24-page = 1050 − 210 = 840 EGP **before shipping**.
- Request submission is free and does not confirm a sale or payment.

## 3. Users and journeys
**Visitor/guardian:** see brand and transformation (photo → cartoon → black-and-white coloring pages → printed book); browse portfolio and reviews; choose page count and multiple books; provide each child's name, age, interests, photo, notes; provide guardian name, Egyptian mobile, optional separate WhatsApp, governorate, full address, general notes; accept photo-processing/privacy consent; view estimated book total, discount and shipping status; submit; see request reference and contact-soon success state.

**Administrator (ONE account):** authenticate; see dashboard metrics and new requests; contact guardian via WhatsApp/call; inspect private child images; update order statuses and notes; manage pricing, offers, shipping, bilingual content, portfolio, FAQs, banners and testimonials; receive in-app, Web Push and email notifications.

**Lifecycle:** `new → contacted → confirmed → designing → printing → shipped → delivered`; plus `on_hold` and `cancelled`. Record status changes, actor and time. Order/payment status must not be conflated.

## 4. Approved stack
- Next.js App Router, React, **strict TypeScript**
- Tailwind CSS, shadcn/ui, selective Motion animations
- `next-intl` (Arabic default / RTL, English / LTR)
- React Hook Form + Zod for forms; server-side Zod revalidation
- Supabase PostgreSQL, Supabase Auth (one allowlisted admin), **private Supabase Storage**, RLS, optional Realtime
- Next.js Server Actions / Route Handlers for secure server mutations
- Native Service Worker (`public/sw.js`) + Push API + VAPID + `web-push` for admin browser notifications
- Resend for admin email notifications; persistent DB notifications + outbox/retry
- Vercel deployment; optional privacy-respecting analytics/error monitoring

Do not introduce a separate Express/Nest server or payment gateway in v1. Avoid exposing secrets in browser code.

## 5. Design contract
Brand: cheerful, trustworthy, premium, kid-friendly; purple/yellow/pink with clean white/lavender backgrounds, rounded cards, gentle illustrations, high-quality physical book mockups. **Do not ship AI-rendered Arabic text baked into images**; render copy in UI.

| Token | Value |
|---|---|
| primary | `#6324C5` |
| primary-dark | `#541CA9` |
| primary-deep | `#43158C` |
| primary-light | `#F3EAFF` |
| yellow | `#FFC928` |
| pink | `#F65C96` |
| background | `#F8F5FF` |
| surface | `#FFFFFF` |
| text | `#241747` |
| muted-text | `#625B75` |
| border | `#E8E1F2` |
| success / warning / error / info | `#16875D` / `#B76B00` / `#D92D4B` / `#2563EB` |

Arabic font **Cairo**; English **Nunito**. Desktop max content width 1200px; 12/8/4 column desktop/tablet/mobile grid; 4px spacing scale; 12–32px corner radii; 44px minimum touch targets; responsive targets 1440px, 768px, 390px. Aim WCAG 2.2 AA. Full localization includes metadata, validation, alt text, status labels, prices and navigation; never merely flip CSS without testing directional elements. See `design.md` for full typography, layout and copy.

## 6. Public pages (12 design screens)
1. Home / landing (`/[locale]`)
2. About (`/[locale]/about`)
3. Portfolio gallery (`/[locale]/portfolio`)
4. Portfolio case study / before-after (`/[locale]/portfolio/[slug]`)
5. How it works (`/[locale]/how-it-works`)
6. Pricing & offers (`/[locale]/pricing`)
7. Order request (`/[locale]/order`)
8. Request success (`/[locale]/order/success`, safe non-PII reference)
9. FAQ (`/[locale]/faq`)
10. Contact (`/[locale]/contact`)
11. Privacy (`/[locale]/privacy`)
12. Terms (`/[locale]/terms`)

**Homepage sections:** announcement bar; nav/logo/AR-EN toggle; emotional hero (“مش مجرد كتاب تلوين... طفلك هيبقى بطل القصة!”); physical book gallery; 12/24-page choice; benefits; four-step process; before/after gallery (real vs demo labels); prices/quantity offers; verified reviews; about; final CTA; footer. Mobile sticky request CTA. No fake reviews, urgency, claims or shipping fees.

**Order form:** repeatable book entries (one per personalized configuration) with page choice, child's details, upload/preview/remove/progress; optionally support identical copies distinctly from different children, without losing correct quantity totals. Parent contact, all 27 governorates, address, notes, explicit unchecked guardian consent. Dynamic, accessible order summary with discounts and conditional shipping. Submit button **“إرسال الطلب”**, not Pay Now. Helper: “إرسال الطلب مجاني، ومش معناه تأكيد الشراء. فريق رقيم هيتواصل معاك لتأكيد التفاصيل.” Success: “تم استلام طلبك بنجاح! هيتواصل معاك فريق رقيم قريبًا لتأكيد التفاصيل والسعر والتوصيل.”

## 7. Admin views
Overview, orders list, order detail, portfolio manager, bilingual content/CMS, pricing and promotions, governorate shipping, notification center, settings; add secure login. Right-side desktop sidebar in RTL, mobile drawer. Admin edits home copy/images, FAQs, testimonials, portfolio, banners, SEO text, prices, promotions and shipping. Admin-only access enforced server-side AND by database policies, not just UI hiding.

## 8. Notifications (critical)
1. Validate request and private uploads; commit order, items, in-app notification and outbox event durably.
2. Dispatch server-side Web Push and email with retry/idempotency; no guarantee that browser push always arrives.
3. Service Worker receives push, displays notification, and opens protected order detail on click.
4. Persist in-app notifications and optionally stream updates via Supabase Realtime.
5. Require explicit user action to ask push permission; HTTPS, browser/OS restrictions apply; iOS web push generally requires Home Screen web app installation.
6. Do not put child photos, full names, addresses or phone numbers in notification payload/preview.
7. Handle revoked permissions, expired subscriptions, failures, duplicates and notification click routing.

## 9. Data model and access control
Migrations should cover:
- `admin_profiles`
- `book_variants` (12/24, price, active)
- `promotions` (min quantity, percentage, enabled, schedule)
- `governorates` (27 bilingual records)
- `shipping_rates` (nullable pending rate)
- `orders` (reference, guardian/delivery data, pricing snapshot, consent, status, timestamps)
- `order_items` (child-specific configuration and **private** photo path)
- `order_status_events`
- `portfolio_entries` (real/demo and guardian publishing consent)
- `site_content` (key + locale + structured value)
- `site_settings`
- `admin_notifications`
- `push_subscriptions`
- `notification_outbox` (unique event key, attempts, retry status)

**Security requirements:** RLS deny-by-default, server-only privileged keys, admin allowlist, private image bucket, signed short-lived URLs for authorized admin, guardian consent, upload type/size/signature validation, random paths, rate limiting and spam protection, no public child photos without explicit guardian publishing consent, defined retention/deletion process, sanitized logs, no child PII in analytics. Admin access checks must run on every protected server operation. Avoid exposing public order details via guessable references.

## 10. Engineering standards for Antigravity
- Before implementation: inspect repository, current migrations and files; summarize what exists, what is missing, and the smallest next milestone. Never overwrite user work blindly.
- Implement in **small vertical slices** with working checks, not giant untested batches.
- Keep UI/components/domain logic separate. Suggested `src/features/{orders,pricing,portfolio,content,notifications}`, `src/components/ui`, `src/lib/{supabase,i18n,validation}`, `src/app/[locale]`, `src/app/admin`, `supabase/migrations`.
- Prefer server components by default; client components only when needed.
- Centralize tokens and localization; no duplicated business pricing constants outside seed/default migrations and tests.
- Use strict types; no `any` without a documented reason; Zod at trust boundaries.
- Add tests for pricing/discounts, shipping unknown state, mixed books, unauthorized admin access, duplicate submissions, image upload validation and notification outbox behavior.
- Run lint, typecheck, tests and build where possible; report failures accurately and do not claim success without verification.
- Never invent real customer data, reviews, logo assets, shipping rates, legal policy, phone number or credentials. Use labeled placeholders.
- Keep `.env.example` with placeholders only; never commit secrets.
- Record decisions, tradeoffs and outstanding blockers in `Plan.md`; update progress checklist after each milestone.
- Ask for approval before changing product policy, public payment flow or privacy-sensitive retention rules.

## 11. Source precedence and conflict resolution
1. Latest explicit user decisions.
2. This `GEMINI.md` and `Plan.md`.
3. `design.md` for design details.
4. Existing `plan.md` and `AGENTS.md` for additional compatible detail.
5. Reference images for inspiration only.

If any files conflict, **do not silently choose a new product behavior**: surface the discrepancy and follow the latest approved decision. Especially: no online deposit selector despite earlier competitor reference.

## 12. Unresolved decisions — don't invent
- Official logo and approved media; permissioned real portfolio/testimonials.
- Shipping prices by governorate and remote area policy.
- Upload limits/types, photo retention and deletion period.
- Exact book size/binding and what “12/24 pages” means in print production.
- Phone/WhatsApp/email/social accounts, domain, notification sender.
- Offline deposit/payment procedure, refunds/cancellations and legal text.
- SLA/expected contact time, identical-copy policy and production timelines.
- Admin credentials, Supabase/Vercel/Resend/VAPID environment values.

**Agent starting instruction:** Read `Plan.md` and `design.md`, audit the current repository, then execute **M0 Foundation** first. Provide concrete changes and validation results, and proceed incrementally.

## 13. Mandatory Google Stitch MCP frontend handoff
**An existing Google Stitch UI/UX project is the authoritative source for frontend screens.** Before implementing any page, Antigravity MUST connect to the user's existing Stitch project through its configured **Stitch MCP** integration, identify the correct project and available screens, and inspect the actual design output, component structure, design tokens and exported assets/code where supported. Do not create a new Stitch project or recreate screens from imagination. Ask the user for the Stitch project URL/ID if not discoverable; do not invent it.

Implementation process: (1) verify MCP connectivity and list projects/screens; (2) confirm the Raqeem project and retrieve each screen; (3) map screens to Next.js App Router routes and reusable shadcn/Tailwind components; (4) extract/reconcile tokens with `design.md`; (5) implement responsive Arabic RTL and English LTR; (6) connect real form, pricing, Supabase and dashboard logic; (7) compare implementation against Stitch visually at desktop/mobile and document differences. Stitch exports are **design inputs, not trusted production code**: refactor, secure, make accessible and test them. If MCP is unavailable, stop the design-to-code step, report the exact blocker and request connection rather than silently substitute a new design.

**Precedence:** for visual layout use the approved existing Stitch screens, while latest user business rules and security requirements in this file and `Plan.md` take precedence if Stitch contains obsolete UI. Document and resolve discrepancies before implementation.

## 14. Permanent v2 Owner Decisions (Superseding v1 Where Noted — 2026-11-20)
1. **Single Source of Brand Contact:** Raqeem's official WhatsApp number across all public touchpoints (Navbar, Footer, Sales/Corporate package, Contact, and CMS defaults) is **`01038639918`** (`https://wa.me/201038639918`), sourced from one centralized brand config (`src/lib/brand.ts`) + `site_settings`. Customer phones saved inside `orders` remain completely independent per order.
2. **Media & Child Photo Isolation:** Private uploaded order photos live exclusively in `child-photos` (`public = false`, short-lived admin signed URLs) and are NEVER auto-published. Public brand/CMS media (Hero image, Portfolio case-study covers, Poster Popup) live in a separate `site-media` bucket (admin-only write).
3. **Admin Authorization:** Single allowlisted admin (`public.admin_account` + `private.is_admin()` + `ADMIN_ALLOWED_EMAIL`) enforced on every protected server action, route handler, and RLS policy.
4. **Packages, Gift & Unified SLA:** Individual 12/24-page books read live prices from Admin DB and include `"علبة ألوان 12 لون هدية مع الأوردر"` (1 per order, not multiplied per book). Corporate package (`باقة المؤسسات`) requires min 10 books with custom discount agreed via sales WhatsApp (never invent a price or percentage). Fulfillment SLA is unified everywhere as **`"مدة التنفيذ والتوصيل من 5 إلى 7 أيام"`**.
5. **Mandatory Deposit Selection (Overrides v1 No-Deposit Rule):** The order form (`"اطلب كتابك الآن"`, supporting children and adults `"أكبر من 18 سنة"`) includes a mandatory deposit selector (**`100` / `200` / `300` EGP**). Server validates in integer piastres and rejects negative remaining balances. Strictly separate **`deposit_selected_piastres`** (requested before production) from **`deposit_status = 'received'`** (manually confirmed by Admin in Dashboard). No online card gateway or invented transfer account. Legacy orders display `"لم يُحدد"`.
6. **Admin Notifications:** On durable order save, automatically send (a) detailed Admin Email (including deposit selected & status, EGP pricing, shipping state, and protected dashboard link for private photos) and (b) lock-screen-safe Web Push (`"رقيم — طلب جديد"` / `"وصل طلب جديد. اضغط لعرض التفاصيل"`, zero PII) independently with selective failed-channel retry and idempotency.
7. **Customer Reviews Moderation:** Visitor reviews (`name`, `age`, `comment`, `rating 1–5`, no photo upload) save as `pending` with a deterministic sequential Raqeem avatar (3 core illustrations). Only Admin-approved reviews render publicly (enforced by RLS).
8. **Social Links & Poster Popup:** Never invent social account URLs; display only active platforms with valid URLs. Poster Popup displays once per browser session when enabled with a valid image, with easy mobile close and server-side URL validation.
9. **Public Order Tracking (`/track`):** Rate-limited lookup by non-guessable tracking reference (`RQM-XXXXXXXX`) returning ONLY reference + stage/status timeline — never customer names, phones, addresses, photos, or financial details.
10. **Pre-Delivery Verification:** Always run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`, test RTL/mobile/modals/permissions, and update `PLAN.md` after every phase.
