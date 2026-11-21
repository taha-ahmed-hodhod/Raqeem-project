import { Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { SocialLinkRow } from "@/lib/supabase/types";
import { RAQEEM_WHATSAPP_BASE_URL } from "@/lib/brand";
import { WhatsAppIcon } from "./whatsapp-icon";

  function SocialPillIcon({ iconKey }: { iconKey: SocialLinkRow["icon_key"] }) {
    if (iconKey === "whatsapp") {
      return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-white shadow-xs ring-2 ring-white">
          <WhatsAppIcon className="h-5 w-5" />
        </span>
      );
    }
    if (iconKey === "facebook") {
      return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs ring-2 ring-white/90">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H7.5v3h2.7v8h3.3Z" />
        </svg>
      </span>
      );
    }
    if (iconKey === "instagram") {
      return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-xs ring-2 ring-white/90">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.3-.1 1.6-.1 4.9-.1Zm0 3.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
        </svg>
      </span>
      );
    }
    if (iconKey === "tiktok") {
      return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#161224] text-white shadow-xs ring-2 ring-white/90">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M19.6 7.5a5.3 5.3 0 0 1-3.1-1 5.3 5.3 0 0 1-2.1-3.3h-3.1v12.5a2.6 2.6 0 1 1-1.8-2.5V10a5.8 5.8 0 1 0 4.9 5.7V9.4a8.4 8.4 0 0 0 5.2 1.8V7.5Z" />
        </svg>
      </span>
      );
    }
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6324C5] text-white shadow-xs ring-2 ring-white/90">
        <Globe className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }

    const PILL_STYLES: Record<SocialLinkRow["icon_key"], string> = {
      whatsapp:
    "bg-gradient-to-b from-[#A3F7B0] via-[#76E88D] to-[#52D96E] text-[#0E361B] shadow-[0_8px_18px_-4px_rgba(14,54,27,0.35),inset_0_2px_0_rgba(255,255,255,0.72)] hover:brightness-105",
      facebook:
    "bg-gradient-to-b from-[#E5CEFF] via-[#CE9EFF] to-[#B67CFA] text-[#2B104E] shadow-[0_8px_18px_-4px_rgba(43,16,78,0.35),inset_0_2px_0_rgba(255,255,255,0.72)] hover:brightness-105",
      instagram:
    "bg-gradient-to-b from-[#FFE0EE] via-[#FFC2DF] to-[#F69BC6] text-[#4E1030] shadow-[0_8px_18px_-4px_rgba(78,16,48,0.30),inset_0_2px_0_rgba(255,255,255,0.72)] hover:brightness-105",
      tiktok:
    "bg-gradient-to-b from-[#F4EEFF] via-[#E5DBFA] to-[#D4C4F5] text-[#1D1236] shadow-[0_8px_18px_-4px_rgba(29,18,54,0.30),inset_0_2px_0_rgba(255,255,255,0.75)] hover:brightness-105",
      youtube:
    "bg-gradient-to-b from-[#FFE2E2] via-[#FFC4C4] to-[#FFA1A1] text-[#5B1010] shadow-[0_8px_18px_-4px_rgba(91,16,16,0.30),inset_0_2px_0_rgba(255,255,255,0.72)] hover:brightness-105",
      globe:
    "bg-gradient-to-b from-[#FFF7D6] via-[#FFEBA3] to-[#FFD966] text-[#3B2600] shadow-[0_8px_18px_-4px_rgba(59,38,0,0.30),inset_0_2px_0_rgba(255,255,255,0.75)] hover:brightness-105",
    };

  export function SocialFollowSection({
    locale,
    links,
  }: {
    locale: Locale;
    links: SocialLinkRow[];
  }) {
    const isAr = locale === "ar";

    const visibleLinks = links
      .filter((item) => item.active && item.url && item.url.trim().length > 0)
      .map((item) => ({
        ...item,
        // Ensure official Raqeem WhatsApp link is always unified
        resolvedUrl:
          item.platform === "whatsapp"
            ? RAQEEM_WHATSAPP_BASE_URL
            : item.url!.trim(),
      }));

    // Hide the entire section if no platform is active with a valid URL
    if (visibleLinks.length === 0) {
      return null;
    }

    return (
      <section
        id="social-section"
        aria-labelledby="social-banner-heading"
        className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10"
      >
          <div
            className="relative overflow-hidden rounded-[28px] shadow-[0_22px_52px_-14px_rgba(120,39,108,0.42)]"
            style={{
              background:
                "linear-gradient(100deg, #A24698 0%, #963B8C 38%, #832F77 68%, #762669 100%)",
            }}
          >
            {/* Subtle ambient warm glow behind artwork */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 start-1/3 h-64 w-64 rounded-full bg-[#C96BBE]/20 blur-3xl"
            />

            <div className="grid grid-cols-1 items-center lg:grid-cols-12">
              {/* Right Column in RTL (First in DOM -> Top on Mobile, Right on Desktop): Text & Social Buttons */}
              <div className="relative z-10 flex flex-col items-center gap-3 px-6 pt-8 pb-6 text-center sm:px-10 lg:col-span-6 lg:items-start lg:py-10 lg:ps-12 lg:pe-6 lg:text-start">
                <h2
                  id="social-banner-heading"
                  className="text-[30px] leading-[1.25] font-black tracking-tight text-[#FFF4D2] drop-shadow-[0_2px_8px_rgba(52,12,48,0.28)] sm:text-[38px] lg:text-[44px]"
                >
                  {isAr ? "خلّيك قريب من رقيم" : "Stay Close to Raqeem"}
                </h2>

                <p className="text-[16px] leading-[1.6] font-bold text-white/95 sm:text-[19px] lg:text-[21px]">
                  {isAr
                    ? "تابع جديد كتبنا أو كلّمنا مباشرة"
                    : "Follow our newest books or message us directly"}
                </p>

                  {/* Dynamic Admin-Managed Social Buttons */}
                  <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3.5 lg:justify-start">
                    {visibleLinks.map((item) => {
                      const label = isAr ? item.label_ar : item.label_en;
                      const pillClass =
                        PILL_STYLES[item.icon_key] ?? PILL_STYLES.globe;

                      return (
                        <a
                          key={item.id}
                          href={item.resolvedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className={`inline-flex min-h-[54px] min-w-[164px] items-center justify-center gap-3 rounded-full px-6 py-2.5 text-[18px] font-black transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#FFF4D2] active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none ${pillClass}`}
                        >
                          <SocialPillIcon iconKey={item.icon_key} />
                          <span>{label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Left Column in RTL (Second in DOM -> Bottom on Mobile, Left on Desktop): Extracted Cartoon Boy Artwork */}
                <div className="relative flex items-end justify-center lg:col-span-6 lg:h-full lg:justify-end">
                  {/* Soft top fade on mobile so the artwork blends seamlessly with the purple banner */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[#8A347E] to-transparent lg:hidden"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/social-banner-boy.png"
                    alt={
                      isAr
                        ? "طفل سعيد بالهودي الأصفر يحمل رسمة ديناصور ملونة مع كتاب التلوين والألوان"
                        : "Happy cartoon boy in a yellow hoodie holding up a dinosaur coloring drawing at his desk"
                    }
                    loading="lazy"
                    className="h-auto w-full max-w-[440px] object-contain object-bottom select-none lg:h-full lg:max-h-[340px] lg:max-w-none lg:object-cover lg:object-left-bottom"
                  />
                </div>
              </div>
            </div>
          </section>
          );
}
