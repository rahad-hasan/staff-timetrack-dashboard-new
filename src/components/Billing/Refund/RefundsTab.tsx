"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { cancelRefundRequest } from "@/actions/billing/refundAction";
import { formatBillingDate, formatCents } from "@/lib/billing";
import { REFUND_REASON_LABELS } from "@/lib/refund";
import { useBillingStore } from "@/store/billingStore";
import { socket } from "@/socket/socket";
import type { IRefundRequest } from "@/types/billing";
import { RefundStatusBadge } from "./RefundStatusBadge";
import { useRefundRequests } from "./useRefundRequests";

const LIMIT = 10;
const COLUMNS = ["Requested", "Invoice", "Amount", "Reason", "Status", "Response", "Actions"];
/** Pushed to the requester's user room whenever the billing team acts on a refund. */
const REFUNDS_CHANGED = "refunds:changed";

const amountOf = (refund: IRefundRequest) =>
  refund.status === "processed"
    ? refund.refunded_amount_cents
    : (refund.approved_amount_cents ?? refund.requested_amount_cents);

const responseText = (refund: IRefundRequest) => {
  if (refund.status === "processed") {
    const refunded = `Refunded ${formatCents(refund.refunded_amount_cents, refund.currency)} on ${formatBillingDate(refund.processed_at)}`;
    return refund.subscription_canceled_at ? `${refunded} · subscription ended` : refunded;
  }
  if (refund.source !== "request") return "Issued by our billing team";
  return refund.review_note ?? "—";
};

export default function RefundsTab({ isAdmin }: { isAdmin: boolean }) {
  const { rows, page, setPage, totalPages, loading, error, retry } = useRefundRequests(LIMIT);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<IRefundRequest | null>(null);

  // A console decision arrives as a socket ping; one bump refetches this list.
  // Pings sent while the socket was down are not replayed, so a reconnect
  // refetches too.
  useEffect(() => {
    const onChanged = () => useBillingStore.getState().bumpDataVersion();
    socket.on(REFUNDS_CHANGED, onChanged);
    socket.on("connect", onChanged);
    return () => {
      socket.off(REFUNDS_CHANGED, onChanged);
      socket.off("connect", onChanged);
    };
  }, []);

  const withdraw = async (id: number) => {
    if (withdrawingId !== null) return;
    setWithdrawingId(id);

    try {
      const response = await cancelRefundRequest(id);
      if (response?.success) {
        toast.success("Refund request withdrawn.");
      } else {
        toast.error(response?.message || "Could not withdraw the request.");
      }
    } catch {
      toast.error("Something went wrong while withdrawing the request.");
    } finally {
      setWithdrawingId(null);
      setConfirming(null);
      // Success or not, the row's real state is worth re-reading (a 409
      // means it moved on in the console).
      useBillingStore.getState().bumpDataVersion();
    }
  };

  return (
    <div className="rounded-lg border border-borderColor bg-white p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <h3 className="mb-1 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
        Refund requests
      </h3>
      <p className="mb-4 text-sm text-subTextColor dark:text-darkTextSecondary">
        Requests you have sent and refunds issued by our billing team. Ask for a
        refund from any paid invoice.
      </p>

      {error && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <Button type="button" variant="outline2" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            Array.from({ length: 3 }).map((_, row) => (
              <TableRow key={`skeleton-${row}`}>
                {COLUMNS.map((column) => (
                  <TableCell key={column}>
                    <div className="h-4 w-full max-w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            error ? null : (
              <TableRow>
                <EmptyTableRow columns={COLUMNS} text="No refund requests yet" />
              </TableRow>
            )
          ) : (
            rows.map((refund) => (
              <TableRow key={refund.id}>
                <TableCell className="whitespace-nowrap">{formatBillingDate(refund.created_at)}</TableCell>
                <TableCell className="whitespace-nowrap font-medium">{refund.invoice.invoice_number}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatCents(amountOf(refund), refund.currency)}
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <p className="truncate" title={refund.reason ?? undefined}>
                    {REFUND_REASON_LABELS[refund.reason_code]}
                  </p>
                </TableCell>
                <TableCell>
                  <RefundStatusBadge status={refund.status} />
                </TableCell>
                <TableCell className="max-w-[260px] text-sm text-subTextColor dark:text-darkTextSecondary">
                  <p className="line-clamp-2 break-words" title={responseText(refund)}>
                    {responseText(refund)}
                  </p>
                </TableCell>
                <TableCell>
                  {isAdmin && refund.status === "pending" && refund.source === "request" ? (
                    <Button
                      type="button"
                      variant="outline2"
                      size="sm"
                      disabled={withdrawingId !== null}
                      onClick={() => setConfirming(refund)}
                      aria-label={`Withdraw the refund request for invoice ${refund.invoice.invoice_number}`}
                    >
                      {withdrawingId === refund.id ? "Withdrawing…" : "Withdraw"}
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open && withdrawingId === null) setConfirming(null);
        }}
      >
        <AlertDialogContent className="dark:bg-darkSecondaryBg">
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this refund request?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming
                ? `The ${formatCents(confirming.requested_amount_cents, confirming.currency)} request for invoice ${confirming.invoice.invoice_number} will be closed. You can send a new one later.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawingId !== null}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              disabled={withdrawingId !== null}
              onClick={(event) => {
                // Stay open until the server answers; `withdraw` closes it.
                event.preventDefault();
                if (confirming) void withdraw(confirming.id);
              }}
            >
              {withdrawingId !== null ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
