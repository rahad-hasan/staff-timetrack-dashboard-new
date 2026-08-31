"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

import HeadingComponent from "@/components/Common/HeadingComponent";
import { useDetectedPlatform } from "@/hooks/useDetectedPlatform";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { useReleases } from "@/hooks/useReleases";
import DownloadPageSkeleton from "@/skeleton/download/DownloadPageSkeleton";

import FallbackNotice from "./FallbackNotice";
import MacArchitectureHelp from "./MacArchitectureHelp";
import PlatformCard from "./PlatformCard";
import RecommendedDownload from "./RecommendedDownload";
import ReleaseMeta from "./ReleaseMeta";
import { GROUP_ORDER, PLATFORM_GROUPS } from "./downloadTargets";
import { useVariantSelection } from "./useVariantSelection";

const DownloadPage = () => {
  const { state, release, isLoading, isRefreshing, refetch } = useReleases();
  const { platform, isResolved } = useDetectedPlatform();
  const selection = useVariantSelection(platform.recommendedTarget);

  const [isMacHelpOpen, setIsMacHelpOpen] = useState(false);
  const macHelpPanelId = useId();
  const macHelpTriggerRef = useRef<HTMLButtonElement>(null);

  // Opening the help from the hero has to move focus, not just the viewport:
  // the panel sits below the whole platform matrix, so a keyboard user who
  // activates the hero's prompt would otherwise perceive nothing and have to
  // tab through every download link to reach the answer they asked for.
  const handleExplainMac = useCallback(() => {
    setIsMacHelpOpen(true);
    // Deferred so focus lands after the panel has been revealed.
    requestAnimationFrame(() => {
      macHelpTriggerRef.current?.focus({ preventScroll: true });
      macHelpTriggerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  if (isLoading) return <DownloadPageSkeleton></DownloadPageSkeleton>;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <HeadingComponent
          heading="Download Staff Time Tracker"
          subHeading="Track time, activity and screenshots from your desktop. Available for Windows, macOS and Linux."
        ></HeadingComponent>

        <ReleaseMeta release={release}></ReleaseMeta>
      </div>

      {state.status === "error" ? (
        <FallbackNotice
          error={state.error}
          tag={release.tag}
          isRefreshing={isRefreshing}
          onRetry={refetch}
        ></FallbackNotice>
      ) : null}

      {/*
        One wrapper for both installer surfaces so the product tour can
        spotlight "where you get the app" as a single hole. The hero alone
        would be wrong: it renders nothing while the platform is unresolved
        or unknown, and a zero-area anchor makes the tour skip the step.
      */}
      <div data-tour={TOUR_ANCHORS.downloadApp}>
        {isResolved ? (
          <div className="mt-5">
            <RecommendedDownload
              platform={platform}
              release={release}
              chosenTarget={
                platform.os === "unknown"
                  ? null
                  : selection.chosenFor(PLATFORM_GROUPS[platform.os])
              }
              onExplainChoice={handleExplainMac}
              helpPanelId={macHelpPanelId}
              isHelpOpen={isMacHelpOpen}
            ></RecommendedDownload>
          </div>
        ) : null}

        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
            All platforms
          </h2>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GROUP_ORDER.map((groupId) => (
              <PlatformCard
                key={groupId}
                group={PLATFORM_GROUPS[groupId]}
                assets={release.assets}
                selectedId={selection.selectedFor(PLATFORM_GROUPS[groupId])}
                onSelect={selection.select}
                isRecommended={platform.os === groupId}
              ></PlatformCard>
            ))}
          </div>
        </section>

        {/*
          Inside the tour anchor on purpose. The hero's "which Mac do I have?"
          prompt opens and focuses this panel — if it sat outside the wrapper,
          the spotlight's click shield would dim it and swallow its clicks
          mid-tour, right after the tour itself invited the interaction.
        */}
        <div className="mt-4 scroll-mt-24">
          <MacArchitectureHelp
            isOpen={isMacHelpOpen}
            onOpenChange={setIsMacHelpOpen}
            panelId={macHelpPanelId}
            triggerRef={macHelpTriggerRef}
          ></MacArchitectureHelp>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-subTextColor dark:text-darkTextSecondary">
        <ShieldCheck aria-hidden className="size-3.5 shrink-0 text-primary" />
        Every installer is served directly from our official GitHub release.
      </p>
    </div>
  );
};

export default DownloadPage;
