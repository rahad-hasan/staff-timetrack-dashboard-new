"use client";

import { CreditCard, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatCardBrand,
  formatCardExpiry,
  formatPaymentMethodType,
  isCardMethod,
  resolvePaymentMethodType,
} from "@/lib/billing";
import { IPaymentMethod } from "@/types/billing";

/**
 * The glyph itself, split out from `PaymentMethodMark` so the plated and
 * unplated variants render the exact same markup. It is a plain function rather
 * than a component so the unplated path returns the element tree directly, with
 * no extra wrapper or component boundary between caller and mark.
 *
 * `type` is checked before `brand`, because a saved method is not necessarily a
 * card: the SetupIntent behind every save uses `automatic_payment_methods`, so
 * a Link wallet (or anything else enabled on the Stripe account) can be
 * attached, and those carry an EMPTY brand. Branching on brand first would send
 * every one of them to the generic credit-card glyph labelled "Card".
 */
const renderMethodGlyph = (
  type: string,
  brand: string | null | undefined,
  large: boolean,
  className: string | undefined,
) => {
  const key = (brand ?? "").toLowerCase();

  // Stripe Link's own mark: the lowercase wordmark on its green. Like the
  // Mastercard discs below it carries its own colours rather than inheriting
  // `currentColor` — the green IS the mark, and it reads on the near-black card
  // visual and on the white plate alike.
  if (type === "link") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-[#00D66F] font-semibold tracking-tight text-[#04231A]",
          large ? "px-2.5 py-1 text-base" : "px-1.5 py-0.5 text-[11px]",
          className,
        )}
        aria-label="Link"
        role="img"
      >
        link
      </span>
    );
  }

  // Any other non-card method (bank debits, other wallets). There is no logo we
  // may redraw for these, so it is a wallet glyph plus the type's own name —
  // truthful and legible, where a credit-card glyph would not be either.
  if (type && type !== "card") {
    const label = formatPaymentMethodType(type);
    return (
      <span
        className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
        aria-label={label}
        role="img"
      >
        <Wallet className={large ? "size-6" : "size-4"} />
        {large && (
          <span className="truncate text-sm font-semibold tracking-wide">
            {label.toUpperCase()}
          </span>
        )}
      </span>
    );
  }

  if (key === "mastercard") {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        aria-label="Mastercard"
        role="img"
      >
        <span
          className={cn(
            "rounded-full bg-[#EB001B]",
            large ? "size-7" : "size-5",
          )}
        />
        <span
          className={cn(
            "rounded-full bg-[#F79E1B] opacity-80",
            large ? "-ml-3 size-7" : "-ml-2 size-5",
          )}
        />
      </span>
    );
  }

  if (key === "amex" || key === "american_express") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded bg-[#2E77BC] font-bold tracking-[0.08em] text-white",
          large ? "px-2 py-1 text-sm" : "px-1.5 py-0.5 text-[10px]",
          className,
        )}
        aria-label="American Express"
        role="img"
      >
        AMEX
      </span>
    );
  }

  if (key === "visa" || key === "discover" || key === "jcb" || key === "unionpay") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold italic tracking-[0.12em]",
          large ? "text-xl" : "text-sm",
          className,
        )}
        aria-label={formatCardBrand(brand)}
        role="img"
      >
        {formatCardBrand(brand).toUpperCase()}
      </span>
    );
  }

  // Every other branch is a fixed-width mark; this one prints whatever string
  // Stripe sent (`formatCardBrand` upper-cases an unmapped brand verbatim), so
  // it is the only glyph that can outgrow its row. `min-w-0` + `truncate` let
  // it shrink instead of overflowing the card, which clips silently.
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      aria-label={formatCardBrand(brand)}
      role="img"
    >
      <CreditCard className={large ? "size-6" : "size-4"} />
      {large && (
        <span className="truncate text-sm font-semibold tracking-wide">
          {formatCardBrand(brand).toUpperCase()}
        </span>
      )}
    </span>
  );
};

/**
 * Mark for a saved payment method — a card brand, the Link wallet, or the
 * generic wallet glyph for anything else on file.
 *
 * (It was `CardBrandMark` while cards were the only thing the list could hold.
 * They are not: `automatic_payment_methods` on the SetupIntent means a Link
 * wallet is a normal, permanent member of this list, so the mark takes the
 * method's `type` and the name says so.)
 *
 * Drawn in markup rather than shipped as image assets: the PNGs would be more
 * requests, would need a light and a dark variant each, and would go stale the
 * moment a new brand or method type shows up. Mastercard and Link keep their
 * own colours (the discs and the green ARE the marks); the wordmarks use
 * `currentColor`, so the same component reads correctly on the near-black card
 * visual and on the light rows inside the change-payment-method sheet.
 *
 * `plate` sets the mark on a white tile, the way a real logo is printed on a
 * card row. It exists because the wordmarks inherit `currentColor`: on the
 * sheet's saved-method row the surrounding text is near-white in dark mode,
 * which would leave a white VISA on a pale-blue row. The plate carries its own
 * dark `text-*`, so the glyph stays legible whatever the theme does around it —
 * and the fixed h/w keeps every mark, wide wordmark or small icon, on the same
 * optical baseline down a list. `className` then styles the plate, not the
 * glyph, since the plate is what the caller is positioning.
 *
 * The rim is a pair: `ring-black/5` is what separates a white tile from a white
 * row, and it disappears entirely on `darkPrimaryBg`, so dark mode takes
 * `ring-darkBorder` — the one ring tone that is darker than the tile and
 * lighter than the navy behind it, leaving a visible edge on both grounds.
 */
