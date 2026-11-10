"use client";

import {
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Ellipsis,
  Mail,
  MessageSquare,
  MonitorPlay,
  MousePointerClick,
  Music2,
  Newspaper,
  Search,
  Sparkle,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type MouseEvent,
  type Ref,
  type RefObject,
} from "react";

import SegmentedPills, {
  type SegmentedPillOption,
} from "@/components/Common/SegmentedPills";
import type { SignupSource } from "@/lib/signupSources";
import { cn } from "@/lib/utils";

/**
 * White in dark mode, except inside the selected pill: SegmentedPills keeps
 * that pill's light #edf4fe background in both themes, where white vanishes.
 */
const NEAR_BLACK_TINT =
  "text-slate-900 dark:text-white dark:[[aria-checked=true]_&]:text-slate-900";

interface SignupSourceOption {
  value: SignupSource;
  label: string;
  icon: LucideIcon;
  /**
   * Icon tint. Full class names (not built from parts) so Tailwind can see
   * them; the near-black brands flip in dark mode to stay visible.
   */
  tint: string;
}

/**
 * Labels are the customer's words, not marketing's: "Search engine" rather
 * than "Organic Search", "Friend or colleague" rather than "Referral"; the
 * console shows the marketing name for the same value.
 *
 * Display order: the channels most B2B buyers name first, the AI assistants
 * together, paid social together, and "Other" always last.
 */
const SIGNUP_SOURCE_OPTIONS: ReadonlyArray<SignupSourceOption> = [
  { value: "organic_search", label: "Search engine", icon: Search, tint: "text-[#34A853]" },
  { value: "google_ads", label: "Google Ads", icon: MousePointerClick, tint: "text-[#4285F4]" },
  { value: "referral", label: "Friend or colleague", icon: Users, tint: "text-[#F59E0B]" },
  { value: "chatgpt", label: "ChatGPT", icon: MessageSquare, tint: "text-[#10A37F]" },
  { value: "gemini", label: "Gemini", icon: Sparkles, tint: "text-[#8E75F2]" },
  { value: "claude", label: "Claude", icon: Sparkle, tint: "text-[#D97757]" },
  { value: "perplexity", label: "Perplexity", icon: Compass, tint: "text-[#20808D]" },
  { value: "facebook_ads", label: "Facebook Ads", icon: ThumbsUp, tint: "text-[#1877F2]" },
  { value: "linkedin_ads", label: "LinkedIn Ads", icon: BriefcaseBusiness, tint: "text-[#0A66C2]" },
  { value: "instagram", label: "Instagram", icon: Camera, tint: "text-[#E1306C]" },
  { value: "youtube", label: "YouTube", icon: MonitorPlay, tint: "text-[#FF0000]" },
  { value: "x_twitter", label: "X (Twitter)", icon: AtSign, tint: NEAR_BLACK_TINT },
  { value: "tiktok", label: "TikTok", icon: Music2, tint: NEAR_BLACK_TINT },
  { value: "email_campaign", label: "Email", icon: Mail, tint: "text-[#7C3AED]" },
  { value: "review_site", label: "Review site", icon: Star, tint: "text-[#FF492C]" },
  { value: "blog", label: "Blog or article", icon: Newspaper, tint: "text-[#0EA5E9]" },
  { value: "event", label: "Event or webinar", icon: CalendarDays, tint: "text-[#DB2777]" },
  { value: "other", label: "Other", icon: Ellipsis, tint: "text-slate-500 dark:text-slate-400 dark:[[aria-checked=true]_&]:text-slate-600" },
];

/** Sub-pixel scroll offsets on zoomed / HiDPI screens never read exactly 0. */
const EDGE_EPSILON = 1;
/** Width of the edge fade; also kept clear when a chip is scrolled into view. */
const FADE_PX = 28;
const LINE_HEIGHT_PX = 16;

// Built once: the icons never change, and stable elements keep the pills from
// re-rendering their icons on every keystroke elsewhere in the form.
const PILL_OPTIONS: ReadonlyArray<SegmentedPillOption<SignupSource>> =
  SIGNUP_SOURCE_OPTIONS.map(({ value, label, icon: Icon, tint }) => ({
    value,
    label,
    icon: <Icon aria-hidden="true" className={cn("size-4 shrink-0", tint)} />,
  }));

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const motion = (): ScrollBehavior =>
  prefersReducedMotion() ? "auto" : "smooth";

/** Fade only the edge(s) that still hide chips. */
const edgeMask = (start: boolean, end: boolean): string | undefined => {
  if (!start && !end) return undefined;

  const from = start ? `transparent 0, #000 ${FADE_PX}px` : "#000 0";
  const to = end
    ? `#000 calc(100% - ${FADE_PX}px), transparent 100%`
    : "#000 100%";

  return `linear-gradient(to right, ${from}, ${to})`;
};

