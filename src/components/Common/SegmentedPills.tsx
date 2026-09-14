"use client";

import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SegmentedPillOption<TValue extends string | number> {
  value: TValue;
  label: string;
  /** Small trailing chip — "Save 20%", a count, a hint. */
  badge?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

/**
 * Every `<div>` prop except the ones this component owns outright.
 *
 * The rest spread this enables is not a convenience. `FormControl` injects
 * `id`, `aria-describedby` and `aria-invalid` into its child through a Radix
 * `Slot`, and a component that destructures its props without a rest spread
 * eats all three in silence — `FormLabel`'s `htmlFor={formItemId}` would then
 * point at an element that does not exist.
 *
 * What the spread does NOT buy is a `FormMessage` error read out on focus.
 * Both aria props land on the `div[role="radiogroup"]`, and focus never lands
 * there: it lands on a child `button[role="radio"]`, so whether the group's
 * description is voiced is the screen reader's call, not ours. Forcing it
 * would mean copying `aria-describedby` onto every pill — re-reading the error
 * on each of up to seven arrow presses — and `aria-invalid` is a state
 * `radiogroup` supports but `radio` does not, so there is no honest place to
 * put it on a pill. Neither is worth buying here, because the error state is
 * unreachable in the only form that renders these pills:
 * `DEFAULT_WORKSPACE_PREFERENCES` seeds `week_start` and `weekly_leave_count`
 * with valid values, and a pill can only ever write one of the schema's own
 * enum members (or 1–3 against a 0–7 bound). The spread earns its place on
 * `id` alone; it is not an error-announcement fix.
 */
type SegmentedPillsDomProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "role" | "children"
>;

/**
 * When a keyboard move commits.
 *
 * `automatic` — arrows and Home/End select as they move. The ARIA radiogroup
 * default, and the right one for a preference row like the weekday pills: a
 * pill commits on a single click with no confirming gesture, so focus-only
 * arrows would leave the keyboard user looking at a different state than the
 * mouse user who made the same gesture.
 *
 * `manual` — arrows and Home/End move focus only; Space/Enter commits the
 * focused pill (native `<button>` activation, so `onClick` already *is* the
 * commit). This is the WAI-ARIA manual-activation pattern, and it is the only
 * safe mode when `onChange` does real work rather than setting state:
 * select-on-move turns a keyboard user merely READING the row into one side
 * effect per keystroke, and key auto-repeat — holding an arrow down, which
 * wraps here forever — turns that into an unbounded stream of them.
 * `BillingTabs` pushes a history entry and refetches a `force-dynamic` RSC
 * page per move (Back then walks backwards through tabs instead of leaving
 * Settings); the checkout summary's cycle toggle re-prices the order and drops
 * the pending PaymentIntent per move.
 */
export type SegmentedPillsActivation = "automatic" | "manual";

interface SegmentedPillsProps<TValue extends string | number>
  extends SegmentedPillsDomProps {
  options: ReadonlyArray<SegmentedPillOption<TValue>>;
  value: TValue | null;
  onChange: (value: TValue) => void;
  /**
   * Accessible name for the group — still required even where a `FormLabel`
   * sits above it. `htmlFor` only names (and only moves focus to) *labelable*
   * elements, and a `div[role="radiogroup"]` is not one, so the visible label
   * cannot name this group no matter what `id` it is handed. Several call
   * sites (the billing tabs, both pricing grids, the checkout summary) have no
   * label element at all, which is why this cannot be optional.
   *
   * Where the caller DOES render visible label text — the seat dialog's
   * "Billing cycle" heading — it points `aria-labelledby` at that text
   * instead. That wins outright over this name (see the group element below),
   * so the label is never announced twice.
   */
  ariaLabel: string;
  /**
   * When a keyboard move commits — see `SegmentedPillsActivation`. Defaults to
   * `automatic`, which is what a true preference row wants and what most call
   * sites here are. Pass `manual` wherever `onChange` navigates, fetches or
   * mutates instead of setting local state.
   */
  activation?: SegmentedPillsActivation;
  disabled?: boolean;
  size?: "sm" | "md";
  /** `segmented` = one shared track (toggles); `loose` = free-standing pills. */
  variant?: "segmented" | "loose";
  /**
   * Spread the options across equal columns instead of sizing each to its own
   * label. Use it when the row must stay on ONE line at a known width — seven
   * weekday abbreviations otherwise wrap "Sun" onto its own row and break the
   * two-column rhythm beside it.
   */
  fill?: boolean;
}

/**
 * One horizontal row of mutually exclusive pills.
 *
 * The repo has no `ui/tabs.tsx` and no radio-group primitive — every tab strip
 * and toggle is hand-rolled `<button>`s, which had produced four near-identical
 * implementations (settings tabs, notification tabs, payroll settings, the two
 * billing cycle toggles). This is that markup extracted once, so the week-start
 * row, the weekend-length row, the pricing cycle toggle and the billing tabs
 * all resolve identically.
 *
 * It stays a `radiogroup` rather than a `tablist` even though `BillingTabs` now
 * mounts a panel from this selection (it did not when the row was extracted).
 * A `tablist` owes its panels `aria-controls`/`id` wiring and a `tabpanel` on
 * the other end; none of the call sites have that, and a tablist that cannot
 * point at its panel is a worse lie than a radiogroup that happens to drive
 * one. "3 of 7 selected" is also the right announcement for the week-start
 * row, which is most of the usage.
 *
 * Known mismatch, deliberately accepted: the radiogroup pattern specifies
 * arrows that move focus AND check, so `activation="manual"` is really the
 * tablist affordance worn by a radiogroup. A screen-reader user arrowing the
 * billing strip hears "Invoice, radio, not checked" and can cross the row
 * without changing anything — honest about what happened, but not the role's
 * own contract. Closing it properly means making those two call sites real
 * tablists with `aria-controls`/`tabpanel` wiring, not renaming the strings.
 *
 * Keyboard (the ARIA radiogroup contract, which the DOM here claims and must
 * therefore honour):
 *   Tab / Shift+Tab  enter and leave the group — ONE stop for the whole row,
 *                    not one per pill (seven, for the weekday row). Entry lands
 *                    on the selected pill, or the first enabled one.
 *   Arrow Right/Down move to the next pill
 *   Arrow Left/Up    move to the previous pill
 *   Home / End       jump to the first / last pill
 *   Space / Enter    native `<button>` activation, i.e. select the focused pill
 * Whether those movement keys ALSO select is `activation`'s call — automatic
 * (the radiogroup default) or manual. Movement wraps at both ends and steps
 * over disabled pills, which would otherwise be a dead end a keyboard user has
 * to Tab out of.
 */
const SegmentedPills = <TValue extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  activation = "automatic",
  disabled,
  size = "md",
  variant = "segmented",
  fill = false,
  className,
  style,
  "aria-labelledby": ariaLabelledBy,
  onBlur: onBlurProp,
  ...groupProps
}: SegmentedPillsProps<TValue>) => {
  // Arrow keys have to move real DOM focus, and the pills are plain elements
  // with no other handle on them.
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * The pill focus is on, or `-1` while focus is anywhere outside the group.
   *
   * The tab stop cannot be derived from `value` alone once arrows stop
   * selecting: under `manual` activation the focused pill and the selected pill
   * are different elements for as long as the user is browsing the row, and a
   * stop pinned to the selection would leave `tabIndex={-1}` on the element
   * that actually has focus — Shift+Tab back in would then snap the user to the
   * selection mid-move, and the row's tab state would describe a pill the user
   * is not on. Tracked under `automatic` too rather than behind a branch: there
   * the focused pill IS the selected one, so it resolves to exactly what the
   * old value-only derivation gave, minus the case where a controlled parent
   * declines the change and focus would otherwise sit on a pill with no stop.
   */
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isEnabled = (index: number) => {
    const option = options[index];
    return Boolean(option) && !disabled && !option.disabled;
  };

  /**
   * Roving tab stop — ONE for the whole row.
   *
   * Focus owns it while the user is inside the group; otherwise the selected
   * pill does, so Tab lands where the user left the row rather than at its
   * head. With nothing selected the first enabled pill takes it — the weekend
   * row deliberately leaves every pill unselected when the stored number is
   * outside the offered set, and that row still has to be reachable. `-1`
   * (whole group disabled) simply means no stop, which is what a disabled
   * control should be.
   *
   * Leaving the group clears `focusedIndex` (see the group's `onBlur`), so
   * re-entering by Tab lands on the SELECTED pill, never on whatever pill was
   * last arrowed past. Under manual activation that is the whole point: an
   * uncommitted pill is not a place to strand someone, and "enter the group on
   * the checked radio" is the radiogroup's own entry rule.
   */
  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabStopIndex = isEnabled(focusedIndex)
    ? focusedIndex
    : isEnabled(selectedIndex)
      ? selectedIndex
      : options.findIndex((_, index) => isEnabled(index));

  /** Next enabled pill `delta` steps from `from`, wrapping; `-1` if none. */
  const stepTo = (from: number, delta: 1 | -1) => {
    const count = options.length;
    for (let offset = 1; offset <= count; offset += 1) {
      const index = (((from + delta * offset) % count) + count) % count;
      if (isEnabled(index)) return index;
    }
    return -1;
  };

  const moveTo = (index: number) => {
    if (index < 0) return;
    // Focus first, always: it is the whole of a manual move, and the thing that
    // makes an automatic one visible. The pill's own `onFocus` records the new
    // tab stop, so there is no second bookkeeping path to keep in step.
    pillRefs.current[index]?.focus();

    // Manual activation stops here — Space/Enter fire the button's `onClick`,
    // which is the commit. See `SegmentedPillsActivation` for why the two
    // side-effecting call sites cannot afford select-on-move.
    if (activation === "manual") return;

    const option = options[index];
    if (option.value !== value) onChange(option.value);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let target: number;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = stepTo(index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = stepTo(index, -1);
        break;
      case "Home":
        target = stepTo(-1, 1);
        break;
      case "End":
        target = stepTo(0, -1);
        break;
      default:
        return;
    }

    // Left unhandled these scroll the dialog out from under the row.
    event.preventDefault();
    moveTo(target);
  };

  return (
    <div
      {...groupProps}
      role="radiogroup"
      // Exactly one name, never two: `aria-label` is the group's name, and it
      // steps aside entirely if a caller points `aria-labelledby` at real
      // label text, so the two can never both be announced.
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onBlur={(event) => {
        // Focus moving BETWEEN pills is not leaving the group, and must not
        // hand the tab stop back to the selected pill mid-move. Only a
        // relatedTarget outside the row — or none at all, which is what a click
        // onto dead space reports — counts as an exit.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedIndex(-1);
        }
        onBlurProp?.(event);
      }}
      style={
        fill
          ? {
              gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
              ...style,
            }
          : style
      }
      className={cn(
        "items-center gap-1",
        // A long row has to survive a phone without clipping the last pill, so
        // the free-sized track wraps rather than overflowing. `fill` trades that
        // for equal columns, which cannot wrap by construction.
        fill ? "grid w-full" : "inline-flex flex-wrap",
        variant === "segmented" &&
          "rounded-lg border border-borderColor bg-bgSecondary p-1 dark:border-darkBorder dark:bg-darkTertiaryBg",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        const Icon = option.icon;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={String(option.value)}
            ref={(element) => {
              pillRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStopIndex ? 0 : -1}
            disabled={isDisabled}
            // Guarded exactly as the arrow path is (`moveTo`): re-committing
            // the pill that is ALREADY selected must be a no-op. A <button>
            // activates on Enter KEYDOWN, which auto-repeats, so an unguarded
            // click handler fires once per repeat tick — which would rebuild,
            // on Enter, the very storm `activation="manual"` removes from the
            // arrows (a router.push + force-dynamic refetch per tick on the
            // billing tabs; a requote() that discards the pending
            // PaymentIntent per tick on checkout). It also stops a plain mouse
            // click on the active pill from pushing a duplicate history entry
            // or re-quoting an unchanged cycle.
            onClick={() => {
              if (option.value !== value) onChange(option.value);
            }}
            // The one place the roving tab stop is written, so it cannot drift
            // from where focus actually is: arrow moves, clicks and Tab entry
            // all arrive here.
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-all",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              // In fill mode the column sets the width, so the label must be
              // allowed to shrink inside it rather than forcing the track wider.
              fill ? "min-w-0" : "shrink-0",
              size === "sm"
                ? cn("h-8 text-[13px]", fill ? "px-1" : "px-2.5")
                : cn("h-9 text-[13px] sm:text-sm", fill ? "px-1.5" : "px-3 sm:px-4"),
              // A `loose` pill stands on the page background instead of inside a
              // track, so it carries no border and no resting fill: the blue
              // selected pill is the only painted surface in the row, and the
              // taller, roomier box is what keeps an unpainted pill reading as a
              // target. The roomy box is withheld from `sm` (a compact row asked
              // for a compact pill) and the wider gutters from `fill`, where the
              // column already owns the width and padding would only squeeze the
              // label.
              variant === "loose" &&
                cn(
                  "gap-2 rounded-lg",
                  size === "md" && cn("h-11 text-sm", !fill && "px-4 sm:px-5"),
                  !selected && "hover:bg-bgSecondary dark:hover:bg-darkTertiaryBg",
                ),
              selected
                ? "bg-primary text-white shadow-sm dark:text-white"
                : "text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {option.label}
            {option.badge && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold",
                  selected
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary dark:bg-primary/20",
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedPills;
