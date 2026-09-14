"use client";

import { useState } from "react";
import {
  CreditCard,
  Pencil,
  Receipt,
  RefreshCw,
  RefreshCcw,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import SavedCardVisual from "./SavedCardVisual";
import ChangePaymentMethodSheet from "./ChangePaymentMethodSheet";
import { usePaymentMethods } from "./usePaymentMethods";

const REASONS = [
  {
    icon: RefreshCcw,
    title: "Automatic payments",
    body: "Your subscription renews without anyone having to remember a due date — no lapse in tracking for the team.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & encrypted",
    body: "Card details are held by Stripe, never by us. We only ever see the brand, the last four digits and the expiry.",
  },
  {
    icon: Settings2,
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
        <div className="rounded-lg border border-borderColor bg-bgPrimary p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
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
                      <Pencil className="size-4" />
                      Change Card
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
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

        <div className="rounded-lg border border-borderColor bg-bgPrimary p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
          <h3 className="text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
            Why save a payment method?
          </h3>
          <ul className="mt-4 space-y-4">
            {REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <li key={reason.title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
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

      {/* Reassurance, not a status message: the panel stays neutral and only
          the badge is green, so this cannot be mistaken for a success alert
          about something that just happened. */}
      <div className="flex items-center gap-3 rounded-xl border border-borderColor bg-bgSecondary p-3 sm:gap-4 sm:p-4 dark:border-darkBorder dark:bg-darkTertiaryBg">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
          <ShieldCheck className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
            Your payments are secure
          </p>
          <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
            Card details go straight to Stripe over an encrypted connection and
            are never stored on our servers.
          </p>
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
