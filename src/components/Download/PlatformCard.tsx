"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TDownloadTargetId, TReleaseAssets } from "@/types/releases";

import ArchitectureToggle from "./ArchitectureToggle";
import DownloadButton from "./DownloadButton";
import TargetIcon from "./TargetIcon";
import { VARIANTS, getFileType } from "./downloadTargets";
import type { IPlatformGroup } from "./downloadTargets";

interface IPlatformCardProps {
  group: IPlatformGroup;
  assets: TReleaseAssets;
  /** The build shown; owned by the page so the hero stays in step. */
  selectedId: TDownloadTargetId;
  onSelect: (group: IPlatformGroup, id: TDownloadTargetId) => void;
  /** Highlights this card as the match for the visitor's device. */
  isRecommended?: boolean;
}

const PlatformCard = ({
  group,
  assets,
  selectedId,
  onSelect,
  isRecommended,
}: IPlatformCardProps) => {
  const variant = VARIANTS[selectedId];
  const asset = assets[selectedId];
  const href = asset?.url;
  const hasChoice = group.variants.length > 1;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-[12px] border border-borderColor bg-white p-5 transition-all duration-200 dark:border-darkBorder dark:bg-darkPrimaryBg",
        href && "hover:shadow-lg",
        isRecommended &&
          "border-primary/60 shadow-sm ring-1 ring-primary/20 dark:border-primary/60",
      )}
    >
      {isRecommended ? (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles aria-hidden className="size-3" />
          Your device
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <TargetIcon group={group} size={40}></TargetIcon>
        <div className="min-w-0">
          <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
            {group.osLabel}
          </p>
          <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
            {group.title}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
        {group.description}
      </p>

      {/* mt-auto pushes the controls to a shared baseline no matter how the
          description wraps across the three cards. */}
      <div className="mt-auto pt-4">
        {hasChoice ? (
          <div className="mb-3">
            <ArchitectureToggle
              label={`Choose your ${group.osLabel} processor`}
              variants={group.variants}
              selectedId={selectedId}
              onSelect={(id) => onSelect(group, id)}
            ></ArchitectureToggle>
          </div>
        ) : null}

        {href ? (
          <DownloadButton
            href={href}
            // Only needed when the card offers a choice: otherwise the
            // visible label already names the platform uniquely.
            accessibleName={
              hasChoice
                ? `Download for ${group.osLabel} ${variant.label}`
                : undefined
            }
            variant={isRecommended ? "default" : "download"}
            className="w-full"
          >
            Download for {group.osLabel}
          </DownloadButton>
        ) : (
          <Button size="lg" variant="download" className="w-full" disabled>
            Not available yet
          </Button>
        )}

        <p className="mt-2.5 text-center text-xs text-subTextColor dark:text-darkTextSecondary">
          <span className="font-mono">{getFileType(group, asset?.name)}</span>
          {asset?.sizeLabel ? ` · ${asset.sizeLabel}` : ""}
          {hasChoice ? ` · ${variant.label}` : ""}
        </p>
      </div>
    </div>
  );
};

export default PlatformCard;
