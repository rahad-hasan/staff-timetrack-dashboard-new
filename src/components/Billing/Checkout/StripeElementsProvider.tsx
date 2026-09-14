"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, StripeElementsOptions } from "@stripe/stripe-js";
import { useTheme } from "next-themes";
import { AlertTriangle } from "lucide-react";

import { getStripe, isStripeConfigured } from "@/lib/stripeClient";

/**
 * The `<Elements>` boundary every card surface mounts inside.
 *
 * Two things here are easy to get wrong and both are invisible until a user
 * hits them:
 *
 * - **The Stripe promise must be stable.** `getStripe()` is a module-level
 *   singleton for exactly this reason: handing `<Elements>` a fresh promise on
 *   each render remounts the payment iframes and discards whatever the user had
 *   typed.
 * - **`appearance` must follow the theme.** Stripe renders the card fields in a
 *   cross-origin iframe, so our CSS cannot reach them — the only way they turn
 *   dark is this object. It is rebuilt whenever the resolved theme flips and
 *   `<Elements>` re-reads it — an options change is an `elements.update()`, not
 *   a remount — otherwise a user on dark mode gets a white slab in the middle
 *   of the form. It has to be resolved on the FIRST client render rather than
 *   the second, or that slab still flashes; see `domPrefersDark`.
 *
 * Colours are the literal values behind the theme tokens in globals.css rather
 * than `var(--…)`: the iframe has no access to our custom properties, so a
 * `var()` reference there resolves to nothing and Stripe silently falls back to
 * its own palette.
 */

/* Mirrors globals.css. Keep in step with the tokens, which the iframe cannot read. */
const LIGHT = {
  bg: "#ffffff",
  text: "#0f1613",
  muted: "#505553",
  /**
   * The literal behind `border-input` (oklch(0.922 0 0)) — the edge on the
   * `<Input>` directly above these fields on BOTH surfaces, and on checkout's
   * country trigger below them, which CardInformationPanel draws with
   * `border-input` as well.
   *
   * The drawer's country trigger is the one edge this does not meet: that one
   * is ComboboxField's `variant="outline2"` = `border-borderColor` (#dce3e3),
   * a shade cooler. Adopting #dce3e3 here would settle that seam and open three
   * more — checkout's input and trigger and the drawer's input are all #e5e5e5
   * — so outline2 is the odd edge out, and squaring it belongs in ComboboxField
   * rather than here. Light-mode only: in dark all four controls carry
   * `dark:border-darkBorder` and already agree.
   */
  border: "#e5e5e5",
  /**
   * `placeholder:text-muted-foreground` (oklch(0.556 0 0)). The subTextColor
   * grey used for body copy is dark enough at this size that "1234 1234 1234
   * 1234" reads as a value already typed in rather than as a prompt.
   */
  placeholder: "#737373",
  /**
   * `--destructive` (oklch(0.577 0.245 27.325)). In Tailwind v4 that is also
   * exactly what `text-red-600` resolves to, so one literal covers the drawer's
   * `FormMessage` (`text-destructive`), checkout's inline name error
   * (`text-red-600`) and the `aria-invalid:border-destructive` edge our inputs
   * draw. NOT #dc2626 — that is v3's red-600, a red nothing in this app has
   * painted since the v4 upgrade.
   */
  danger: "#e7000b",
} as const;

const DARK = {
  bg: "#031229",
  text: "#F3F4F6",
  muted: "#bdbdbd",
  /**
   * `dark:border-darkBorder` is #4a5263ab — this is that token flattened over
   * darkPrimaryBg, the background both surfaces put behind these fields. The
   * iframe needs an opaque value (an alpha edge in there composites against
   * whatever Stripe paints beneath, not against our panel), and the unflattened
   * #4a5263 came out a visibly lighter edge than our own inputs'.
   */
  border: "#333d50",
  /** `placeholder:text-muted-foreground` in dark (oklch(0.708 0 0)). */
  placeholder: "#a1a1a1",
  /** `--destructive` in dark (oklch(0.704 0.191 22.216)) = v4's `red-400`. */
  danger: "#ff6467",
} as const;

/**
 * `--primary` in globals.css, spelled out rather than referenced because the
 * iframe cannot read our custom properties: a `var(--primary)` sent through the
 * Appearance API resolves to nothing inside Stripe's origin and the field
 * quietly falls back to Stripe's own blue.
 *
 * One literal serves both themes — `.dark` does not redeclare `--primary` (its
 * override is commented out there), so the focus ring is this blue either way.
 */
const PRIMARY = "#0788f3";