export const PaymentMethodMark = ({
  type,
  brand,
  size = "sm",
  className,
  plate = false,
}: {
  /**
   * Stripe's payment-method type. Optional at runtime on purpose — a response
   * cached before the field shipped has none, and `resolvePaymentMethodType`
   * then falls back to the card rendering those rows have always had.
   */
  type?: string | null;
  brand: string | null | undefined;
  size?: "sm" | "lg";
  className?: string;
  plate?: boolean;
}) => {
  const large = size === "lg";
  const resolved = resolvePaymentMethodType({
    type: type ?? "",
    brand: brand ?? "",
  });

  if (!plate) return renderMethodGlyph(resolved, brand, large, className);

  return (
    <span
      className={cn(
        "inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-[#0b1120] shadow-sm ring-1 ring-black/5 dark:ring-darkBorder",
        className,
      )}
    >
      {renderMethodGlyph(resolved, brand, large, undefined)}
    </span>
  );
};

/**
 * "JOHN DOE" → "J••• D••".
 *
 * The cardholder name is not a secret Stripe would object to, but it sits on a
 * surface an admin may well be screen-sharing while walking someone through
 * billing, so it follows the same shape-only rule the card number does.
 */
const maskCardholderName = (name: string | null | undefined): string => {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "••••• ••••";
  return trimmed
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + "•".repeat(Math.max(1, word.length - 1)),
    )
    .join(" ");
};

const DOT_GROUPS = ["••••", "••••", "••••"];

/** Shared caption style for the small labels along the bottom of the visual. */
const CAPTION_CLASS =
  "text-[10px] font-medium tracking-[0.14em] text-white/50 sm:text-[11px]";

/**
 * The saved-payment-method graphic on the Change Card tab.
 *
 * It is deliberately DARK IN BOTH THEMES — that is the design, not a missed
 * dark-mode pair. A physical card does not repaint itself when the app theme
 * flips, and the panel around it is what carries the light/dark tokens, so the
 * colours here are fixed literals on purpose. The only theme-aware piece is
 * the dashed border of the empty placeholder, which has to read against both
 * grounds.
 *
 * That "both themes" claim covers the EMPTY card too, and it is load-bearing:
 * the ground was once `bg-[#0b1120]/60`, which over the white `bgPrimary` panel
 * composited to a mid-grey and dropped every foreground below AA — the labels
 * to 2.48:1, the chip to 3.21:1, the values to 4.36:1 — while dark mode looked
 * fine. The placeholder reads as a placeholder through the dashed border and
 * the "No card saved" chip, never by thinning its ink.
 *
 * TWO BODIES, one frame. A Link wallet (or any other non-card method — the
 * SetupIntent enables `automatic_payment_methods`, so this is permanent) has no
 * PAN, no expiry and no cardholder name, and the card body over those empty
 * values printed "•••• •••• •••• " with a VALID THRU of "—". So a non-card
 * method gets its own body: the account it belongs to, its type, and nothing
 * that does not exist. The frame, the arcs, the chip and the mark are shared,
 * which is what keeps the two looking like one component rather than a fallback.
 *
 * Type and spacing step up at `sm` rather than sitting at one size: the card is
 * 520px at full width, but on a 360px phone that same stack has barely 260px of
 * usable room, so the phone values are what keep the number row from wrapping
 * into three lines. The row stays `flex-wrap` regardless — a wrap is survivable,
 * a horizontal overflow inside an `overflow-hidden` card silently clips the
 * last four digits. A wallet email is one unbroken token, so that body takes
 * `break-all` for the same reason.
 *
 * Nothing sensitive is rendered: `last4`, brand, expiry and the Link email are
 * all things Stripe hands us for display. There is no PAN here and never can be
 * — the full number only ever exists inside Stripe's iframes.
 */
