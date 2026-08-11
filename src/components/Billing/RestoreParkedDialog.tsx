"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IRestoreResult } from "@/types/billing";
import { restoreParked } from "@/actions/billing/action";
import { useBillingStore } from "@/store/billingStore";

/**
 * Restore members/projects parked by an earlier trial-expiry downgrade (guide
 * §5/§6). Restores oldest-parked first, up to the current plan's caps —
 * anything over the caps stays parked and is reported back.
 */
export default function RestoreParkedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const fetchStatus = useBillingStore((s) => s.fetchStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IRestoreResult | null>(null);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setPending(false);
      setError(null);
      setResult(null);
    }
    onOpenChange(o);
  };

  const handleRestore = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await restoreParked();
      if (res?.success && res.data) {
        setResult(res.data);
        try {
          await fetchStatus();
        } catch {
          // non-fatal: the next status refetch will pick the change up
        }
      } else {
        setError(
          res?.message || "Could not restore parked members and projects.",
        );
      }
    } catch {
      toast.error("Something went wrong while restoring. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const hasLeftovers =
    !!result &&
    (result.still_parked_users > 0 || result.still_parked_projects > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            Restore parked users &amp; projects
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            Your earlier downgrade parked members and archived projects.
            Restore them now (oldest first, up to your new plan&apos;s limits).
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-500/15">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Restored {result.restored_users} members and{" "}
                  {result.restored_projects} projects.
                </p>
                {hasLeftovers && (
                  <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                    {result.still_parked_users} members /{" "}
                    {result.still_parked_projects} projects remain parked —
                    they exceed the current caps (seats: {result.seat_cap},
                    projects: {result.project_cap}).
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
              {error}
            </p>
          )
        )}

        <DialogFooter>
          {result ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline2"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleRestore()}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Restore
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