const isScrollableY = (node: Element) => {
  const { overflowY } = window.getComputedStyle(node);
  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    node.scrollHeight > node.clientHeight + EDGE_EPSILON
  );
};

const canScrollY = (node: Element, deltaY: number, viewportHeight: number) =>
  deltaY > 0
    ? node.scrollTop + viewportHeight < node.scrollHeight - EDGE_EPSILON
    : node.scrollTop > EDGE_EPSILON;

/**
 * Whether the vertical wheel still has somewhere to go above the row: any
 * scrollable ancestor, or the page itself, that is not yet at that end.
 */
const pageCanTakeWheel = (from: HTMLElement, deltaY: number) => {
  for (let node = from.parentElement; node; node = node.parentElement) {
    if (isScrollableY(node) && canScrollY(node, deltaY, node.clientHeight)) {
      return true;
    }
  }
  const page = document.scrollingElement ?? document.documentElement;
  return canScrollY(page, deltaY, window.innerHeight);
};

/* ---- One-time tour ---------------------------------------------------- */

const TOUR_START_DELAY_MS = 900;
/** Slow enough to read the chips as they pass. */
const TOUR_SPEED_PX_PER_S = 140;
/** A very wide row (a phone) speeds up rather than gliding for longer than this. */
const TOUR_MAX_GLIDE_MS = 12_000;
const TOUR_HOLD_MS = 900;
const TOUR_RETURN_MS = 900;
/** Longest frame step honoured, so a throttled background tab cannot jump. */
const TOUR_MAX_FRAME_MS = 64;
/** Anything the user does in the row ends the tour for good. */
const ENGAGE_EVENTS = ["pointerdown", "wheel", "touchstart", "keydown", "focusin"] as const;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * People rarely scroll a row sideways on their own, so the first time it is
 * on screen the row shows itself: it glides to the last chip, holds a moment
 * and eases back to the first.
 *
 * Deliberately small: one rAF loop driving the real `scrollLeft` (so the fades,
 * arrows and keyboard focus stay truthful; a CSS transform would not), timed
 * by the clock, not by frames, and gone after one pass. It waits until the row
 * is mostly visible, pauses while the mouse is over it, and stops for good the
 * moment the user touches, clicks, wheels, types or tabs into it. It never
 * runs under `prefers-reduced-motion`, or when an answer is already picked
 * (coming back to this step).
 *
 * `onEngage` fires once, on the user's first interaction with the row.
 */