export default function SavedCardVisual({
  card,
}: {
  card: IPaymentMethod | null;
}) {
  const isEmpty = !card;
  // The empty placeholder keeps the card body: it is the shape of the thing the
  // admin is being invited to add, and there is no method yet to contradict it.
  const isCard = isEmpty || isCardMethod(card);
  const type = card ? resolvePaymentMethodType(card) : "";
  const typeLabel = formatPaymentMethodType(type);

  // What identifies a non-card method to its owner. Link is identified by its
  // email — it is the only thing telling two Link methods apart — and bank
  // debits by their last four. With neither, say so plainly rather than
  // printing a row of dots that implies a number we do not have.
  const walletEmail = (card?.wallet_email ?? "").trim();
  const walletLast4 = (card?.last4 ?? "").trim();
  const walletIdentity =
    walletEmail || (walletLast4 ? `•••• ${walletLast4}` : null);
  const billingName = (card?.billing_name ?? "").trim();

  return (
    <div
      className={cn(
        "relative w-full max-w-[520px] overflow-hidden rounded-2xl p-5 text-white shadow-lg sm:p-7",
        isEmpty
          ? "border border-dashed border-borderColor bg-[#0b1120] dark:border-darkBorder"
          : "bg-[#0b1120] ring-1 ring-white/10",
      )}
    >
      {/* The design's light arc sweeping in from the right edge. Two rings so
          it reads as a curve rather than a flat disc. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-16 size-56 rounded-full border border-white/10 bg-white/[0.04]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 top-8 size-64 rounded-full border border-white/[0.06]"
      />

      <div className="relative flex min-h-[200px] flex-col justify-between gap-7 sm:min-h-[230px] sm:gap-9">
        {/* Wraps like the number row below, and for the same reason: a brand
            string we have no mapping for prints verbatim, and this card is
            `overflow-hidden`. */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/80 sm:px-3 sm:py-1.5 sm:text-xs">
            {/* "Primary Card" would be wrong over a wallet — the chip names
                what is actually on file. */}
            {isEmpty
              ? "No card saved"
              : isCard
                ? "Primary Card"
                : "Primary Method"}
          </span>
          {/* With no method there is no brand and no type, and
              `formatCardBrand(undefined)` is the literal word "Card" — so the
              mark would draw a credit-card glyph labelled "CARD" and announce
              `role="img"` "Card" right next to a chip saying there is none. The
              empty state gets the slot the logo would sit in instead:
              decorative, dashed like the card's own border, and silent to a
              screen reader. */}
          {card ? (
            <PaymentMethodMark
              type={card.type}
              brand={card.brand}
              size="lg"
              className="min-w-0 text-white/90"
            />
          ) : (
            <span
              aria-hidden
              className="h-9 w-16 shrink-0 rounded-md border border-dashed border-white/30"
            />
          )}
        </div>

        {isCard ? (
          <>
            {/* Muted groups, bright last four: the eye should land on the only
                part of the number that actually identifies the card. */}
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-lg tracking-[0.18em] text-white/55 sm:gap-x-4 sm:text-2xl sm:tracking-[0.22em]">
              {DOT_GROUPS.map((group, index) => (
                <span key={index} aria-hidden>
                  {group}
                </span>
              ))}
              <span className="text-2xl font-semibold tracking-[0.12em] text-white sm:text-4xl">
                {card?.last4 || "••••"}
              </span>
            </p>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={CAPTION_CLASS}>VALID THRU</p>
                <p className="mt-0.5 font-mono text-sm text-white/90 sm:text-base">
                  {card ? formatCardExpiry(card.exp_month, card.exp_year) : "••/••••"}
                </p>
              </div>
              <div className="text-right">
                <p className={CAPTION_CLASS}>CARDHOLDER NAME</p>
                <p className="mt-0.5 text-sm tracking-wide text-white/90 sm:text-base">
                  {card ? maskCardholderName(card.billing_name) : "••••• ••••"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Where the PAN sits on a card: the account this method belongs
                to, at the same optical weight, so the wallet body reads as a
                sibling of the card body rather than an emptier version of it. */}
            <div>
              <p className={CAPTION_CLASS}>ACCOUNT</p>
              <p
                className={cn(
                  "mt-1 break-all font-semibold",
                  walletIdentity
                    ? "text-lg text-white sm:text-2xl"
                    : // Nothing identifying came back. Saying so is honest;
                      // dots here would imply a number that does not exist.
                      "text-base text-white/60 sm:text-lg",
                )}
              >
                {walletIdentity ?? "No account details on file"}
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                {/* Deliberately in the VALID THRU slot: it answers the question
                    the missing expiry raises — this is not a card. */}
                <p className={CAPTION_CLASS}>PAYMENT TYPE</p>
                <p className="mt-0.5 truncate text-sm text-white/90 sm:text-base">
                  {typeLabel}
                </p>
              </div>
              {/* Only when Stripe actually has one — an empty billing name here
                  would be the same fabrication the dots were. */}
              {billingName && (
                <div className="min-w-0 text-right">
                  <p className={CAPTION_CLASS}>BILLING NAME</p>
                  <p className="mt-0.5 truncate text-sm tracking-wide text-white/90 sm:text-base">
                    {maskCardholderName(billingName)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
