"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PaymentMethodMark } from "@/components/Billing/PaymentMethod/SavedCardVisual";
import {
  describePaymentMethod,
  formatCardExpiry,
  hasExpiry,
  isCardExpiring,
} from "@/lib/billing";
import { cn } from "@/lib/utils";
import type { IPaymentMethod } from "@/types/billing";

/**
 * The "Payment Method" panel shown when the company already has a card on file.
 *
 * Selecting a card here only decides which `pm_…` is sent with the purchase —
 * it does NOT change the customer's default. Promoting a card to default is a
 * separate, explicit action on the Change Card tab, so paying once with a
 * backup card cannot silently redirect every future renewal onto it.
 */
export default function SavedPaymentMethodPanel({
  methods,
  selectedId,
  onSelect,
  saveCard,
  onSaveCardChange,
  onUseNewCard,
  disabled,
}: {
  methods: IPaymentMethod[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  saveCard: boolean;
  onSaveCardChange: (next: boolean) => void;
  /** Switches the panel out for the card form — the design's "Change card". */
  onUseNewCard: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="Saved payment methods"
        className="space-y-2.5"
      >
        {methods.map((method) => {
          const selected = selectedId === method.id;
          // A non-card method has no expiry at all (0/0 on the wire), so it
          // can be neither "expiring" nor printed under an "Expires" label.
          const expires = hasExpiry(method);
          const expiring =
            expires && isCardExpiring(method.exp_month, method.exp_year);

          return (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors sm:p-4",
                selected
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-borderColor hover:border-primary/40 dark:border-darkBorder",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              {/* No radio-group primitive exists in this repo — a native input
                  keeps arrow-key navigation and the grouping for free. */}
              <input
                type="radio"
                name="checkout-payment-method"
                value={method.id}
                checked={selected}
                onChange={() => onSelect(method.id)}
                disabled={disabled}
                className="size-4 shrink-0 accent-primary"
              />

              {/* The shared plate — the checkout list used to draw its own,
                  which truncated the wordmark to 8 characters and printed
                  "AMERICAN" for an Amex and "MASTERCA" for a Mastercard. */}
              <PaymentMethodMark
                type={method.type}
                brand={method.brand}
                plate
                className="h-8 w-12"
              />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {describePaymentMethod(method)}
                  </span>
                  {method.is_default && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
                      Default
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-sm",
                    expiring
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-subTextColor dark:text-darkTextSecondary",
                  )}
                >
                  {expires
                    ? `Expires ${formatCardExpiry(
                        method.exp_month,
                        method.exp_year,
                      )}`
                    : "No expiry date"}
                  {expiring && " — expiring soon"}
                </span>
              </span>

              <Button
                type="button"
                variant="outline2"
                size="sm"
                disabled={disabled}
                onClick={(event) => {
                  // Inside a <label>, so the click would otherwise also select
                  // the radio the user is trying to move away from.
                  event.preventDefault();
                  onUseNewCard();
                }}
                className="shrink-0"
              >
                Change card
              </Button>
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="checkout-save-card"
          checked={saveCard}
          onCheckedChange={onSaveCardChange}
          disabled={disabled}
        />
        <label htmlFor="checkout-save-card" className="cursor-pointer">
          <span className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            Save card for future payments
          </span>
          <span className="block text-sm text-subTextColor dark:text-darkTextSecondary">
            Faster checkout next time
          </span>
        </label>
      </div>
    </div>
  );
}
