# RAQEEM — Product UI/UX Design Specification

**Version:** 1.0  
**Status:** Approved baseline for design; open decisions are identified explicitly  
**Product:** رقيم | Raqeem  
**Languages:** Arabic (primary, RTL) and English (LTR)  
**Markets:** Egypt, delivery to all 27 governorates  
**Design targets:** Google Stitch, Figma handoff, Next.js implementation

## 1. Product vision and business rules

Raqeem makes **physically printed, personalized children's coloring books** from a photograph supplied by a parent/guardian. The team converts the child's likeness to a cartoon character, creates coloring scenes, prints the book, and delivers it. The website is a **lead and order-request experience**, not an online checkout.

**Canonical journey:** Discover → explore portfolio and pricing → configure one or more books → upload child photo(s) → submit contact/delivery details → receive submission confirmation → Raqeem calls or messages via WhatsApp → confirm artwork, pricing, shipping, and any offline payment arrangement → design → print → ship → deliver.

**Never show online payment, card entry, deposit selector, receipt upload, or “Pay now.”** A competitor reference included deposit selection, but the approved Raqeem flow explicitly excludes it. Do not imply a submitted request is a paid or confirmed order.

### Approved commercial rules

| Product | Initial price | Configurability |
|---|---:|---|
| 12-page personalized book | EGP 250 | Editable by admin |
| 24-page personalized book | EGP 350 | Editable by admin |
| 2 books in one request | 10% discount on book subtotal | Editable and toggleable |
| 3 or more books | 20% discount on book subtotal | Editable and toggleable |
| Shipping | Depends on selected governorate | Editable per governorate |

Only one quantity discount tier applies. Calculate `booksSubtotal = Σ(quantity × unitPriceSnapshot)`, `discount = booksSubtotal × activeTierRate`, `estimatedTotal = booksSubtotal − discount + knownShipping`. If governorate shipping is not configured, display **“مصاريف الشحن هتتأكد معاك بعد إرسال الطلب”** and show the books total separately rather than a misleading final total. Label displayed totals as estimated until the team confirms them. Prices, discounts, and shipping are server-authoritative, not trusted from client inputs. A single request can include books for different children with their own image, age, name, page count and theme. The definition of “page” (single printed side vs sheet) requires production confirmation.

## 2. Audience, UX principles, and conversion

**Primary audience:** Parents/guardians in Egypt ordering a memorable, personalized gift for a child. **Secondary:** Gift buyers who can provide guardian consent for a child's photo.

- Show the tangible **printed product**, not a downloadable PDF.
- Demonstrate the full transformation: real photo → cartoon → line-art coloring scene → physical book.
- Keep the order request short and reassuring; progressive disclosure for multiple books.
- Make contact expectations and lack of online payment explicit.
- Use trustworthy real samples only with consent; clearly mark demonstration content.
- Prioritize readable Arabic, fast mobile interaction, accessibility, and privacy.
- Avoid false urgency, fabricated ratings, fake customer stories, or unverified delivery promises.

**Primary conversion:** Successful, valid order-request submission. **Secondary:** portfolio views, pricing selection, WhatsApp/contact clicks. Do not track children's uploaded image contents in analytics.

## 3. Brand identity

**Personality:** Warm, playful, imaginative, premium, reliable, reassuring. **Visual motif:** Child as story hero, coloring pencils, stars, books, friendly hand-drawn flourishes. Use whimsical assets sparingly; maintain a professional product interface.

### 3.1 Color tokens

| Token | Value | Use |
|---|---|---|
| `--color-primary-50` | `#F3EAFF` | Soft primary backgrounds |
| `--color-primary-500` | `#6324C5` | Primary actions, selected states |
| `--color-primary-600` | `#541CA9` | Hover / stronger emphasis |
| `--color-primary-700` | `#43158C` | Pressed state |
| `--color-accent-yellow` | `#FFC928` | Highlights, accents |
| `--color-accent-yellow-50` | `#FFF9DE` | Highlight surfaces |
| `--color-secondary-pink` | `#F65C96` | Playful decorative accents |
| `--color-secondary-pink-50` | `#FFF0F6` | Pink surfaces |
| `--color-bg` | `#F8F5FF` | Page background |
| `--color-surface` | `#FFFFFF` | Cards and forms |
| `--color-surface-muted` | `#F2EEFA` | Secondary surfaces |
| `--color-text-primary` | `#241747` | Main copy |
| `--color-text-secondary` | `#625B75` | Supporting copy |
| `--color-border` | `#E8E1F2` | Borders |
| `--color-success` | `#16875D` | Success |
| `--color-warning` | `#B76B00` | Warning |
| `--color-error` | `#D92D4B` | Errors |
| `--color-info` | `#2563EB` | Informational |

