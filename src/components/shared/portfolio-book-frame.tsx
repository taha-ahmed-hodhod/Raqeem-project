import { cn } from "@/lib/utils";

interface BookCoverFrameProps {
  imageUrl: string;
  alt: string;
  /** Kept optional for backwards compatibility; binding tone now inherits naturally from the cover artwork. */
  accentIndex?: number;
  className?: string;
}

/**
 * Shared printed hardcover coloring-book frame used across Homepage (desktop & mobile) and /works.
 * - Preserves the exact uploaded 4:3 (1200x900) cover artwork & colors with zero thick colored side strip.
 * - Renders a delicate cover-toned binding hinge crease, crisp ivory top paper-page layers,
 *   small printed corner radii, and a grounded base contact shadow on the wooden shelf.
 */
export function BookCoverFrame({
  imageUrl,
  alt,
  className,
}: BookCoverFrameProps) {
  return (
    <div
      className={cn(
        "group/book relative mx-auto w-full select-none",
        className,
      )}
    >
      {/* Subtle top ivory paper-pages block tucked behind the front cover */}
      <div
        aria-hidden="true"
        className="relative mx-[3px] h-[6px] rounded-t-[4px] border-x border-t border-[#D8CBB8]/85 bg-gradient-to-b from-[#EDE4D5] via-[#FAF6EE] to-[#EFE7DA] shadow-[inset_0_-1px_1px_rgba(74,48,18,0.08)]"
      >
        <div className="absolute inset-x-[4px] top-[2px] h-[1px] bg-[#E3D8C5]/80" />
        <div className="absolute inset-x-[4px] top-[4px] h-[1px] bg-[#E3D8C5]/60" />
      </div>

      {/* Printed 4:3 hardcover front face */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[3px] rounded-b-[5px] bg-[#F3EAFF] shadow-[0_12px_22px_-8px_rgba(36,23,71,0.28),0_3px_6px_-2px_rgba(36,23,71,0.18)]">
        {/* Full uploaded cover artwork — true colors, 4:3 ratio */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {/* Delicate cover-toned binding hinge on the left edge (inherits cover color naturally) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[12px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(25,14,48,0.22) 0%, rgba(255,255,255,0.22) 24%, rgba(25,14,48,0.16) 56%, rgba(255,255,255,0.14) 74%, rgba(25,14,48,0) 100%)",
          }}
        />

        {/* Subtle matte paper lighting across the printed cover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 42%, rgba(20,10,40,0.06) 100%)",
          }}
        />

        {/* Ultra-crisp printed cardstock rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-t-[3px] rounded-b-[5px] ring-1 ring-inset ring-black/10"
        />
      </div>

      {/* Tight grounded contact shadow resting directly on the wooden shelf */}
      <div
        aria-hidden="true"
        className="mx-auto -mt-[2px] h-[5px] w-[96%] rounded-full bg-[#3B2009]/34 blur-[2.5px]"
      />
    </div>
  );
}

/**
 * Reusable warm honey-wood bookshelf plank with left & right rounded wooden brackets.
 */
export function WoodenShelfPlank({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative w-full", className)}>
      {/* Top surface of the wooden shelf */}
      <div className="mx-1 h-[9px] rounded-t-[7px] bg-gradient-to-b from-[#FCE3BA] to-[#F0BE7C] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" />
      {/* Front bevel edge */}
      <div className="relative z-10 h-[13px] w-full rounded-[6px] bg-gradient-to-b from-[#E5A459] via-[#D68D40] to-[#BF762C] shadow-[0_10px_20px_-4px_rgba(92,48,14,0.3)]" />
      {/* Left & right wooden brackets */}
      <div className="mx-auto flex w-[84%] items-start justify-between sm:w-[88%]">
        <div className="h-[14px] w-[20px] rounded-b-[7px] bg-gradient-to-b from-[#B97027] to-[#965618] shadow-[0_4px_9px_rgba(78,39,10,0.26)]" />
        <div className="h-[14px] w-[20px] rounded-b-[7px] bg-gradient-to-b from-[#B97027] to-[#965618] shadow-[0_4px_9px_rgba(78,39,10,0.26)]" />
      </div>
    </div>
  );
}
