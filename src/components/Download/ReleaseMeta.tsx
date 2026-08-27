import { ExternalLink, Tag } from "lucide-react";

import type { IReleaseInfo } from "@/types/releases";

interface IReleaseMetaProps {
  release: IReleaseInfo;
}

const formatPublishedAt = (publishedAt: string | null): string | null => {
  if (!publishedAt) return null;

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Version tag, publish date and the "What's new" link for the current release. */
const ReleaseMeta = ({ release }: IReleaseMetaProps) => {
  const releasedOn = formatPublishedAt(release.publishedAt);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-borderColor bg-bgSecondary px-2.5 py-1 font-medium text-headingTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
        <Tag aria-hidden className="size-3 text-primary" />
        {release.tag}
      </span>

      {releasedOn ? (
        <span className="text-subTextColor dark:text-darkTextSecondary">
          Released {releasedOn}
        </span>
      ) : null}

      <a
        href={release.releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
      >
        What&apos;s new
        <ExternalLink aria-hidden className="size-3" />
      </a>
    </div>
  );
};

export default ReleaseMeta;
