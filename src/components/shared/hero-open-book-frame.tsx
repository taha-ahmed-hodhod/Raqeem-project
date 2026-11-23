"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface HeroOpenBookFrameProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

/**
 * Reusable open-book SVG frame for the Homepage Hero.
 * - Exact open-book silhouette: straight sides with soft corners, subtle top-center dip,
 *   and signature bottom-center book fold where both lower edges meet in a rounded spine point.
 * - Inner image clipPath follows the exact same contour so the cream border stays uniform.
 * - Layered ivory paper pages + lavender outer hardcover rim + soft drop shadow sit underneath.
 * - Any Hero image uploaded in Admin (/admin/content) renders cleanly inside the opening on
 *   both desktop and mobile.
 */
export function HeroOpenBookFrame({
  imageUrl,
  alt,
  className,
}: HeroOpenBookFrameProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const clipId = `raqeem-hero-book-clip-${safeId}`;
  const shadowId = `raqeem-hero-book-shadow-${safeId}`;

  // Outer cream open-book frame path (540 x 500 viewBox)
  const outerBookPath =
    "M 76,46 C 148,41 218,45 256,54 Q 270,58 284,54 C 322,45 392,41 464,46 Q 504,48 504,88 L 504,398 Q 504,436 464,438 C 394,437 322,443 287,462 Q 270,471 253,462 C 218,443 146,437 76,438 Q 36,436 36,398 L 36,88 Q 36,48 76,46 Z";

  // Matching inner photo clip path (inset uniformly ~18px so border thickness stays consistent)
  const innerPhotoPath =
    "M 90,64 C 154,60 218,64 256,72 Q 270,76 284,72 C 322,64 386,60 450,64 Q 486,66 486,102 L 486,384 Q 486,418 450,420 C 386,419 322,425 286,443 Q 270,451 254,443 C 218,425 154,419 90,420 Q 54,418 54,384 L 54,102 Q 54,66 90,64 Z";

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[350px] sm:max-w-[440px] lg:max-w-[520px] select-none",
        className,
      )}
    >
      {/* Main Open-Book SVG Frame with Clipped Live Hero Image */}
      <svg
        role="img"
        aria-label={alt}
        viewBox="0 0 540 500"
        className="block h-auto w-full overflow-visible"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={innerPhotoPath} />
          </clipPath>
          <filter
            id={shadowId}
            x="-10%"
            y="-8%"
            width="120%"
            height="122%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="12"
              floodColor="#6B3FA0"
              floodOpacity="0.18"
            />
          </filter>
        </defs>

        {/* 3 playful golden-yellow accent rays hugging the top-left corner of the book border */}
        <g aria-hidden="true">
          <line
            x1="44"
            y1="16"
            x2="47"
            y2="34"
            stroke="#FFC928"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="21"
            y1="26"
            x2="34"
            y2="40"
            stroke="#FFC928"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="10"
            y1="47"
            x2="27"
            y2="52"
            stroke="#FFC928"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        <g filter={`url(#${shadowId})`}>
          {/* Layer 1: Outer soft lavender hardcover edge underneath pages */}
          <path
            d={outerBookPath}
            transform="translate(0, 14)"
            fill="#D8C2F4"
            stroke="#C3A5EA"
            strokeWidth="1.5"
          />

          {/* Layer 2: Bottom ivory paper page stack */}
          <path
            d={outerBookPath}
            transform="translate(0, 9.5)"
            fill="#EFE3D0"
            stroke="#DECBA9"
            strokeWidth="1.2"
          />

          {/* Layer 3: Middle ivory paper page stack */}
          <path
            d={outerBookPath}
            transform="translate(0, 5)"
            fill="#F8F0E3"
            stroke="#E7D8BE"
            strokeWidth="1.1"
          />

          {/* Layer 4: Front cream open-book border */}
          <path
            d={outerBookPath}
            fill="#FFF9EE"
            stroke="#ECE0CB"
            strokeWidth="1.5"
          />
        </g>

        {/* Layer 5: Dynamic Hero Image clipped cleanly inside the open-book contour */}
        <g clipPath={`url(#${clipId})`}>
          <rect x="46" y="54" width="448" height="404" fill="#EFE4FF" />
          <image
            href={imageUrl}
            x="48"
            y="56"
            width="444"
            height="400"
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Subtle top & inner vignette so photo blends naturally into the cream frame */}
          <path
            d={innerPhotoPath}
            fill="none"
            stroke="rgba(90, 54, 24, 0.14)"
            strokeWidth="3"
          />
        </g>

        {/* Subtle center spine fold shadow line on the bottom cream lip */}
        <path
          d="M 270,452 L 270,468"
          stroke="#DFCDAF"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
