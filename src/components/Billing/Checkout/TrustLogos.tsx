import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The payment-network reassurance strip that closes both checkout side panels,
 * plus the card chrome those panels share.
 *
 * The marks are inline text/SVG on purpose. Hotlinking the networks' own logo
 * files would put a third-party CDN on the critical path of the one page where
 * a payment happens — a blocked or slow request there reads as a broken
 * checkout — and bundling the artwork means shipping trademarked assets we have
 * no licence to redistribute. Muted, typographic stand-ins carry the same
 * "your card is handled properly" signal without either problem, which is also
 * why they stay grey instead of picking up brand colours: they are a statement
 * about our processing, not a claim of endorsement.
 *
 * `AssurancePanel` lives in this file rather than in one of the two panels
 * because both of them end in `<TrustLogos />`; keeping the chrome next to its
 * own footer avoids the twin panels having to import each other.
 */

/* Shared badge chrome. Deliberately not `uppercase` — only the marks that are
   genuinely set in caps opt into it, so "SafeKey" and "Verified by" keep the
   casing the networks actually use. */
const BADGE =
  "inline-flex items-center gap-1.5 rounded-md border border-borderColor px-2 py-1 text-[10px] font-medium leading-none text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary";

export default function TrustLogos() {
  return (
    <div>
      {/* Four wordmarks announced one by one ("V-I-S-A", "AMERICAN EXPRESS
          SafeKey") is noise in the middle of a payment flow, so the row is
          hidden from assistive tech and this single line says what it means. */}
      <p className="sr-only">
        Payments are processed over a PCI DSS compliant, network-verified
        connection — Visa, Mastercard and American Express.
      </p>

      <div
        aria-hidden="true"
        className="flex flex-wrap items-center gap-x-2 gap-y-2"
      >
        <span className={cn(BADGE, "uppercase tracking-[0.08em]")}>
          PCI DSS Compliant
        </span>

        <span className={BADGE}>
          Verified by
          <span className="text-[11px] font-bold italic tracking-tight">
            VISA
          </span>
        </span>

        <span className={BADGE}>
          {/* The interlocking discs, drawn in currentColor so they stay as
              quiet as the label beside them. */}
          <svg viewBox="0 0 26 16" className="h-3 w-5 shrink-0">
            <circle cx="10" cy="8" r="6.5" fill="currentColor" opacity="0.55" />
            <circle cx="16" cy="8" r="6.5" fill="currentColor" opacity="0.3" />
          </svg>
          MasterCard SecureCode
        </span>

        <span className={BADGE}>
          <span className="rounded-[2px] border border-current px-1 py-0.5 text-[8px] font-semibold tracking-[0.08em]">
            AMERICAN EXPRESS
          </span>
          SafeKey
        </span>
      </div>
    </div>
  );
}

/**
 * Tint for a row's icon tile. Named by intent rather than by class so the two
 * panels stay in the same four-colour rhythm as the design without either of
 * them hardcoding a palette.
 */
export type AssuranceTone = "blue" | "green" | "purple" | "orange";

/* `--primary` is the same blue in both themes, so the blue tile needs no dark
   counterpart; the other three are literal palette colours and do. */
const TONE: Record<AssuranceTone, string> = {
  blue: "bg-primary/10 text-primary",
  green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300",
  purple:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  orange:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
};

export interface AssuranceRow {
  icon: LucideIcon;
  tone: AssuranceTone;
  title: string;
  /** ReactNode, not string — the "Need Help?" panel closes on a real link. */
  body: ReactNode;
}

/**
 * Card chrome for the checkout right column's reassurance panels: a title, a
 * stack of icon + title + body rows, then the trust strip below a divider.
 *
 * Both panels occupy the same slot — the confidence copy swaps to the recovery
 * copy when a payment declines — so they share one shell to keep the column
 * from visibly reflowing at the exact moment the user is deciding whether to
 * trust us with a second attempt.
 */
export function AssurancePanel({
  title,
  rows,
}: {
  title: string;
  rows: AssuranceRow[];
}) {
  return (
    <div className="rounded-lg border border-borderColor bg-bgPrimary p-4 sm:p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <h3 className="mb-4 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
        {title}
      </h3>

      <ul className="space-y-4">
        {rows.map(({ icon: Icon, tone, title: rowTitle, body }) => (
          <li key={rowTitle} className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                TONE[tone],
              )}
            >
              {/* The tile already carries the meaning of the row's heading, so
                  the glyph is decoration and must not be read out twice. */}
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                {rowTitle}
              </p>
              <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-borderColor pt-4 dark:border-darkBorder">
        <TrustLogos />
      </div>
    </div>
  );
}
