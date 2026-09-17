"use client";

import { useState } from "react";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import SavedCardVisual from "./SavedCardVisual";
import ChangePaymentMethodSheet from "./ChangePaymentMethodSheet";
import { usePaymentMethods } from "./usePaymentMethods";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import CardIcon from "@/components/Icons/PlanIcons/CardIcon";
import SecureIcon from "@/components/Icons/PlanIcons/SecureIcon";
import ZapIcon from "@/components/Icons/PlanIcons/ZapIcon";
import CheckFillIcon from "@/components/Icons/PlanIcons/CheckFillIcon";

const REASONS = [
  {
    icon: <ZapIcon size={24} />,
    title: "Automatic payments",
    body: "Your subscription renews without anyone having to remember a due date — no lapse in tracking for the team.",
  },
  {
    icon:  <SecureIcon size={24} />,
    title: "Secure & encrypted",
    body: "Card details are held by Stripe, never by us. We only ever see the brand, the last four digits and the expiry.",
  },
  {
    icon: <CardIcon size={22}/>,
    title: "Easy Management",
    body: "Swap the card, remove an old one or switch which card renews your plan — all from this page.",
  },
] as const;

/**
 * The "Change Card" tab (admin only — every payment-method endpoint is
 * `auth('admin')`, and `resolveBillingTab` withholds the tab from manager/hr).
 *
 * One `usePaymentMethods` instance lives here and is handed to the sheet, so
 * the card visual and the radio list can never disagree about which card is
 * default.
 */
export default function ChangeCardTab({
  onViewBilling,
}: {
  /** Jumps to the Invoice tab — the design pairs the two buttons. */
  onViewBilling: () => void;
}) {
  const payments = usePaymentMethods();
  const { methods, defaultId, loading, error, refresh } = payments;
  const [sheetOpen, setSheetOpen] = useState(false);

  // The visual shows the card that actually renews the subscription. Falling
  // back to the newest attached card keeps it from going blank in the window
  // between a first card being saved and Stripe reporting it as default.
  const primaryCard =
    methods.find((method) => method.id === defaultId) ?? methods[0] ?? null;

  const hasCard = Boolean(primaryCard);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-headingTextColor sm:text-2xl dark:text-darkTextPrimary">
          Payment Methods
        </h2>
        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
          Add, remove, or manage your payment methods for subscriptions and
          invoices.
        </p>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <Button type="button" variant="outline2" size="sm" onClick={refresh}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-lg border border-borderColor bg-bgPrimary p-4 sm:p-6 dark:border-darkBorder dark:bg-darkPrimaryBg">
          {loading ? (
            <div className="max-w-[520px] space-y-4" aria-busy>
              {/* The heights mirror the real visual's box — 200px of content
                  + p-5 below `sm`, 230px + p-7 from `sm` up — so the button row
                  underneath does not jump when the fetch resolves. (The empty
                  variant's dashed border adds 2px; nothing we can know before
                  the fetch, and invisible next to the ~48px it used to move.) */}
              <div className="h-[240px] w-full animate-pulse rounded-2xl bg-gray-300 sm:h-[286px] dark:bg-gray-700" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="h-12 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700" />
                <div className="h-12 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700" />
              </div>
            </div>
          ) : (
            <div className="max-w-[520px] space-y-4">
              {/* The card visual caps itself at 520px; the same cap on this
                  column is what makes the button row finish flush with the card
                  edge instead of running the full width of the panel. */}
              <SavedCardVisual card={primaryCard} />

              {!hasCard && (
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  No card on file yet. Add one now and your subscription renews
                  on its own — no invoice chasing, no lapse in tracking.
                </p>
              )}

              {/* Equal columns, not a wrapping flex row: the two actions read as
                  a matched pair under the card. They stack below `sm`, where two
                  columns would squash both labels. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setSheetOpen(true)}
                >
                  {hasCard ? (
                    <>
                      <EditIcon size={20} />
                      Change Card
                    </>
                  ) : (
                    <>
                      <CardIcon size={20}/>
                      Add a card
                    </>
                  )}
                </Button>
                {/* `outline` ships its own dark pair (`dark:bg-input/30
                    dark:border-input`), which repaints this as a grey box with
                    blue text in dark mode. tailwind-merge only drops an earlier
                    class when the later one wears the SAME variant prefix, so
                    the override is spelled `dark:` for `dark:` — a bare
                    `bg-primary/10` here would sit BESIDE `dark:bg-input/30`
                    rather than replace it, and then lose the cascade to it.
                    `--primary` is #0788f3 in both themes, so the dark pair is
                    the same blue the light one already uses. */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onViewBilling}
                  className="dark:border-primary dark:bg-primary/10 dark:hover:bg-primary/10"
                >
                  <Receipt className="size-4" />
                  View Billing
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-borderColor bg-bgPrimary p-4 sm:p-6 dark:border-darkBorder dark:bg-darkPrimaryBg">
          <h3 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
            Why save a payment method?
          </h3>
          <ul className="mt-4 space-y-4">
            {REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <li key={reason.title} className="flex items-start gap-3">
                  <span className="mt-0.5 p-3 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    {Icon}
                  </span>
                  <span>
                    <span className="block text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                      {reason.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-subTextColor dark:text-darkTextSecondary">
                      {reason.body}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-7 w-full rounded-xl border border-[#1BA85533] bg-[#f4fbf7] dark:bg-[#1ba85611] px-4 py-3.5 md:px-4 md:py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d3efdf]">
            <CheckFillIcon size={30} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary md:text-base">
              Your payments are secure
            </h3>

            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary md:text-sm">
              We use industry-standard encryption to keep your payment
              information safe.
            </p>
          </div>
        </div>
      </div>

      <ChangePaymentMethodSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        payments={payments}
      />
    </div>
  );
}