const useScrollTour = (
  scrollerRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onEngage: () => void,
) => {
  // Decided once, on mount: picking a chip later must not restart anything.
  const [startEnabled] = useState(enabled);
  const onEngageRef = useRef(onEngage);
  useLayoutEffect(() => {
    onEngageRef.current = onEngage;
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    const root = rootRef.current;
    if (!scroller || !root) return;

    let frame = 0;
    let startTimer = 0;
    let holdTimer = 0;
    let finished = !startEnabled || prefersReducedMotion();
    let paused = false;
    let phase: "waiting" | "glide" | "hold" | "return" = "waiting";
    // Our own float position: Safari rounds `scrollLeft` to whole pixels, and
    // at ~1px a frame reading it back would stall the glide.
    let position = 0;
    let speed = TOUR_SPEED_PX_PER_S;
    let lastFrame = 0;
    let returnFrom = 0;
    let returnStart = 0;

    const cancelTimers = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(startTimer);
      window.clearTimeout(holdTimer);
    };

    const finish = () => {
      finished = true;
      cancelTimers();
      visibility.disconnect();
    };

    const step = (now: number) => {
      if (finished || paused) return;
      const max = scroller.scrollWidth - scroller.clientWidth;

      if (phase === "glide") {
        const elapsed = Math.min(TOUR_MAX_FRAME_MS, now - lastFrame);
        lastFrame = now;
        position = Math.min(max, position + (speed * elapsed) / 1000);
        scroller.scrollLeft = position;

        if (position >= max - EDGE_EPSILON) {
          phase = "hold";
          holdTimer = window.setTimeout(() => {
            phase = "return";
            returnFrom = scroller.scrollLeft;
            returnStart = performance.now();
            if (!paused) frame = window.requestAnimationFrame(step);
          }, TOUR_HOLD_MS);
          return;
        }
      } else if (phase === "return") {
        const progress = Math.min(1, (now - returnStart) / TOUR_RETURN_MS);
        scroller.scrollLeft = returnFrom * (1 - easeInOutCubic(progress));
        if (progress >= 1) {
          finish();
          return;
        }
      }

      frame = window.requestAnimationFrame(step);
    };

    const begin = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (finished || max <= EDGE_EPSILON) {
        finish();
        return;
      }
      phase = "glide";
      position = scroller.scrollLeft;
      speed = Math.max(TOUR_SPEED_PX_PER_S, ((max - position) * 1000) / TOUR_MAX_GLIDE_MS);
      lastFrame = performance.now();
      if (!paused) frame = window.requestAnimationFrame(step);
    };

    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (finished || phase !== "waiting") return;
        window.clearTimeout(startTimer);
        if (entry?.isIntersecting) {
          startTimer = window.setTimeout(begin, TOUR_START_DELAY_MS);
        }
      },
      { threshold: 0.6 },
    );
    if (!finished) visibility.observe(scroller);

    const pause = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || finished) return;
      paused = true;
      window.cancelAnimationFrame(frame);
    };
    const resume = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || finished || !paused) return;
      paused = false;
      lastFrame = performance.now();
      if (phase === "return") {
        // Ease back from wherever the row is now.
        returnFrom = scroller.scrollLeft;
        returnStart = lastFrame;
      }
      if (phase === "glide" || phase === "return") {
        frame = window.requestAnimationFrame(step);
      }
    };

    let engaged = false;
    const engage = () => {
      finish();
      if (engaged) return;
      engaged = true;
      onEngageRef.current();
    };

    root.addEventListener("pointerenter", pause);
    root.addEventListener("pointerleave", resume);
    ENGAGE_EVENTS.forEach((type) =>
      root.addEventListener(type, engage, { passive: true }),
    );

    return () => {
      finish();
      root.removeEventListener("pointerenter", pause);
      root.removeEventListener("pointerleave", resume);
      ENGAGE_EVENTS.forEach((type) => root.removeEventListener(type, engage));
    };
  }, [rootRef, scrollerRef, startEnabled]);
};

/** What `ref` exposes: enough for react-hook-form to focus the field on a failed submit. */
export interface SignupSourcePickerHandle {
  focus: () => void;
}

type GroupDomProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "onBlur" | "children" | "role"
>;

