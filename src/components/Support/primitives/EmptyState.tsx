import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "./tokens";
import firstUseIllustration from "@/assets/support/ticket-first-use-illustration.png";
import notFoundIllustration from "@/assets/support/ticket-not-found-illustration.png";

export type EmptyStateVariant = "first-use" | "no-results";

/** Verbatim copy of the two drawn empty states (REQ-U-03, REQ-U-11). */
export const EMPTY_STATE_COPY: Record<EmptyStateVariant, { title: string; description: string }> = {
  "first-use": {
    title: "No support tickets yet",
    description:
      "Need help with Staff Time Tracker? Create a ticket and follow the conversation with our team here.",
  },
  "no-results": {
    title: "No tickets match these filters.",
    description:
      "Try another keyword, or clear the status and category filters to see every ticket.",
  },
};

const ILLUSTRATIONS = {
  "first-use": firstUseIllustration,
  "no-results": notFoundIllustration,
} as const;

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  /** the buttons row (`SupportButton`s: First use = one 44px primary; No results = 40px outline + primary, 10px gap) */
  actions?: ReactNode;
  /** wrap in the white bordered card (the list page) or render bare (inside another card) */
  card?: boolean;
  /** heading level — h2 on the list page (the hero owns the h1) */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/**
 * Measured on UP-FirstUse / UP-NoResults (2× ÷ 2): card padding 64 top /
 * 72 bottom; illustration drawn at 220×150 (the 440×300 asset at 2×);
 * heading 22px/500 on a 34px line 24px below it; body 15px/23px #505553,
 * max 420px wide (both drawn wraps reproduce), 4px below the heading; the
 * actions row 24px below the body.
 */
export const EmptyState = ({
  variant,
  title,
  description,
  actions,
  card = true,
  headingLevel = "h2",
  className,
}: EmptyStateProps) => {
  const copy = EMPTY_STATE_COPY[variant];
  const heading = title ?? copy.title;
  const body = description ?? copy.description;
  const Heading = headingLevel;
  return (
    <section
      aria-label={heading}
      // a programmatic focus target when the control that led here went away (list page)
      tabIndex={-1}
      data-support-empty={variant}
      className={cn(
        "flex flex-col items-center px-6 pb-[72px] pt-16 text-center outline-none",
        FOCUS_RING,
        card &&
          "rounded-2xl border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg",
        className,
      )}
    >
      <Image
        src={ILLUSTRATIONS[variant]}
        alt=""
        width={220}
        height={150}
        className="h-[150px] w-[220px] max-w-full select-none object-contain"
        draggable={false}
      />
      {/* 25 / 23 (not 24 / 24): UP-FirstUse and UP-NoResults draw heading + body 1 css px lower and the
          buttons where 24 / 24 puts them (2x ink scan, integrator 2026-10-21) — the card height is unchanged. */}
      <Heading className="mt-[25px] text-[22px] font-medium leading-[34px] text-headingTextColor dark:text-darkTextPrimary">
        {heading}
      </Heading>
      <p className="mt-1 max-w-[420px] text-[15px] leading-[23px] text-subTextColor dark:text-darkTextSecondary">
        {body}
      </p>
      {actions ? (
        <div className="mt-[23px] flex flex-wrap items-center justify-center gap-2.5">{actions}</div>
      ) : null}
    </section>
  );
};

export default EmptyState;
