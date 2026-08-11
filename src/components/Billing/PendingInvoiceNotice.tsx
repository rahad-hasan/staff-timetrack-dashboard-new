"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Amber "payment action needed" panel (guide §3/§5). Purely presentational —
 * polling for the webhook-driven status change is the caller's job.
 */
export default function PendingInvoiceNotice({
  result,
  message,
}: {
  result: {
    hosted_invoice_url: string | null;
    payment_intent_client_secret?: string | null;
  };
  message: string;
}) {
  const url = result.hosted_invoice_url;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        {message}
      </p>

      {url && (
        <Button
          type="button"
          className="mt-3"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink />
          Open invoice &amp; pay
        </Button>
      )}

      <p className="mt-3 text-xs text-amber-700 dark:text-amber-300/80">
        This opens Stripe&apos;s secure payment page (3-D Secure supported).
        Changes apply automatically within seconds of payment — keep this page
        open.
      </p>
    </div>
  );
}
