import { Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import type { SocialLinkRow } from "@/lib/supabase/types";
import { WhatsAppIcon } from "./whatsapp-icon";

function SocialBrandIcon({ iconKey }: { iconKey: SocialLinkRow["icon_key"] }) {
  if (iconKey === "whatsapp") {
    return <WhatsAppIcon className="h-6 w-6" />;
  }
  if (iconKey === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H7.5v3h2.7v8h3.3Z" />
      </svg>
    );
  }
  if (iconKey === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.3-.1 1.6-.1 4.9-.1Zm0 3.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
      </svg>
    );
  }
  if (iconKey === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
        <path d="M19.6 7.5a5.3 5.3 0 0 1-3.1-1 5.3 5.3 0 0 1-2.1-3.3h-3.1v12.5a2.6 2.6 0 1 1-1.8-2.5V10a5.8 5.8 0 1 0 4.9 5.7V9.4a8.4 8.4 0 0 0 5.2 1.8V7.5Z" />
      </svg>
    );
  }
  return <Globe className="h-6 w-6" aria-hidden="true" />;
}

const ICON_COLORS: Record<SocialLinkRow["icon_key"], string> = {
  whatsapp: "bg-[#25D366]/15 text-[#16875D] hover:bg-[#25D366] hover:text-white",
  facebook: "bg-[#1877F2]/12 text-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  instagram: "bg-[#E4405F]/12 text-[#E4405F] hover:bg-[#E4405F] hover:text-white",
  tiktok: "bg-[#241747]/10 text-[#241747] hover:bg-[#241747] hover:text-white",
  youtube: "bg-[#FF0000]/12 text-[#FF0000] hover:bg-[#FF0000] hover:text-white",
  globe: "bg-[#6324C5]/12 text-[#6324C5] hover:bg-[#6324C5] hover:text-white",
};

export function SocialFollowSection({
  locale,
  links,
}: {
  locale: Locale;
  links: SocialLinkRow[];
}) {
  const isAr = locale === "ar";
  const visibleLinks = links.filter(
    (item) => item.active && item.url && item.url.trim().length > 0,
  );

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <section
      id="social-section"
      className="mx-auto max-w-6xl px-6 py-12 lg:px-10"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-[#E8E1F2] bg-gradient-to-br from-[#F3EAFF] via-white to-[#FFF9DE] p-8 text-center shadow-[0_14px_36px_-10px_rgba(99,36,197,0.12)] sm:p-12">
        <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-[#6324c5] shadow-xs">
          {isAr ? "تواصل وتابع جديدنا" : "Stay Connected"}
        </span>

        <h2 className="mt-3 text-[26px] leading-[1.35] font-extrabold text-[#241747] sm:text-[34px]">
          {isAr
            ? "تابعونا على صفحات السوشيال ميديا"
            : "Follow Us on Social Media"}
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#625B75] sm:text-base">
          {isAr
            ? "شاهد أحدث قصص رقيم، العروض الموسمية، وتواصل معنا مباشرة عبر منصاتنا الرسمية."
            : "Discover our latest Raqeem stories, seasonal offers, and reach us directly on our official channels."}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          {visibleLinks.map((item) => {
            const label = isAr ? item.label_ar : item.label_en;
            const colorStyle = ICON_COLORS[item.icon_key] ?? ICON_COLORS.globe;
            return (
              <a
                key={item.id}
                href={item.url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`inline-flex min-h-[52px] items-center gap-2.5 rounded-2xl border border-black/5 px-6 py-3 text-sm font-extrabold shadow-xs transition-all duration-200 hover:-translate-y-0.5 ${colorStyle}`}
              >
                <SocialBrandIcon iconKey={item.icon_key} />
                <span>{label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
