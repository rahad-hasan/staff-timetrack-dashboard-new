"use client";

import { AlertCircle, X } from "lucide-react";

import type { PaymentFailureCopy } from "@/lib/billing";

/**
 * The red banner at the top of the card panel after a decline.
 *
 * It is dismissible on purpose: once the user starts correcting the card, the
 * alert about the previous attempt is stale, and leaving it pinned above a
 * freshly-typed card reads as if the new details had already failed too.
 */
export default function PaymentFailureAlert({
  failure,
  onDismiss,
}: {
  failure: PaymentFailureCopy;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-500/10"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-red-700 dark:text-red-300">
          {failure.title}
        </p>
        <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">
          {failure.description}
        </p>
        {/* The design prints the code as a quiet third line — it is what a user
            reads out to their bank or pastes into a support ticket. Omitted
            entirely when there is no code: a failure that never reached the
            card network (a rejected request, an unloaded Stripe.js) has nothing
            to read out, and printing a card code for one is actively
            misleading. */}
        {failure.code ? (
          <p className="mt-2 text-xs text-red-600/80 dark:text-red-400/80">
            Error code: {failure.code}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="Dismiss payment error"
        onClick={onDismiss}
        className="shrink-0 cursor-pointer text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
