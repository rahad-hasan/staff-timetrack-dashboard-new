"use client";

import { useEffect, useState } from "react";
import { PaymentElement } from "@stripe/react-stripe-js";
import { Globe, User } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countryOptions, detectBillingCountry } from "@/lib/countryOptions";
import { cn } from "@/lib/utils";

const LABEL =
  "mb-1.5 block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary";

/**
 * The "Card Information" panel.
 *
 * The card number, expiry and CVV live inside `<PaymentElement>` — Stripe's own
 * cross-origin iframe. That is not a styling preference: entering a PAN into an
 * input of ours would put this app's servers into PCI SAQ-D scope, so the raw
 * number must never exist in our DOM, our state, or any request we make.
 *
 * "Name on card" and the country select ARE ours, because neither is card data.
 * They are handed to Stripe as `billing_details` at confirm time.
 */
export default function CardInformationPanel({
  name,
  onNameChange,
  country,
  onCountryChange,
  showErrors = false,
  onReady,
  disabled,
}: {
  name: string;
  onNameChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  /** Raised by the parent after a blocked submit, to reveal untouched-field errors. */
  showErrors?: boolean;
  /** Fires once Stripe's card iframes are actually interactive. */
  onReady?: () => void;
  disabled?: boolean;
}) {
  // Post-mount only. The server cannot resolve a time zone, so guessing during
  // render would emit a different default than the browser and trip hydration —
  // the same reason PhoneNumberField detects its country in an effect.
  useEffect(() => {
    if (country) return;
    const detected = detectBillingCountry();
    if (detected) onCountryChange(detected);
    // Runs once, and only while the field is still untouched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Controlled so the trigger can advertise `aria-expanded` — a `combobox`
  // without it tells a screen reader nothing about whether the list is open.
  const [open, setOpen] = useState(false);

  // The name error appears on blur or once the parent has flagged a submit
  // attempt — never while the field is still untouched.
  const [nameTouched, setNameTouched] = useState(false);
  const showNameError = (nameTouched || showErrors) && !name.trim();
  // Country is required for the same reason the name is: Stripe's own field is
  // suppressed, so confirm raises an IntegrationError without it. Surfaced only
  // after a submit attempt — the value is auto-detected on mount, so it is
  // normally already filled and flagging it earlier would be noise.
  const showCountryError = showErrors && !country;

  const selectedLabel =
    countryOptions.find((option) => option.value === country)?.label ?? "";

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="checkout-card-name" className={LABEL}>
          Name on card <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
          <Input
            id="checkout-card-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Full name as it appears on card"
            autoComplete="cc-name"
            required
            aria-invalid={showNameError}
            aria-describedby={showNameError ? "checkout-card-name-error" : undefined}
            disabled={disabled}
            className="pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
          />
        </div>
        {/* Not cosmetic: Stripe's own name field is suppressed below, so this
            input is the ONLY source of billing_details.name — and confirm
            rejects the payment outright without it. An unmarked optional-
            looking field would fail the purchase at the last step. */}
        {showNameError && (
          <p
            id="checkout-card-name-error"
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          >
            Enter the name printed on the card.
          </p>
        )}
      </div>

      {/* Card number / expiry / CVV — Stripe-hosted, themed via the Appearance
          API in StripeElementsProvider (our CSS cannot reach inside the iframe). */}
      <PaymentElement
        // `useElements()` returns a non-null Elements instance as soon as the
        // provider mounts — well before the iframes are usable — so it cannot
        // gate the pay button. This is the real signal: submitting earlier
        // surfaces a raw Stripe IntegrationError dressed up as a card decline.
        onReady={() => onReady?.()}
        options={{
          layout: "tabs",
          // The cardholder name AND the country are collected by this panel's
          // own inputs, so both of Stripe's are suppressed — exactly as
          // AddPaymentMethodForm does it.
          //
          // Country was the one that mattered: leaving it on rendered a SECOND
          // country select inside the iframe, prefilled from the account locale
          // and invisible to our state. Stripe resolves billing_details from
          // the Element when the Element owns the field, so it overrode the
          // `address.country` we pass at confirm time — the admin picked
          // Germany, the PaymentMethod (and the invoice built from it) recorded
          // the United States. `never` hands ownership back to us, which is
          // what makes the value below authoritative.
          fields: {
            billingDetails: { name: "never", address: { country: "never" } },
          },
        }}
      />

      <div>
        <span className={LABEL}>Select Country</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {/* No explicit role="combobox": PopoverTrigger already injects
                aria-haspopup and aria-expanded, and claiming the combobox role
                would oblige us to own aria-controls and the listbox
                relationship that Radix manages itself. */}
            <button
              type="button"
              disabled={disabled}
              aria-label="Select billing country"
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm",
                "cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-50 dark:border-darkBorder dark:bg-darkPrimaryBg",
              )}
            >
              <Globe className="size-4 shrink-0 text-subTextColor dark:text-darkTextSecondary" />
              <span
                className={cn(
                  "flex-1 truncate",
                  selectedLabel
                    ? "text-headingTextColor dark:text-darkTextPrimary"
                    : "text-muted-foreground",
                )}
              >
                {selectedLabel || "Select country"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) p-0 dark:border-darkBorder dark:bg-darkSecondaryBg"
          >
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countryOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onCountryChange(option.value);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {showCountryError && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            Please select your billing country.
          </p>
        )}
      </div>
    </div>
  );
}
