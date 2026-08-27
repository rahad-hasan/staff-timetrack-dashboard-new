"use client";

import type { IDetectedPlatform, IReleaseInfo, TDownloadTargetId } from "@/types/releases";

import DownloadButton from "./DownloadButton";
import RecommendedCard from "./RecommendedCard";
import VariantChoiceCard from "./VariantChoiceCard";
import { PLATFORM_GROUPS, VARIANTS, getTargetLabel } from "./downloadTargets";

interface IRecommendedDownloadProps {
  platform: IDetectedPlatform;
  release: IReleaseInfo;
  /** The build detection or the user settled on; `null` while still open. */
  chosenTarget: TDownloadTargetId | null;
  /** Opens the "Which Mac architecture do I have?" accordion and focuses it. */
  onExplainChoice: () => void;
  helpPanelId: string;
  isHelpOpen: boolean;
}

/**
 * Primary call to action: one big button for the build that matches the
 * visitor's machine.
 *
 * When the OS is known but the build is not, this defers to
 * {@link VariantChoiceCard} rather than guessing — the same selection the
 * platform matrix uses, so the two surfaces always agree.
 */
const RecommendedDownload = ({
  platform,
  release,
  chosenTarget,
  onExplainChoice,
  helpPanelId,
  isHelpOpen,
}: IRecommendedDownloadProps) => {
  if (platform.os === "unknown") return null;

  const group = PLATFORM_GROUPS[platform.os];

  if (!chosenTarget) {
    return (
      <VariantChoiceCard
        group={group}
        release={release}
        onExplainChoice={onExplainChoice}
        helpPanelId={helpPanelId}
        isHelpOpen={isHelpOpen}
      ></VariantChoiceCard>
    );
  }

  const asset = release.assets[chosenTarget];
  if (!asset?.url) return null;

  return (
    <RecommendedCard
      group={group}
      title={getTargetLabel(chosenTarget)}
      action={
        <DownloadButton
          href={asset.url}
          accessibleName={
            group.variants.length > 1
              ? `Download for ${group.osLabel} ${VARIANTS[chosenTarget].label}`
              : undefined
          }
          className="w-full sm:w-auto"
        >
          Download for {group.osLabel}
        </DownloadButton>
      }
    >
      <p className="mt-0.5 truncate text-xs text-subTextColor dark:text-darkTextSecondary">
        {asset.name}
        {asset.sizeLabel ? ` · ${asset.sizeLabel}` : ""}
      </p>
    </RecommendedCard>
  );
};

export default RecommendedDownload;
