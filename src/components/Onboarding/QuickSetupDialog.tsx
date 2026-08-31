"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Check,
  FolderKanban,
  LayoutGrid,
  type LucideIcon,
  MonitorDown,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IOnboardingTask, OnboardingTaskId } from "@/types/onboarding";

/**
 * Phase 1 — the Quick Setup hub a new user meets on their first dashboard
 * load, and the surface every "open the setup guide" affordance comes back
 * to. Two panes: a checklist of the workspace milestones on the left, and a
 * preview of the selected step — a short tutorial video where one exists —
 * with a single call-to-action on the right.
 *
 * Like the checklist widget, this is a *mirror*: ticks come from each flow's
 * own success handler via `completeTask`, and nothing here can mark a
 * milestone done. `OnboardingGate` owns when it opens and what the CTA for
 * each step actually does; this file only knows how it looks and which step
 * is being previewed.
 */

const TASK_ICONS: Record<OnboardingTaskId, LucideIcon> = {
  CLIENT_CREATED: BriefcaseBusiness,
  PROJECT_CREATED: FolderKanban,
  TEAM_INVITED: Users,
  DESKTOP_APP_DOWNLOADED: MonitorDown,
  TOUR_COMPLETED: Sparkles,
};

/**
 * The workspace row's id. It is not an `OnboardingTaskId` because it is not a
 * milestone: no server column tracks it, and nothing can un-earn it. Reaching
 * this dialog at all means `POST /company` already succeeded, so the row is
 * always complete — which is the point. Opening on "1 of N done" rather than a
 * wall of empty circles is deliberate: progress already moving is far easier
 * to continue than progress at zero.
 */
const WORKSPACE_ROW = "WORKSPACE_READY";

/**
 * One row of the guide, in the shape both panes need.
 *
 * The workspace row and the milestone rows are the same type on purpose. An
 * earlier cut special-cased the workspace as a magic string threaded through
 * the id union, the selection fallback, the pane ternary and the list render —
 * four places that had to agree, and a fifth waiting for whoever added the
 * next non-milestone row. Rows are built once, then everything downstream just
 * reads them.
 */
interface QuickSetupRow {
  id: string;
  /** Left-hand list. */
  label: string;
  /** Preview pane heading — may differ from the list label. */
  title: string;
  description: string;
  icon: LucideIcon;
  done: boolean;
  videoSrc?: string;
  /** Absent means the row has no action: it is done, or informational. */
  ctaLabel?: string;
  onAction?: () => void;
}

interface QuickSetupDialogProps {
  open: boolean;
  userName?: string;
  /**
   * The organization's name, for the workspace row. Optional because it is
   * cosmetic — the row reads correctly without it, and the store that holds
   * it is localStorage-backed and empty on a fresh browser.
   */
  workspaceName?: string;
  /** Role-visible milestones, in checklist order. */
  tasks: IOnboardingTask[];
  completed: OnboardingTaskId[];
  /** True when a previous session left a walkthrough part-way through. */
  tourResumable: boolean;
  /** ✕ / Escape / outside click — closes for now, comes back via the widget. */
  onClose: () => void;
  /** "Don't show this again" — records the dismissal server-side. */
  onDismissForever: () => void;
  /** The preview pane's CTA for a not-yet-done milestone. */
  onAction: (task: IOnboardingTask) => void;
}

