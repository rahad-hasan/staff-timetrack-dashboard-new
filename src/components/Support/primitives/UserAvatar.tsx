"use client";

import { useState } from "react";
import { UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/utils/entityAvatar";

interface UserAvatarProps {
  user: { name?: string | null; image?: string | null } | null | undefined;
  /** diameter in px — 28 in the table (PNG), 36/40 on the ticket page */
  size?: number;
  className?: string;
}

/**
 * Initials text one shade darker than the shared palette's `-700` (amber-700 on
 * amber-500/10 reads 4.48:1 at 11px — axe "serious"; every `-800` here is
 * ≥ 6.5:1). Same colour family, so the chip still matches the rest of the
 * dashboard; tailwind-merge lets these replace the palette's light `text-*`
 * (the `dark:` shades are kept). Spelled out for Tailwind's class scanner.
 */
const AA_INITIALS: Record<string, string> = {
  blue: "text-blue-800",
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  rose: "text-rose-800",
  violet: "text-violet-800",
  cyan: "text-cyan-800",
  orange: "text-orange-800",
  teal: "text-teal-800",
  fuchsia: "text-fuchsia-800",
  indigo: "text-indigo-800",
};

const initialsPalette = (name: string) => {
  const palette = getAvatarPalette(name || "?");
  const family = /(?:^|\s)text-([a-z]+)-700(?:\s|$)/.exec(palette)?.[1];
  return cn(palette, family ? AA_INITIALS[family] : undefined);
};

/**
 * Round photo avatar with an initials fallback (deterministic colour per
 * name, same helper the rest of the dashboard uses). The image is a plain
 * `<img>`: avatar URLs are signed per response, so next/image could neither
 * cache nor optimise them, and unconfigured hosts would throw.
 */
export const UserAvatar = ({ user, size = 28, className }: UserAvatarProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const name = user?.name?.trim() || "";
  const src = user?.image && user.image !== failedSrc ? user.image : null;
  const fontSize = Math.max(10, Math.round(size * 0.4));

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold leading-none",
        !src && initialsPalette(name),
        className,
      )}
      style={{ width: size, height: size, fontSize }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        getInitials(name || "?")
      )}
    </span>
  );
};

interface UnassignedAvatarProps {
  size?: number;
  className?: string;
}

/** Dashed grey circle (#b8bebd ring) with the two-people glyph (#8a9190) — the ASSIGNED column's "Unassigned". */
export const UnassignedAvatar = ({ size = 28, className }: UnassignedAvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-[#b8bebd] text-support-muted dark:border-darkTextSecondary dark:text-darkTextSecondary",
      className,
    )}
    style={{ width: size, height: size }}
  >
    <UsersRound size={Math.round(size * 0.5)} strokeWidth={1.75} />
  </span>
);

interface AssigneeProps {
  agent: { name?: string | null; image?: string | null } | null | undefined;
  size?: number;
  className?: string;
  /** "Unassigned" wording override (e.g. "Not assigned yet" on the ticket page) */
  emptyLabel?: string;
}

/**
 * Avatar + name, or the Unassigned glyph + grey label — one component for
 * every ASSIGNED cell. Measured: 28px avatar, 10px gap, name 13.5px/500
 * slate-700, "Unassigned" 13.5px/400 (drawn #8a9190 = 3.2:1; rendered in the AA twin
 * #697170 = 5.0:1, plan.md §7).
 */
export const Assignee = ({ agent, size = 28, className, emptyLabel = "Unassigned" }: AssigneeProps) =>
  agent ? (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <UserAvatar user={agent} size={size} />
      <span className="truncate text-[13.5px] font-medium leading-5 text-support-slate dark:text-darkTextPrimary">
        {agent.name || "Support"}
      </span>
    </span>
  ) : (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <UnassignedAvatar size={size} />
      <span className="truncate text-[13.5px] leading-5 text-support-muted-text dark:text-darkTextSecondary">
        {emptyLabel}
      </span>
    </span>
  );

export default UserAvatar;