/**
 * The theme as the DOM already has it.
 *
 * next-themes stamps `class="dark"` onto `<html>` from a blocking script in
 * `<head>`, so this is settled before React runs — which makes it the right
 * answer on any render where `resolvedTheme` has none to give. That is the
 * server, where there is no document and light is the only honest guess, and
 * any mount outside a `ThemeProvider`, where `useTheme()` hands back a fallback
 * object carrying no `resolvedTheme` at all and a dark user would otherwise be
 * pinned to the white appearance permanently.
 *
 * Safe to read during render: `isDark` feeds `appearance` and nothing else, and
 * `appearance` goes to Stripe.js rather than into our own markup — server and
 * client emit identical HTML either way, so hydration has nothing to disagree
 * about. Reading it here rather than gating the render on a `mounted` flag is
 * deliberate: on checkout the whole page sits inside this provider, so a gate
 * would blank it for a frame to fix a colour.
 */
const domPrefersDark = (): boolean =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

const buildAppearance = (isDark: boolean): Appearance => {
  const c = isDark ? DARK : LIGHT;

  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      colorPrimary: PRIMARY,
      colorBackground: c.bg,
      colorText: c.text,
      colorTextSecondary: c.muted,
      colorTextPlaceholder: c.placeholder,
      colorDanger: c.danger,
      // Matches the app's --radius (0.5rem) and the h-10 inputs elsewhere.
      borderRadius: "8px",
      spacingUnit: "4px",
      fontSizeBase: "14px",
      // Roboto leads the stack because the app is rendered in it (next/font in
      // layout.tsx), but next/font self-hosts the face at our origin and the
      // iframe cannot reach it — so this only lands where Roboto is installed
      // locally, and everywhere else falls through to the same system stack the
      // app's own --font-sans ends in.
      fontFamily:
        'Roboto, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    },
    rules: {
      /**
       * Sized to sit flush with the h-10 (40px) inputs around it. The Appearance
       * API accepts no `height`, so the 40px is rebuilt out of the properties it
       * does take: 9px + a 20px line box (text-sm) + 9px + the two 1px borders.
       * Background is the panel colour rather than a lifted slab because our own
       * inputs are `bg-transparent` — on both surfaces the panel behind them is
       * bgPrimary / darkPrimaryBg, so the field is defined by its border alone.
       */
      ".Input": {
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: "none",
        padding: "9px 12px",
        fontSize: "14px",
        lineHeight: "20px",
      },
      // Pins the card fields specifically; the variable above covers the rest of
      // the placeholder text Stripe renders.
      ".Input::placeholder": { color: c.placeholder },
      ".Input:focus": {
        border: `1px solid ${PRIMARY}`,
        // The app's focus affordance is the ring, so suppress the UA outline
        // that would otherwise sit on top of it — same trade ui/input.tsx makes
        // with `outline-none` + `focus-visible:ring-[3px]`.
        outline: "none",
        boxShadow: `0 0 0 3px ${PRIMARY}33`,
      },
      ".Input--invalid": {
        border: `1px solid ${c.danger}`,
        boxShadow: "none",
      },
      /**
       * Without this, the `boxShadow: none` above would strip the focus halo
       * from exactly the field the user has been asked to go back and fix. The
       * alphas mirror `aria-invalid:ring-destructive/20` and its dark /40.
       */
      ".Input--invalid:focus": {
        border: `1px solid ${c.danger}`,
        outline: "none",
        boxShadow: `0 0 0 3px ${c.danger}${isDark ? "66" : "33"}`,
      },
      /**
       * The two surfaces label their fields differently, so one rule cannot be
       * exact on both:
       *
       * - Checkout hand-rolls its own `LABEL` const in CardInformationPanel —
       *   `mb-1.5 block text-sm font-medium`, a 20px line box over a 6px
       *   margin. These values are that, to the pixel.
       * - The drawer goes through `FormLabel` → `ui/label.tsx`
       *   (`text-sm leading-none font-medium`, so a 14px line box) inside
       *   FormItem's `grid gap-2`; there the 8px below the label is the grid's,
       *   and no margin is involved at all.
       *
       * 26px against 22px on paper, but 9px against 8px of visible whitespace:
       * a 20px line box around 14px text leaves 3px of half-leading under the
       * glyphs that `leading-none` does not. Switching to the drawer's numbers
       * would win that 1px on one surface and lose it on the other, and
       * `line-height: 1` is a poor bet in here, where the face is whatever the
       * system stack resolves to rather than the Roboto we requested.
       */
      ".Label": {
        color: c.text,
        fontSize: "14px",
        lineHeight: "20px",
        fontWeight: "500",
        marginBottom: "6px",
      },
      /**
       * 6px is checkout's inline name error (`mt-1.5 text-sm text-red-600`),
       * exactly. `FormMessage` in the drawer carries NO margin of its own
       * (`text-destructive text-sm`) — its 8px is the same FormItem grid gap
       * that spaces the label above — so this reads 2px tight there and exact
       * on checkout, the same trade `.Label` makes for the same reason.
       *
       * The colour needs no such trade: `text-destructive` and v4's
       * `text-red-600` are one value, and `danger` is it.
       */
      ".Error": {
        color: c.danger,
        fontSize: "14px",
        lineHeight: "20px",
        marginTop: "6px",
      },
      // Checkout mounts the Element with `layout: "tabs"`, so these still render
      // there whenever more than one payment method is enabled.
      ".Tab": {
        border: `1px solid ${c.border}`,
        boxShadow: "none",
        backgroundColor: c.bg,
      },
      ".Tab:hover": {
        color: c.text,
        border: `1px solid ${PRIMARY}66`,
      },
      ".Tab--selected": {
        color: PRIMARY,
        border: `1px solid ${PRIMARY}`,
        boxShadow: `0 0 0 3px ${PRIMARY}22`,
      },
    },
  };
};