interface SignupSourcePickerProps extends GroupDomProps {
  /** Pass `field.ref`, so a submit with no answer moves focus to the question. */
  ref?: Ref<SignupSourcePickerHandle>;
  value: SignupSource | null | undefined;
  onChange: (value: SignupSource) => void;
  /** Fires once focus leaves the whole group, not on every move between chips. */
  onBlur?: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * One row of source chips that scrolls sideways instead of wrapping into a
 * wall of eighteen buttons.
 *
 * The radiogroup itself (roving tab stop, arrow keys, Home/End) is
 * `SegmentedPills`, so it behaves and looks exactly like the week-start pills
 * above it. What this adds is the scrolling:
 *  - edge fades and arrow buttons appear only on a side that still hides chips;
 *  - the page comes first for a vertical mouse wheel: only once it (and any
 *    scrolling container around the card) can go no further that way does
 *    the wheel move the row sideways, so scrolling down to the submit button
 *    over the row never gets stuck;
 *  - the chip that has keyboard focus, and the picked one (including an answer
 *    kept from an earlier visit to this step), is scrolled fully clear of the
 *    fades;
 *  - a one-time tour shows people who never scroll sideways that there is
 *    more (useScrollTour), and the "more" arrow nudges until they engage.
 *
 * Activation is automatic, like the week-start and weekend pills above it
 * and native radios: arrow keys move and pick. "Other" is the last chip, so
 * its text field only appears when the user actually lands there.
 *
 * Props such as `id`, `aria-invalid` and `aria-describedby` (what the form's
 * `FormControl` injects) land on the radiogroup, where they belong.
 */
const SignupSourcePicker = ({
  ref,
  value,
  onChange,
  onBlur,
  ariaLabel,
  disabled,
  className,
  ...groupProps
}: SignupSourcePickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  // Until the user engages with the row, the "more" arrow nudges.
  const [engaged, setEngaged] = useState(value != null);
  const markEngaged = useCallback(() => setEngaged(true), []);

  useScrollTour(scrollerRef, rootRef, value == null, markEngaged);
  const hasRevealedRef = useRef(false);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const start = scroller.scrollLeft > EDGE_EPSILON;
    const end =
      scroller.scrollLeft + scroller.clientWidth <
      scroller.scrollWidth - EDGE_EPSILON;

    setEdges((previous) =>
      previous.start === start && previous.end === end
        ? previous
        : { start, end },
    );
  }, []);

  // Edge state follows scrolling (one measurement per frame at most) and any
  // change in the row's or the viewport's width: fonts loading, the card
  // reflowing at a breakpoint, a phone rotating. A layout effect, so the
  // fade and arrow are there on the first paint instead of popping in a frame
  // later every time the step mounts.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    measure();

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [measure]);

  // A non-passive native listener: React's onWheel is passive and cannot
  // preventDefault the page scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (event: WheelEvent) => {
      // Trackpads and Shift+wheel already scroll sideways; Ctrl+wheel zooms.
      if (
        event.ctrlKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      ) {
        return;
      }

      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= EDGE_EPSILON) return;

      // The page first: a wheel over the row on the way to the submit button
      // must scroll the page, not the chips.
      if (pageCanTakeWheel(scroller, event.deltaY)) return;

      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * LINE_HEIGHT_PX
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * scroller.clientWidth
            : event.deltaY;
      const next = Math.min(max, Math.max(0, scroller.scrollLeft + delta));

      // Already at that end: let the page have the wheel.
      if (Math.abs(next - scroller.scrollLeft) < EDGE_EPSILON) return;

      event.preventDefault();
      scroller.scrollLeft = next;
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, []);

  // Scrolls the row only — never the page, which `scrollIntoView` would also
  // do when the picker sits below the fold on a phone. (Browsers do not scroll
  // a chip that is already partly visible when it takes focus, so focus alone
  // would leave it half under a fade or the arrow.)
  const reveal = useCallback((chip: HTMLElement, behavior: ScrollBehavior) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const box = scroller.getBoundingClientRect();
    const rect = chip.getBoundingClientRect();
    const overflowStart = rect.left - (box.left + FADE_PX);
    const overflowEnd = rect.right - (box.right - FADE_PX);

    const delta =
      overflowStart < 0 ? overflowStart : overflowEnd > 0 ? overflowEnd : 0;
    if (delta !== 0) scroller.scrollBy({ left: delta, behavior });
  }, []);

  useEffect(() => {
    const chip = scrollerRef.current?.querySelector<HTMLElement>(
      '[role="radio"][aria-checked="true"]',
    );
    // A focused chip was already revealed by onFocus; a second animated
    // scroll measured mid-animation would overshoot.
    if (chip && chip !== document.activeElement) {
      // Instant on mount (restoring a kept answer), animated after a pick.
      reveal(chip, hasRevealedRef.current ? motion() : "auto");
    }
    hasRevealedRef.current = true;
  }, [value, reveal]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () =>
        scrollerRef.current
          ?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')
          ?.focus(),
    }),
    [],
  );

  const page = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(120, scroller.clientWidth * 0.75),
      behavior: motion(),
    });
  };

  // The arrows are a mouse convenience: keeping focus where it is means
  // paging the row never blurs the group (which would mark the field touched
  // and flash "required" before anything was picked).
  const keepFocus = (event: MouseEvent<HTMLButtonElement>) =>
    event.preventDefault();

  const mask = edgeMask(edges.start, edges.end);

  const arrowClass =
    "absolute top-1/2 z-10 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition-colors hover:text-[#0160F1] dark:bg-zinc-800 dark:text-slate-300 dark:ring-zinc-700 dark:hover:text-blue-400 [@media(pointer:coarse)]:hidden";

  return (
    // min-w-0: the parent FormItem is a grid, whose items default to
    // `min-width: auto`; the w-max chip row would then widen the track to its
    // full ~2,000px and there would be nothing left to scroll.
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-1 overflow-x-auto overscroll-x-contain px-1 py-1"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        onFocus={(event) => {
          const target = event.target as HTMLElement;
          if (target.getAttribute("role") === "radio") reveal(target, motion());
        }}
      >
        <SegmentedPills
          {...groupProps}
          options={PILL_OPTIONS}
          value={value ?? null}
          onChange={onChange}
          ariaLabel={ariaLabel}
          activation="automatic"
          outline
          size="sm"
          disabled={disabled}
          className="w-max flex-nowrap"
          onBlur={(event: FocusEvent<HTMLDivElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
          }}
        />
      </div>

      {edges.start && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onMouseDown={keepFocus}
          onClick={() => page(-1)}
          className={cn(arrowClass, "left-0")}
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {edges.end && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onMouseDown={keepFocus}
          onClick={() => page(1)}
          className={cn(arrowClass, "right-0")}
        >
          <ChevronRight
            className={cn("size-4", !engaged && "source-more-nudge")}
          />
        </button>
      )}
    </div>
  );
};

export default SignupSourcePicker;
