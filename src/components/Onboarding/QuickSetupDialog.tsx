"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { preconnect } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Check,
  FolderKanban,
  LayoutGrid,
  Loader2,
  type LucideIcon,
  MonitorDown,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { TUTORIAL_VIDEO_ORIGIN } from "@/lib/onboarding/tutorialVideos";
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
   * The clips stream from a CDN edge, so the first one costs a DNS lookup, a
   * TCP handshake and a TLS negotiation before a single byte of video moves.
   *
   * The durable half of that — DNS — is resolved far earlier, by the
   * `dns-prefetch` the dashboard layout server-renders into `<head>`; the
   * socket itself is warmed here, where we know the guide is actually on
   * screen. Gating on `open` matters: this dialog is mounted on every
   * dashboard page for every user, and holding a connection to a video CDN
   * open for people who never open the guide is not ours to spend.
   */
  if (open) preconnect(TUTORIAL_VIDEO_ORIGIN);

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
                      Keyed by src so each step gets a fresh element, fresh
                      load state and a fresh retry budget — no cross-step
                      races, and only the selected step's clip is ever
                      mounted. That last part matters more now the clips are
                      remote: mounting all five would open five concurrent
                      CDN streams and starve the one the user is watching.
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
 * A transient CDN hiccup — a dropped edge connection, a DNS blip on a phone
 * switching from wifi to cellular — is not a reason to permanently replace the
 * tutorial with a placeholder, so one silent retry comes first. Two would just
 * make a genuinely broken URL take twice as long to admit it.
 */
const VIDEO_RETRY_LIMIT = 1;
const VIDEO_RETRY_DELAY_MS = 700;

/**
 * How long to wait for the element to acquire *anything* before giving up.
 * Deliberately generous, and deliberately conditional on `readyState === 0`:
 * a slow connection that has already produced metadata is working and must be
 * left alone, but a request that never returns a byte (captive portal, proxy
 * that blackholes the CDN) otherwise pulses the shimmer forever.
 */
const VIDEO_LOAD_TIMEOUT_MS = 15_000;

/**
 * How long the element has to be starved before we admit it on screen.
 *
 * A looping clip re-buffers at every loop boundary — measured in Chrome
 * against these clips, `seeking → waiting → seeked → canplay → playing` lands
 * in ~60ms — so a spinner wired straight to `waiting` blinks once per lap on a
 * video that is playing perfectly. Anything that clears well inside this
 * window was never worth telling the user about.
 */
const VIDEO_STALL_GRACE_MS = 300;

