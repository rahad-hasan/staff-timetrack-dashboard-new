"use client";

import { HelpCircle } from "lucide-react";

import type { IReleaseInfo } from "@/types/releases";

import DownloadButton from "./DownloadButton";
import RecommendedCard from "./RecommendedCard";
import type { IPlatformGroup } from "./downloadTargets";

interface IVariantChoiceCardProps {
  group: IPlatformGroup;
  release: IReleaseInfo;
  /** Opens the "Which Mac architecture do I have?" accordion and focuses it. */
  onExplainChoice: () => void;
  /** Id of the panel that trigger opens, for `aria-controls`. */
  helpPanelId: string;
  isHelpOpen: boolean;
}

/**
 * The recommended card for a group whose build could not be narrowed down.
 *
 * Reached only by macOS today: Safari and Firefox cannot tell an Apple Silicon
 * Mac from an Intel one, and an `arm64` .dmg refuses to open on Intel — so
 * both builds are offered rather than guessing and handing someone a file that
 * will not run.
 */
const VariantChoiceCard = ({
  group,
  release,
  onExplainChoice,
  helpPanelId,
  isHelpOpen,
}: IVariantChoiceCardProps) => {
  const available = group.variants.filter(
    (variant) => release.assets[variant.id]?.url,
  );

  if (available.length === 0) return null;

  return (
    <RecommendedCard group={group} title={group.osLabel}>
      {group.choiceHint ? (
        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
          {group.choiceHint}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {available.map((variant, index) => {
          const asset = release.assets[variant.id];
          if (!asset?.url) return null;

          return (
            <DownloadButton
              key={variant.id}
              href={asset.url}
              // WCAG 2.5.3: the visible text is "{label} · {size}", so the
              // accessible name has to contain that whole string verbatim.
              accessibleName={`Download ${variant.label}${
                asset.sizeLabel ? ` · ${asset.sizeLabel}` : ""
              } for ${group.osLabel}`}
              // The leading variant carries the primary style; PLATFORM_GROUPS
              // decides which one leads.
              variant={index === 0 ? "default" : "outline2"}
              className="flex-1"
            >
              {variant.label}
              {asset.sizeLabel ? (
                <span className="opacity-70">· {asset.sizeLabel}</span>
              ) : null}
            </DownloadButton>
          );
        })}
      </div>

      {/* A remote disclosure trigger: it must say what it controls, and
          `onExplainChoice` moves focus into the panel it reveals — otherwise
          activating it looks like nothing happened to a keyboard user. */}
      <button
        type="button"
        onClick={onExplainChoice}
        aria-expanded={isHelpOpen}
        aria-controls={helpPanelId}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
      >
        <HelpCircle aria-hidden className="size-4" />
        Which one do I have?
      </button>
    </RecommendedCard>
  );
};

export default VariantChoiceCard;
