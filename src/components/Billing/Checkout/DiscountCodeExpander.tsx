"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The collapsed "Add Discount Code +" row under the card fields.
 *
 * Applying a code does NOT price anything here — it asks the server to re-quote
 * the whole order, because the saving depends on the cycle and seat count and
 * only the backend knows how the coupon is actually minted. So this component
 * owns nothing but the input and the pending/applied presentation; the real
 * answer (and any rejection message) comes back through `error` / `appliedCode`.
 *
 * Rejections render inline rather than as a toast: a bad code is a field error,
 * and a toast would disappear before the user had finished retyping it.
 */
export default function DiscountCodeExpander({
  appliedCode,
  applying,
  error,
  onApply,
  onRemove,
  disabled,
}: {
  appliedCode: string | null;
  applying: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  // Auto-expanded when a code is already on the order, so a reloaded checkout
  // never hides the discount the user is relying on behind a collapsed row.
  const [open, setOpen] = useState(Boolean(appliedCode));
  const [value, setValue] = useState("");

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2.5 dark:bg-green-500/10">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
          <Check className="size-4 shrink-0" />
          <span className="truncate">Code {appliedCode} applied</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || applying}
          aria-label={`Remove discount code ${appliedCode}`}
          className="shrink-0 cursor-pointer text-green-700 transition-colors hover:text-green-900 disabled:opacity-50 dark:text-green-300 dark:hover:text-green-200"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex w-full cursor-pointer items-center justify-between text-sm font-medium text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        Add Discount Code
        <Plus className="size-4" />
      </button>
    );
  }

  const submit = () => {
    const code = value.trim();
    if (code) onApply(code);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            // The row is inside the checkout <form>; Enter here must apply the
            // code, never submit the payment.
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Enter code"
            aria-label="Discount code"
            aria-invalid={Boolean(error)}
            disabled={disabled || applying}
            className="pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
          />
        </div>
        <Button
          type="button"
          variant="outline2"
          onClick={submit}
          disabled={disabled || applying || !value.trim()}
        >
          {applying && <Loader2 className="size-4 animate-spin" />}
          Apply
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