/**
 * One step's screen recording, streamed from the CDN.
 *
 * Mounted per step and keyed by `src`, so its load state is the element's own
 * and cannot be inherited by the next step. Three states, because a preview
 * pane that can only ever say "loading" is worse than no preview: the clip
 * loads, or it fails and we say so and offer a retry over the designed panel
 * that videoless steps already use.
 *
 * Buffering is tracked separately from loading, and *derived* rather than
 * accumulated. Once the first frame is up the element is visible, and a
 * mid-clip stall would otherwise read as a frozen, broken video rather than as
 * "waiting for the network". Reading the answer off the element on every
 * relevant event — instead of toggling a flag from `waiting`/`playing` pairs —
 * means no event ordering can strand a spinner over a paused, perfectly happy
 * video.
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
  /** The element's real state, updated on every relevant media event. */
  const [buffering, setBuffering] = useState(false);
  /** ...and the same thing after the grace period, which is what is drawn. */
  const [stalled, setStalled] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const retries = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Where playback was when the network dropped, so a retry can resume there. */
  const resumeAt = useRef(0);

  /**
   * A clip already in the HTTP cache can hold frames before React attaches
   * the media listeners, and `loadeddata` does not fire again for it — the
   * video would sit at `opacity-0` behind an endless shimmer. Read
   * `readyState` at attach time instead of trusting the event alone.
   */
  const attach = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    // HAVE_CURRENT_DATA — there is a frame to show.
    if (node && node.readyState >= 2) setPhase("ready");
  }, []);

  /**
   * Buffering means one thing: we want to be playing and there is not enough
   * data to keep going. A paused or ended element is never buffering, however
   * it got there.
   */
  const syncBuffering = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    // HAVE_FUTURE_DATA — enough to advance at least one frame.
    setBuffering(!el.paused && !el.ended && el.readyState < 3);
  }, []);

  /** Only a real frame reveals the element; metadata alone is a black box. */
  const handleFrame = useCallback(() => {
    const el = videoRef.current;
    if (el && resumeAt.current > 0) {
      // Restore the position a retry interrupted, once there is something to
      // seek within. Cleared first so a later loop does not re-seek.
      const target = Math.min(resumeAt.current, el.duration || resumeAt.current);
      resumeAt.current = 0;
      if (Number.isFinite(target) && target > 0) el.currentTime = target;
    }
    setPhase("ready");
    syncBuffering();
  }, [syncBuffering]);

  const handleError = useCallback(() => {
    const el = videoRef.current;
    const hadFrame = (el?.readyState ?? 0) >= 2;

    if (retries.current >= VIDEO_RETRY_LIMIT) {
      setPhase("error");
      setBuffering(false);
      return;
    }
    retries.current += 1;
    resumeAt.current = el?.currentTime ?? 0;

    // A mid-playback drop keeps the last decoded frame on screen with the
    // spinner over it. Blanking a tutorial the user is reading back to a
    // pulsing grey rectangle is a worse answer to a two-second outage than
    // simply looking busy.
    if (hadFrame) setBuffering(true);
    else setPhase("loading");

    retryTimer.current = setTimeout(() => {
      // `load()` restarts the whole resource selection algorithm, which is
      // what re-fires `error` if the URL is genuinely dead — so the budget
      // above really does terminate.
      videoRef.current?.load();
    }, VIDEO_RETRY_DELAY_MS);
  }, []);

  /**
   * The budget resets only once frames are actually advancing. Resetting it
   * anywhere earlier — on `loadedmetadata`, say, which fires on every `load()`
   * attempt and is reachable straight from the HTTP cache — would turn a dead
   * URL into an unbounded reload loop.
   */
  const handlePlaying = useCallback(() => {
    retries.current = 0;
    setBuffering(false);
  }, []);

  /**
   * The error state unmounts the `<video>` entirely, so there is no element
   * left to `load()` — setting the phase back to "loading" mounts a fresh one
   * against the same `src`, and mounting is what restarts the fetch.
   */
  const retryNow = useCallback(() => {
    retries.current = 0;
    resumeAt.current = 0;
    setPhase("loading");
  }, []);

  useEffect(() => {
    if (!buffering) {
      setStalled(false);
      return;
    }
    const timer = setTimeout(() => setStalled(true), VIDEO_STALL_GRACE_MS);
    return () => clearTimeout(timer);
  }, [buffering]);

  useEffect(() => {
    /*
      Captured here, not read in the cleanup. React detaches refs during the
      mutation phase but runs passive cleanups afterwards, so by teardown time
      `videoRef.current` is already null and every line below would silently
      no-op. Refs *are* attached before effects first run, so the mount-time
      read is the one that is guaranteed to see the element.
    */
    const el = videoRef.current;

    const timeout = setTimeout(() => {
      // Nothing at all after 15s: not slow, blocked.
      if ((el?.readyState ?? 0) === 0) setPhase("error");
    }, VIDEO_LOAD_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      /*
        Detaching the element does not reliably cancel its in-flight range
        requests — that happens whenever the browser gets round to collecting
        it. Clicking through four steps would otherwise leave four CDN streams
        competing for the link with the one clip the user is actually watching.
        Emptying the source and re-running resource selection aborts it now.
      */
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    };
  }, []);

  if (phase === "error") {
    return (
      <div className="relative">
        {fallback}
        {/*
          Distinct from the panel a videoless step shows. Without this the two
          are pixel-identical, and a user behind a proxy that blocks the CDN
          concludes the product simply ships no tutorials rather than that
          something failed and is worth retrying.
        */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-bgPrimary/85 px-3 py-2 backdrop-blur-sm dark:bg-darkPrimaryBg/85">
          <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
            Tutorial video couldn&apos;t load
          </span>
          <button
            type="button"
            onClick={retryNow}
            className="shrink-0 cursor-pointer rounded-[6px] border border-borderColor px-2 py-1 text-xs font-medium text-headingTextColor transition-colors hover:bg-bgSecondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none dark:border-darkBorder dark:text-darkTextPrimary dark:hover:bg-darkTertiaryBg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {phase === "loading" && (
        /* The shimmer sits on the container's own bg, so it has to differ
           from it in BOTH themes or the pulse is invisible. `motion-reduce`
           keeps the tint and drops the animation for anyone who asked for
           less of it. */
        <div className="absolute inset-0 animate-pulse bg-borderColor motion-reduce:animate-none dark:bg-darkTertiaryBg" />
      )}

      {stalled && phase === "ready" && (
        /* Top-LEFT, not top-right: the dialog's own close button is a 32px
           chip at right-3/top-3 of the dialog, and this container's top-right
           corner sits ~10px inside it — a dark disc would take a bite out of
           it. The bottom edge belongs to the native control bar.
           `pointer-events-none` keeps it off both. Hidden from the a11y tree:
           the media element already exposes its own buffering state, and a
           second, wordless announcement on every micro-stall is noise. */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm"
        >
          <Loader2 className="size-4 animate-spin text-white motion-reduce:animate-none" />
        </div>
      )}

      {/*
        Muted screen recordings, so autoplay is allowed and captions have
        nothing to say. `controls` is not decoration: these run 30s+ on a
        loop, and auto-starting motion that cannot be paused fails WCAG
        2.2.2 — it is also just how someone re-watches the bit they missed.

        No `crossOrigin`: the bucket serves these without CORS headers, and
        setting the attribute would turn every request into a CORS request the
        CDN answers without `Access-Control-Allow-Origin` — i.e. it would break
        playback to buy a tainted-canvas guarantee nothing here needs.
      */}
      <video
        ref={attach}
        /*
          `#t=0.1` is a media fragment: it makes the browser seek, which forces
          it to fetch and decode one real frame instead of stopping at
          HAVE_METADATA with nothing to paint. That covers every path where
          playback does not start on its own — `prefers-reduced-motion`, and
          equally a browser that simply refuses the autoplay (iOS Low Power
          Mode, Safari's per-site "never auto-play").

          It is appended unconditionally, and that is the point. `autoPlay`
          comes from a media query resolved in an effect *after* mount, so a
          fragment conditional on it would rewrite `src` one tick into the
          load and make the browser abort an in-flight multi-MB range request
          and start over. The URL has to be stable from the first render.
        */
        src={`${src}#t=0.1`}
        className={cn(
          "relative aspect-video w-full object-cover transition-opacity duration-300",
          phase === "ready" ? "opacity-100" : "opacity-0",
        )}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        controls
        /*
          Note this is a floor, not a cap: once `autoPlay` is set the spec has
          the element fetch whatever playback needs, so `preload` only really
          governs the reduced-motion path. What actually stops five clips
          downloading at once is that the parent mounts exactly one — keyed by
          `src` — and the unmount teardown above aborts the outgoing one.
        */
        preload="metadata"
        /*
          Reveal on a real frame only. `loadedmetadata` fires as soon as the
          element knows its dimensions, which on a remote clip is well before
          there is anything to paint — revealing there swaps the shimmer for a
          black rectangle. `seeked` is the fragment's completion signal.
        */
        onLoadedData={handleFrame}
        onSeeked={handleFrame}
        onWaiting={syncBuffering}
        onStalled={syncBuffering}
        onSuspend={syncBuffering}
        onProgress={syncBuffering}
        onCanPlay={syncBuffering}
        onTimeUpdate={syncBuffering}
        onPause={syncBuffering}
        onEnded={syncBuffering}
        onPlaying={handlePlaying}
        onError={handleError}
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