/**
 * Rendered in place of the card fields when the publishable key is missing.
 * Failing loudly here beats an empty gap where the form should be — a blank
 * card panel looks like a slow network and users retry forever.
 */
const StripeUnavailable = () => (
  <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
    <div>
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        Card payments are unavailable right now.
      </p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
        Our payment provider is not configured. Please contact support — your
        account has not been charged.
      </p>
    </div>
  </div>
);

export default function StripeElementsProvider({
  clientSecret = null,
  mode = "subscription",
  amount,
  currency = "usd",
  children,
}: {
  /**
   * An existing PaymentIntent / SetupIntent secret. Single-use and
   * tenant-scoped — never log it and never put it in a URL.
   *
   * Leave it null to mount in **deferred mode**, which is what the checkout
   * page does. That is not an optimisation, it is a correctness requirement:
   * Stripe cannot move a mounted Elements group between deferred and
   * secret-bound mode, so a provider that waited for the secret would have to
   * remount the card iframes the moment the intent was created — throwing away
   * the card the user had just finished typing. Deferred mode creates the
   * intent only after `elements.submit()` has validated the fields, so the
   * group is mounted exactly once for the life of the page.
   */
  clientSecret?: string | null;
  mode?: "payment" | "setup" | "subscription";
  /**
   * Order total in the smallest currency unit. Deferred mode needs it so
   * Stripe can decide which payment methods to offer. Changing it (a new seat
   * count, a discount) updates the mounted group in place — it does NOT
   * remount, so the typed card survives a re-quote.
   */
  amount?: number;
  currency?: string;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  /**
   * Never a bare `resolvedTheme === "dark"`: an undefined theme reads as light
   * there, and a light `appearance` handed to `stripe.elements()` is the white
   * slab this file exists to prevent — briefly, if a second render corrects it,
   * and for good if nothing ever does.
   */
  const isDark =
    resolvedTheme === undefined ? domPrefersDark() : resolvedTheme === "dark";

  const appearance = useMemo(() => buildAppearance(isDark), [isDark]);

  const options = useMemo<StripeElementsOptions>(() => {
    if (clientSecret) return { clientSecret, appearance };
    if (mode === "setup") return { mode, currency, appearance };
    return {
      mode,
      currency,
      // Stripe rejects a zero/absent amount in deferred payment modes. The
      // real total arrives with the first quote; 0 would be refused, so hold
      // at the minimum chargeable unit until it does.
      amount: Math.max(1, amount ?? 1),
      appearance,
    };
  }, [clientSecret, mode, amount, currency, appearance]);

  // `getStripe()` resolves null for BOTH a missing key and a blocked script, so
  // this one branch covers configuration and network failure alike. Without it
  // a blocked js.stripe.com renders an empty gap where the card fields should
  // be, beside a pay button that can never enable.
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getStripe().then((stripe) => {
      if (!cancelled && !stripe) setLoadFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isStripeConfigured() || loadFailed) return <StripeUnavailable />;

  return (
    <Elements
      // Keyed on MODE, never on the secret's value: a group must be rebuilt if
      // it switches between deferred and secret-bound, but re-quoting inside
      // one mode must leave the iframes — and the card in them — untouched.
      key={clientSecret ? "intent" : `deferred-${mode}`}
      stripe={getStripe()}
      options={options}
    >
      {children}
    </Elements>
  );
}
