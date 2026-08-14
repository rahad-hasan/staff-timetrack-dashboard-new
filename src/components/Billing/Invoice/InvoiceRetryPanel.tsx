"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown after the server already retried a 5xx once (guide §6). A half-rendered
 * document would be worse than none — an invoice that silently drops lines is
 * indistinguishable from an invoice that really has fewer — so the whole
 * document is withheld and the user gets one explicit retry.
 */
export default function InvoiceRetryPanel({ message }: { message?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-borderColor bg-white p-8 text-center dark:border-darkBorder dark:bg-darkPrimaryBg">
      <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
      <h3 className="mt-3 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
        Couldn&apos;t load this invoice
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-subTextColor dark:text-darkTextSecondary">
        {message || "The billing service didn't respond. Nothing has changed on your account."}
      </p>
      <Button
        type="button"
        variant="outline2"
        className="mt-4"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {pending ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
