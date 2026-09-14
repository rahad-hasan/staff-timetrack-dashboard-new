import { CreditCard, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TrustBadgeItem {
  icon: LucideIcon;
  title: string;
  description: string;
  /**
   * Classes for the icon plate — background AND foreground, paired light+dark
   * like every other surface in the app. Carried on the item (rather than
   * cycled from an index) so a reused strip keeps a stable colour per message:
   * "secure" should not turn amber because the copy was reordered.
   */
  tone?: string;
}

/**
 * The reassurance strip under the pricing grid. Every line is a promise the
 * product already keeps — the reverse trial runs with no card, cancellation is
 * self-serve — so nothing here is derived from a plan or a subscription.
 *
 * Which is exactly why the trial badge states NO number. Trial length is a
 * per-plan column (`ProductPlan.trial_days`, default 15, admin-editable down to
 * 1), and the reverse trial granted at signup reads it off whichever plan wins
 * `getTrialTargetPlan()` — the `is_trial_target` flag, or a priciest-plan
 * fallback when none is flagged. So there is no single true length to print
 * here, and the "14 days" this badge used to claim was not even the default.
 * A prospect reads this strip immediately before entering a card, so a length
 * we might not honour is the one thing on it that could become a lie; the
 * remaining copy is true whatever the catalog says. Do not reintroduce a
 * number: the running trial's real end date already reaches the user from
 * `entitlements.trial_ends_at` (the choose-plan header and `CurrentPlanCard`
 * both count it down), which is the only figure that is ever accurate.
 */
export const DEFAULT_TRUST_BADGES: TrustBadgeItem[] = [
  {
    icon: ShieldCheck,
    title: "Free Trial Included",
    description: "Explore all features risk-free. Cancel anytime.",
    tone: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  {
    icon: CreditCard,
    title: "No Credit Card",
    description: "Get started in seconds. No credit card required.",
    tone: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
  {
    icon: RefreshCw,
    title: "Cancel Anytime",
    description: "No long-term contracts. Switch or cancel anytime.",
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    icon: Lock,
    title: "Secure & Reliable",
    description:
      "Your data is always protected with enterprise-grade security.",
    tone:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
];

/**
 * Four trust badges in one bordered card (guide §3, pricing + checkout).
 *
 * Pure presentation and deliberately not a client component, so the checkout
 * page can drop it into a server tree with its own `items` copy without pulling
 * anything into the bundle.
 *
 * The dividers are `gap-px` over a border-coloured track rather than
 * `divide-x`: the strip reflows 1 → 2 → 4 columns, and `divide-x` draws its
 * rule on every child but the first, which puts a stray vertical line down the
 * left of whichever item happens to start row two. A gap is correct at every
 * column count with no nth-child arithmetic — it just also separates the
 * stacked items on a phone, which is how a stacked list should read anyway.
 */
export default function TrustBadgeStrip({
  items = DEFAULT_TRUST_BADGES,
  className,
}: {
  items?: TrustBadgeItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-borderColor bg-bgPrimary dark:border-darkBorder dark:bg-darkPrimaryBg",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-px bg-borderColor dark:bg-darkBorder sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-start gap-3 bg-bgPrimary p-4 sm:p-5 dark:bg-darkPrimaryBg"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  item.tone ?? "bg-primary/10 text-primary dark:bg-primary/20",
                )}
              >
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-subTextColor dark:text-darkTextSecondary">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
