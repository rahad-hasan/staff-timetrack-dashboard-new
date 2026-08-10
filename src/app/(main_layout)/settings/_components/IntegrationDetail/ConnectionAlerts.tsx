"use client";

import { Button } from "@/components/ui/button";
import { Info, RefreshCcw, X } from "lucide-react";
import {
  IntegrationDef,
  describeImport,
} from "@/components/Integrations/registry";
import { IntegrationStatusResponse } from "@/types/type";
import { formatRelative } from "./utils";

interface ConnectionAlertsProps {
  def: IntegrationDef;
  status: IntegrationStatusResponse | null;

  popupBlocked: boolean;
  isConnected: boolean;
  isLost: boolean;

  reconnectHint: boolean;
  setReconnectHint: (value: boolean) => void;

  syncIsStale: boolean;
  syncDisabled: boolean;

  importedItemsCount: number;

  onSync: () => void;
}

const ConnectionAlerts = ({
  def,
  status,
  popupBlocked,
  isConnected,
  isLost,
  reconnectHint,
  setReconnectHint,
  syncIsStale,
  syncDisabled,
  importedItemsCount,
  onSync,
}: ConnectionAlertsProps) => {
  return (
    <>
      {popupBlocked && (
        <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          Your browser blocked the {def.name} sign-in popup. Allow popups for
          this site and click {isLost ? "Reconnect" : "Connect"} again.
        </div>
      )}

      {isLost && (
        <div className="mt-5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          {def.name} revoked the connection. Reconnect to resume syncing.
          Projects and tasks already imported remain available.
        </div>
      )}

      {!isConnected && def.notes?.connect && (
        <p className="mt-5 flex items-start gap-1.5 text-xs text-subTextColor dark:text-darkTextSecondary">
          <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{def.notes.connect}</span>
        </p>
      )}

      {isConnected && syncIsStale && !reconnectHint && (
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2.5">
          <p className="flex-1 text-xs text-amber-800 dark:text-amber-200">
            Last synced {formatRelative(status?.last_synced_at)}.{` `}
            {def.name} stops sending automatic updates after long periods of
            inactivity. Run a sync to re-enable them.
          </p>

          <Button
            size="sm"
            disabled={syncDisabled || importedItemsCount === 0}
            onClick={onSync}
            className="gap-2 shrink-0"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Sync now
          </Button>
        </div>
      )}

      {isConnected && reconnectHint && (
        <div className="mt-5 flex items-start justify-between gap-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 px-3 py-2.5">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Reconnected successfully. Automatic updates stay disabled until the
            next sync. Run <strong>Sync now</strong> once to enable them again.
          </p>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setReconnectHint(false)}
            className="shrink-0 text-blue-700 dark:text-blue-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!isConnected && !isLost && (
        <div className="mt-5 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-4">
          <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            How it works
          </p>

          <ul className="mt-2 space-y-1.5 text-xs text-subTextColor dark:text-darkTextSecondary list-disc pl-4">
            <li>{describeImport(def)}</li>

            <li>
              Changes in {def.name} automatically sync, including new{" "}
              {def.countNoun}s, renames, and deletions.
            </li>

            <li>
              {def.notes?.assigneeMatching ??
                "Assignees are matched by email address."}
            </li>
          </ul>

          <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
            Only a company admin can connect {def.name}.
          </p>
        </div>
      )}
    </>
  );
};

export default ConnectionAlerts;