**Accessibility:** Validate actual text/background pairings against WCAG 2.2 AA; do not use yellow or pink as default body text. Never communicate status through color alone.

### 3.2 Typography

Arabic: **Cairo** (400, 500, 600, 700, 800). English: **Nunito** (400, 500, 600, 700, 800). Prefer local or optimized font loading with sensible fallbacks. Use `font-display: swap`.

| Style | Desktop | Mobile | Weight |
|---|---|---|---|
| Display | 52px | 34px | 800 |
| H1 | 44px | 30px | 800 |
| H2 | 34px | 26px | 800 |
| H3 | 24px | 21px | 700 |
| Body large | 18px | 17px | 500 |
| Body | 16px | 16px | 400 |
| Small | 14px | 14px | 500 |
| Caption | 12px | 12px | 500 |

Arabic body line-height approximately 1.7–1.9; headings 1.3–1.5, adjusted by testing. Avoid very long lines (target ~65–80 characters where appropriate). Do not embed interface text in illustrations.

### 3.3 Layout, geometry and motion

- Base spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 80, 112px`.
- Max content width: `1200px`; desktop 12 columns, tablet 8, mobile 4.
- Design frames: 1440px desktop, 768px tablet, 390px mobile; test 320px to wide desktop.
- Horizontal padding: desktop 40px, tablet 24px, mobile 16px.
- Section vertical spacing: 80–112px desktop, 48–64px mobile.
- Radii: 12px inputs/buttons, 16px compact cards, 24px large cards, 32px hero/feature surfaces.
- Borders: 1px neutral; shadows soft and restrained.
- Touch targets ≥44×44px; visible keyboard focus ring.
- Motion: 150–250ms for controls, 250–400ms for gentle section transitions; honor `prefers-reduced-motion`.
- Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) and directional icons appropriate to RTL/LTR.

### 3.4 Components and states

Create reusable components: AnnouncementBar, SiteHeader, LanguageSwitcher, MobileNav, PrimaryButton, SecondaryButton, BookOptionCard, QuantityStepper, OfferBadge, PriceSummary, GovernorateSelect, ChildBookConfigurator, PhotoUploader, FormField, Checkbox, Stepper, PortfolioCard, BeforeAfterGallery, TestimonialCard, FAQAccordion, StickyMobileCTA, Footer, StatusBadge, AdminSidebar, DataTable, NotificationBell, ConfirmDialog, Toast, EmptyState, Skeleton, Pagination, SearchFilter.

For each interactive component design **default, hover, focus, selected, disabled, loading, error, success**, and relevant empty states. Buttons must have descriptive labels. Use inline field errors plus a summary for multi-error submissions. Confirmation dialogs for destructive admin actions.

## 4. Information architecture

### 4.1 Public website — 12 screens

1. **Home** `/[locale]` — marketing + product overview + conversion.
2. **About** `/[locale]/about` — mission, story, process and values.
3. **Portfolio** `/[locale]/portfolio` — real/demo examples and filters.
4. **Portfolio detail** `/[locale]/portfolio/[slug]` — transformation stages and book mockup.
5. **How it works** `/[locale]/how-it-works` — four-step journey and FAQ links.
6. **Pricing & offers** `/[locale]/pricing` — 12/24 pages, tiered discounts, shipping caveat.
7. **Order request** `/[locale]/order` — complete configuration and form.
8. **Order success** `/[locale]/order/success` — acknowledgment and next steps; no sensitive details in URL.
9. **FAQ** `/[locale]/faq` — delivery, image use, book process, pricing.
10. **Contact** `/[locale]/contact` — WhatsApp, phone, contact details if provided.
11. **Privacy** `/[locale]/privacy` — guardian consent, photo handling, retention and deletion.
12. **Terms** `/[locale]/terms` — request/confirmation process and fulfillment policies.

### 4.2 Admin screens

- Overview `/dashboard` — KPIs, recent requests, alerts, order trends.
- Orders `/dashboard/orders` — filterable, searchable list and status changes.
- Order detail `/dashboard/orders/[id]` — books, private child photos, contact, price snapshot, notes, history.
- Portfolio `/dashboard/portfolio` — add/edit/delete/reorder, real vs demo labels, permissions metadata.
- Content `/dashboard/content` — bilingual copy, images, hero, FAQ, testimonials, banners.
- Pricing & offers `/dashboard/pricing` — 12/24 prices, quantity tiers, enable/disable.
- Shipping `/dashboard/shipping` — all 27 governorates and editable rates.
- Notifications `/dashboard/notifications` — in-app history, unread/read, push/email status.
- Settings `/dashboard/settings` — admin profile, notification subscriptions, brand/contact settings.

Only one admin account is required initially. All admin routes and data operations must enforce server-side authentication and authorization.

## 5. Homepage — detailed visual specification

### 5.1 Announcement bar and navigation

Slim announcement: **“🎁 كتاب تلوين مخصوص لطفلك | 🚚 توصيل لجميع محافظات مصر”**. No free-shipping claim. Header: Raqeem logo, الرئيسية، عن رقيم، أعمالنا، كيف نعمل؟، الأسعار والعروض، آراء العملاء (anchor), اطلب كتابك, AR/EN switch, contact shortcut. On mobile use compact logo, language switch and accessible menu. Header may stick on scroll; do not obstruct content.

### 5.2 Hero / product gallery

RTL desktop: marketing copy and selectable book options on right, product gallery on left. Primary headline: **“مش مجرد كتاب تلوين... طفلك هيبقى بطل القصة!”** with yellow marker highlight on “بطل القصة”. Supporting copy: **“حوّل صورة طفلك لكتاب تلوين مخصوص باسمه وشخصيته، مليان مغامرات ورسومات ممتعة، مطبوع بجودة عالية وبيوصلك لحد البيت.”**

Display physical spiral-bound book mockup, colored personalized cover, sample black-and-white pages, thumbnails and arrows. Avoid using unconsented photos. Primary CTA **“اطلب كتاب طفلك الآن”**; secondary **“شوف أعمالنا”**. Trust chips: تصميم مخصص، طباعة عالية الجودة، توصيل لكل مصر.

Book selection: 12 صفحة — **250 جنيه**; 24 صفحة — **350 جنيه**. Selected state obvious; choosing a card preselects that option on the order page (URL query or shared state). Do not label a package “most popular” without real evidence.

### 5.3 Supporting sections in order

1. **Why Raqeem:** six concise cards — طفلك هو البطل، تصميم مخصوص، 12 أو 24 صفحة، طباعة ممتازة، توصيل لكل مصر، عروض مميزة.
2. **How it works:** (1) ابعت صورة طفلك وبياناتك, (2) فريق رقيم يتواصل معاك, (3) نصمم ونطبع كتاب طفلك, (4) نوصل الكتاب لحد باب البيت. Desktop horizontal stepper; mobile vertical.
3. **Portfolio:** 3–6 visual transformations; filters الكل / أعمال حقيقية / نماذج تجريبية; show real/demo labels.
4. **Pricing & offers:** product cards plus 2-book 10% and 3+-book 20% offer cards; “الشحن حسب المحافظة”.
5. **Reviews:** only verified testimonials, consented images/screenshots with identifying details hidden. If none exist, hide or use explicitly marked layout placeholders in design previews only.
6. **About:** “في رقيم، بنحوّل صور أطفالكم لذكريات مليانة ألوان وفرحة. كل كتاب بيتصمم مخصوص عشان طفلك يعيش مغامرة يكون هو بطلها.”
7. **Final CTA:** “جاهز تخلي طفلك بطل كتابه؟” → “ابدأ طلبك دلوقتي”.
8. **Footer:** brand, navigation, contact, social links (only supplied URLs), privacy, terms, language.

**Sticky mobile CTA:** show price context if selected and a single clear “اطلب كتابك” action, without covering fields or device safe areas.

## 6. Order request — primary conversion screen

### 6.1 Information structure

A) Intro and expectation → B) books configuration → C) parent/guardian contact → D) delivery → E) price summary and consent → F) submit.

Intro: **“اطلب كتاب طفلك الآن”**; subtitle **“املأ البيانات، وفريق رقيم هيتواصل معاك لتأكيد تفاصيل الكتاب والسعر والشحن.”**

### 6.2 Book items (repeatable)

Each book item includes:
- Page count: 12 / 24, with current price.
- Child's first name / desired cover name (required).
- Child age (required, validation appropriate to age).
- Child photograph (required, preview, replace/remove).
- Interests/theme (optional selectable chips and free text).
- Additional design notes (optional).
- Quantity for identical copies (default 1, minimum 1).

Allow **Add another child/book**; every new distinct book has its own photo and settings. Clarify whether quantity means identical copies vs distinct personalized books. Offer “duplicate configuration” only with explicit confirmation of copied details. Display per-item subtotal.

### 6.3 Parent and delivery fields

- Parent/guardian full name — required.
- Egyptian mobile number — required, validated; no invented phone.
- WhatsApp number — optional if different.
- Governorate — required searchable list of Egypt's 27 governorates.
- Detailed address — required (district, street, building, apartment/landmark as useful).
- Additional order notes — optional.
- Consent — required checkbox: parent/guardian authorizes photo processing for order preparation and acknowledges privacy policy; do not precheck.

### 6.4 Image upload UX and privacy

Accepted formats and size limits must match implementation settings (to be confirmed); show them in the UI. Provide accessible file picker and mobile camera/gallery support; thumbnail preview; upload progress; replace/remove; retry on failure. Strip unnecessary metadata where feasible, validate file signatures and size on server, store originals in **private** storage, use temporary signed URLs only for authorized views. Never expose child photos in public gallery without documented guardian consent. Define retention/deletion schedule before launch; allow deletion requests.

### 6.5 Live price summary

Display each item, page count, copies, unit price, subtotal, eligible discount and estimated shipping. Apply discounts to **total book copies** in the request, not shipping. Example: two 12-page copies → 2×250=500, 10%=50 off, books total=450 EGP, plus configured shipping. Three 24-page copies → 3×350=1050, 20%=210 off, books total=840 EGP, plus configured shipping. For mixed page counts use their respective prices. Save a pricing snapshot at submission to prevent future admin price changes from altering historical requests.

If shipping rate configured: show rate and estimated total. If not: **“مصاريف الشحن هتتأكد معاك بعد إرسال الطلب”** and label amount as books total excluding shipping. No deposit field or payment action.

### 6.6 Submit and confirmation

Primary CTA: **“إرسال الطلب”**. Supporting note: **“إرسال الطلب مجاني، ومش معناه تأكيد الشراء. فريق رقيم هيتواصل معاك لتأكيد التفاصيل.”**

Show disabled/loading state while submitting; prevent double submission; preserve draft on recoverable errors; show field-level and general error messages. Success screen: **“تم استلام طلبك بنجاح! هيتواصل معاك فريق رقيم قريبًا لتأكيد التفاصيل والسعر والتوصيل.”** Include request reference if safely generated; no customer image or personal information in public URLs.

## 7. Admin Dashboard design

**Tone:** Professional operations interface using Raqeem tokens but fewer decorative elements. Desktop sidebar on right in RTL, compact drawer on mobile. Overview KPI cards, status charts, recent orders; all sample numbers must be labeled demo data.

### 7.1 Orders table

Columns: reference, created date, guardian name, book/child summary, quantity, estimated total, governorate, status, actions. Filters by date/status/governorate; search by order ID or authorized contact fields; pagination; empty/loading/error states.

Statuses: **جديد → تم التواصل → جاري التصميم → جاري الطباعة → تم الشحن → تم التسليم**, plus **ملغي**. Record status timestamps and admin notes. Do not infer payment completion from order status.

### 7.2 Order detail

Private images, child-specific options, guardian contact, click-to-call/WhatsApp, shipping address, original pricing snapshot, estimated shipping, internal notes, status timeline. Confirmation of final amounts and any offline payment arrangements can be stored as internal administrative notes/status only if later specified; never create a customer online payment step by default.

### 7.3 CMS and commercial controls

Content editor: Arabic/English hero text, sections, FAQs, testimonials, gallery entries, promotional banners, image alt text, SEO metadata. Preview/publish where feasible. Portfolio items must be marked real or demo, with guardian publication consent for real child photos. Pricing editor: 12/24 unit prices and quantity discount tiers with toggles, validation, change history. Shipping editor: 27 governorates, rates and availability; unknown rates are not assumed zero.

### 7.4 Notifications

Notification bell with unread count, in-app notification feed, read/unread, click-through to order. New order event should create a durable in-app record and attempt **Web Push** and **Email** notification. Browser subscription is opt-in; use Service Worker for push reception/display, server-side Web Push/VAPID for sending, email provider (e.g. Resend) for email. Push is best effort, not guaranteed; dashboard is authoritative. Never include child photos, address or full personal details in push/email previews. Handle denied permissions, expired subscriptions, duplicate events, retries and delivery errors.

## 8. Localization and content

Use `ar` as default with `dir="rtl"`, `en` with `dir="ltr"`. Store content in translation keys and CMS locale fields. Translate validation, status labels, legal pages, alt text, metadata, and notification copy. Format currency as EGP and dates/numbers for selected locale; maintain comprehensible Egyptian Arabic for marketing copy. Ensure all navigation, arrows, icon placements, form layouts and drawers mirror logically. Do not mirror photographs, book covers, or brand logos automatically.

## 9. Assets and media specification

Required assets:
- Official Raqeem logo (SVG + raster fallback, light/dark variations).
- Hero physical personalized coloring book mockups with no embedded UI text.
- Consistent child-cartoon character illustrations.
- Transformation portfolio samples: source photo, cartoon, line art, final cover.
- Process icons: upload, contact, design, print, delivery.
- Book options/offer decorations, crayons, stars, clouds, subtle flourishes.
- Responsive image variants; WebP/AVIF where suitable, SVG for simple icons.

Use licensed or original imagery. Avoid AI-generated text in covers as final assets; compose real names and labels in design/code. Use only guardian-approved photos for public marketing; label demos. Provide descriptive alt text; mark decorative assets as decorative. Preserve print-quality originals separately from web thumbnails.

## 10. Accessibility, trust, performance and SEO

- Target WCAG 2.2 AA: contrast, focus, labels, error messages, keyboard support, semantic headings, screen-reader announcements, 44px targets, reduced motion.
- Privacy: explicit consent, restricted access to minors' images, minimal data, clear privacy/retention/deletion policy, no public buckets for uploads, server-side authorization and RLS.
- Mobile-first performance: optimized images, lazy-load below fold, limit animation and heavy libraries, avoid layout shift.
- SEO: unique localized titles/descriptions, canonical/hreflang, social previews, accessible descriptive headings, appropriate structured data only when truthful.
- Do not index private dashboard, order details, or uploaded media.
- Analytics: page views, CTA clicks, form started, submission success; no child PII or photos in event payloads.

## 11. Design handoff to Google Stitch / Figma / engineering

**Deliverables:** 1440px desktop, 768px tablet, 390px mobile; Arabic primary and English equivalent; 12 public screens; 9 admin views; reusable components, interaction states, tokens, typography, responsive rules, image placeholders, navigation prototype, error/success/empty states.

**Stitch workflow:**
1. Provide reference screenshot(s), official logo, and this design specification.
2. Generate **homepage first** with design tokens and consistent components.
3. Review content accuracy, RTL, hierarchy, imagery and mobile.
4. Generate **order request** with all conditional states and calculations.
5. Generate **dashboard**, then remaining screens.
6. Generate English LTR variants and perform final responsive/a11y review.

**Acceptance checklist:**
- [ ] Hero makes clear the book is personalized and physically printed.
- [ ] Real transformation examples show photo → cartoon → coloring → printed book.
- [ ] Pricing correct: 12 pages 250 EGP; 24 pages 350 EGP.
- [ ] Discounts correct: 2 books 10%; 3+ books 20%; books only.
- [ ] Shipping is by governorate, not invented or implicitly free.
- [ ] Multiple books/children supported with individual photo and details.
- [ ] No online payment/deposit UI; submission triggers team contact.
- [ ] Order form consent and privacy cues visible.
- [ ] CMS edits bilingual content, gallery, pricing and shipping.
- [ ] Admin handles order lifecycle, in-app + push + email alerts.
- [ ] All UI has proper RTL/LTR, responsive, accessible states.
- [ ] Testimonials and real photos are verified/consented, demos labeled.
- [ ] UI copy has been proofread by an Arabic speaker.

## 12. Open decisions (do not invent)

1. Final official logo files and brand assets.
2. Specific shipping prices per governorate and policy for remote areas.
3. Maximum photo upload size, formats and storage retention period.
4. Definition of 12/24 pages for production and physical dimensions/binding.
5. Exact contact phone, WhatsApp, email and social media URLs.
6. Whether a parent can request multiple identical copies and multiple different books in one order (the design supports both; confirm operational constraints).
7. Verified customer testimonials and permissioned real portfolio assets.
8. Expected response times and any service-level promise.
9. Refund/cancellation policy, offline payment arrangements, and legal text.
10. Notification sender email/domain and VAPID configuration.

**Authority rule:** Where a visual reference conflicts with these approved requirements, the approved Raqeem business flow and prices take precedence. In particular, the reference's deposit feature must not appear in Raqeem's customer form.