export default function QuickSetupDialog({
  open,
  userName,
  workspaceName,
  tasks,
  completed,
  tourResumable,
  onClose,
  onDismissForever,
  onAction,
}: QuickSetupDialogProps) {
  /**
   * `null` means "no explicit choice yet" — the preview follows the first
   * incomplete milestone, which is also the row a returning user should be
   * looking at. Only a real click pins the selection.
   */
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Reset on open, not on mount: the dialog is mounted globally by the gate,
   * so component state survives between openings and yesterday's selection
   * would otherwise greet today's visit.
   *
   * Reset on BOTH transitions, and on close above all. Resetting only on open
   * still lets the reopened dialog commit one frame of the previous visit's
   * step — mounting that step's clip and making `AnimatePresence` play a full
   * exit/enter pair to animate it away. Clearing on close means the next open
   * is already correct on its first commit; the close-side swap happens under
   * a backdrop that is fading out, where nothing is left to see.
   */
  useLayoutEffect(() => {
    setSelected(null);
  }, [open]);

  const reducedMotion = usePrefersReducedMotion();

  const firstName = userName?.trim().split(/\s+/)[0];

  const rows: QuickSetupRow[] = [
    {
      id: WORKSPACE_ROW,
      label: "Create your workspace",
      title: workspaceName
        ? `${workspaceName} is ready`
        : "Your workspace is ready",
      description:
        "Your organization is created and your free trial is running — this step is already done. Work through the rest of the list and your team is tracking real time in minutes.",
      icon: LayoutGrid,
      done: true,
    },
    ...tasks.map((task) => ({
      id: task.id,
      label: task.label,
      title: task.label,
      description: task.description,
      icon: TASK_ICONS[task.id],
      done: completed.includes(task.id),
      videoSrc: task.videoSrc,
      // Restarting from step one when a half-finished walkthrough is waiting
      // would throw away the user's place, so the label follows what the
      // gate will actually do.
      ctaLabel:
        task.id === "TOUR_COMPLETED" && tourResumable
          ? "Resume tour"
          : task.ctaLabel,
      onAction: () => onAction(task),
    })),
  ];

  const doneCount = rows.filter((row) => row.done).length;
  const percent = Math.round((doneCount / rows.length) * 100);

  /**
   * Follow the first unfinished row until the user picks one, and fall back to
   * the first row when everything is done. `find` over the built rows means a
   * new non-milestone row participates in this for free.
   */
  const activeRow =
    rows.find((row) => row.id === selected) ??
    rows.find((row) => !row.done) ??
    rows[0];

  /** Shown when a step has no clip, and when its clip fails to load. */
  const posterPanel = (
    <div
      className="flex aspect-video w-full items-center justify-center"
      style={{
        background:
          "radial-gradient(120% 120% at 20% 0%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)",
      }}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-bgPrimary shadow-sm dark:bg-darkTertiaryBg">
        <activeRow.icon className="size-7 text-primary" />
      </span>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        // The default close sits at top-4 right-4 with no plate, which lands
        // on the video's top-right corner — a near-black X on near-black
        // footage. This dialog draws its own, on a solid chip.
        showCloseButton={false}
        // `sm:max-w-[56rem]` alone wins the cascade over the base
        // `max-w-[calc(100%-2rem)]`, so between 640px and 896px the dialog
        // spanned the full viewport with its rounded corners clipped flush
        // against the edges. Keep the gutter at every width.
        className="flex flex-col overflow-hidden p-0 gap-0 sm:max-w-[min(56rem,calc(100vw-2rem))]"
      >
        <DialogClose
          // Radix moves focus to the first tabbable node on open, and that is
          // this button — so it must show a visible ring, or a keyboard user
          // opens the guide with focus parked somewhere invisible.
          className="absolute right-3 top-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border border-borderColor bg-bgPrimary/90 text-subTextColor shadow-sm backdrop-blur-sm transition-colors hover:bg-bgSecondary hover:text-headingTextColor focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary focus-visible:outline-none dark:border-darkBorder dark:bg-darkPrimaryBg/90 dark:text-darkTextSecondary dark:hover:bg-darkTertiaryBg dark:hover:text-darkTextPrimary dark:focus-visible:ring-offset-darkPrimaryBg"
          aria-label="Close setup guide"
        >
          <X className="size-4" />
        </DialogClose>

        {/* `dvh`, not `vh`: on mobile browsers `vh` is the *large* viewport, so
            a visible toolbar would push the footer CTA off screen. */}
        <div className="flex max-h-[min(44rem,85dvh)] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          {/* ── left pane: progress + step list ──
              `pr-14` below md keeps the header clear of the floating close
              button, which is anchored to the dialog, not to this pane. */}
          <aside className="flex shrink-0 flex-col gap-4 border-b border-borderColor p-5 pr-14 dark:border-darkBorder md:w-[19.5rem] md:overflow-y-auto md:border-b-0 md:border-r md:pr-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--primary) 14%, transparent)",
                }}
              >
                <Zap className="size-4 text-primary" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Quick Setup
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary">
                  {firstName ? `Welcome, ${firstName} — ` : ""}
                  {rows.length} short steps to a working workspace.
                </DialogDescription>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-primary">
                  {percent}% completed
                </span>
                <span className="text-subTextColor dark:text-darkTextSecondary">
                  {doneCount} of {rows.length} done
                </span>
              </div>

              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkSecondaryBg"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Workspace setup progress"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                  initial={false}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 28 }}
                />
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {rows.map((row) => (
                <StepRow
                  key={row.id}
                  label={row.label}
                  icon={row.icon}
                  done={row.done}
                  selected={row.id === activeRow.id}
                  onSelect={() => setSelected(row.id)}
                />
              ))}
            </ul>

            <button
              type="button"
              onClick={onDismissForever}
              className="mt-auto cursor-pointer self-start pt-1 text-xs text-subTextColor underline-offset-2 hover:underline dark:text-darkTextSecondary"
            >
              Don&apos;t show this again
            </button>
          </aside>

          {/* ── right pane: preview + CTA for the selected step ── */}
          <section className="flex min-w-0 flex-1 flex-col bg-bgPrimary p-5 dark:bg-darkPrimaryBg md:overflow-y-auto md:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeRow.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-1 flex-col"
              >
                <div className="relative overflow-hidden rounded-[12px] border border-borderColor bg-bgSecondary dark:border-darkBorder dark:bg-darkSecondaryBg">
                  {activeRow.videoSrc ? (
                    /*
                      Keyed by src so each step gets a fresh element and fresh
                      load state — no cross-step races, and only the selected
                      step's clip is ever mounted (the set totals ~55MB and
                      must not be fetched eagerly).
                    */
                    <TutorialVideo
                      key={activeRow.videoSrc}
                      src={activeRow.videoSrc}
                      label={`${activeRow.title} — tutorial video`}
                      autoPlay={!reducedMotion}
                      fallback={posterPanel}
                    />
                  ) : (
                    posterPanel
                  )}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  {activeRow.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary">
                  {activeRow.description}
                </p>

                <div className="mt-auto pt-5">
                  {activeRow.done || !activeRow.onAction ? (
                    <div className="flex h-11 items-center justify-center gap-2 rounded-[8px] border border-borderColor text-sm font-medium text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                      <Check className="size-4 text-primary" strokeWidth={3} />
                      Completed
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={activeRow.onAction}
                    >
                      {activeRow.ctaLabel}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One step's screen recording.
 *
 * Mounted per step and keyed by `src`, so its load state is the element's own
 * and cannot be inherited by the next step. Three states, because a preview
 * pane that can only ever say "loading" is worse than no preview: the clip
 * loads, or it fails and we fall back to the designed poster panel that
 * videoless steps already use.
 */
function TutorialVideo({
  src,
  label,
  autoPlay,
  fallback,
}: {
  src: string;
  label: string;
  autoPlay: boolean;
  fallback: ReactNode;
}) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  /**
   * A clip already in the HTTP cache can hold frames before React attaches
   * the media listeners, and `loadeddata` does not fire again for it — the
   * video would sit at `opacity-0` behind an endless shimmer. Read
   * `readyState` at attach time instead of trusting the event alone.
   */
  const attach = useCallback((node: HTMLVideoElement | null) => {
    // HAVE_CURRENT_DATA — there is a frame to show.
    if (node && node.readyState >= 2) setPhase("ready");
  }, []);

  if (phase === "error") return <>{fallback}</>;

  return (
    <>
      {phase === "loading" && (
        /* The shimmer sits on the container's own bg, so it has to differ
           from it in BOTH themes or the pulse is invisible. */
        <div className="absolute inset-0 animate-pulse bg-borderColor dark:bg-darkTertiaryBg" />
      )}

      {/*
        Muted screen recordings, so autoplay is allowed and captions have
        nothing to say. `controls` is not decoration: these run 30s+ on a
        loop, and auto-starting motion that cannot be paused fails WCAG
        2.2.2 — it is also just how someone re-watches the bit they missed.
      */}
      <video
        ref={attach}
        src={src}
        className={cn(
          "relative aspect-video w-full object-cover transition-opacity duration-300",
          phase === "ready" ? "opacity-100" : "opacity-0",
        )}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        onLoadedData={() => setPhase("ready")}
        /*
          `loadeddata` needs HAVE_CURRENT_DATA, which `preload="metadata"`
          alone never reaches — it is playback that pulls in the first frame.
          So on the reduced-motion path (autoPlay off) the clip would stop at
          HAVE_METADATA and the shimmer would cover it forever. `loadedmetadata`
          always fires, and by then the element knows its dimensions.
        */
        onLoadedMetadata={() => setPhase("ready")}
        onError={() => setPhase("error")}
        aria-label={label}
      />
    </>
  );
}

/**
 * Respected for autoplay only — the clip stays available behind the play
 * button, because a tutorial the user asked to see is not "motion they did
 * not consent to". Starts `false` and resolves after mount so the server and
 * client render the same markup.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function StepRow({
  label,
  icon: Icon,
  done,
  selected,
  onSelect,
}: {
  label: string;
  icon: LucideIcon;
  done: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "step" : undefined}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
          selected
            ? "border-primary bg-primary/10"
            : "border-transparent hover:bg-bgSecondary dark:hover:bg-darkSecondaryBg",
        )}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            done
              ? "border-transparent"
              : "border-borderColor dark:border-darkBorder",
          )}
          style={done ? { backgroundColor: "var(--primary)" } : undefined}
        >
          {done && <Check className="size-3 text-white" strokeWidth={3} />}
        </span>

        <Icon
          className={cn(
            "size-4 shrink-0",
            selected
              ? "text-primary"
              : "text-subTextColor dark:text-darkTextSecondary",
          )}
        />

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            done
              ? "text-subTextColor line-through dark:text-darkTextSecondary"
              : "text-headingTextColor dark:text-darkTextPrimary",
          )}
        >
          {label}
        </span>

        {/* The tick and the strike-through are the only completion cues, and
            neither reaches a screen reader. */}
        <span className="sr-only">
          {done ? "Completed" : "Not completed"}
        </span>
      </button>
    </li>
  );
}
