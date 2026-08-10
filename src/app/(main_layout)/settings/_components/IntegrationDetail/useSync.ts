/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { syncIntegration } from "@/actions/integrations/appIntegrationAction";
import { IntegrationImportResult } from "@/types/type";
import { sameIds } from "./utils";

interface UseSyncProps {
  integrationKey: string;

  onAfterMutation: () => void;

  onConnectionLost: () => void;

  startCooldown: () => void;

  onResult: (
    result: IntegrationImportResult,
    mode: "sync",
    stalled: boolean,
  ) => void;
}

interface UseSyncReturn {
  syncing: boolean;
  continuing: boolean;

  sync: (kind: "fresh" | "continue") => Promise<void>;
}

export const useSync = ({
  integrationKey,
  onAfterMutation,
  onConnectionLost,
  startCooldown,
  onResult,
}: UseSyncProps): UseSyncReturn => {
  const [syncing, setSyncing] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const previousRemainingRef = useRef<string[] | null>(null);

  const handleError = (res: any) => {
    if (res?.statusCode === 401) {
      toast.error(res?.message || "Sync failed");

      onConnectionLost();

      return;
    }

    const message = res?.message || "Sync failed";

    if (message.includes("already running")) {
      toast.error(
        "An import or sync is already in progress — try again shortly.",
      );

      startCooldown();
    } else if (message.includes("not connected")) {
      toast.error(message);

      onConnectionLost();
    } else if (res?.errorMessages?.length) {
      toast.error(res.errorMessages[0]?.message || message);
    } else {
      toast.error(message);
    }
  };

  const sync = async (kind: "fresh" | "continue") => {
    if (syncing || continuing) {
      return;
    }

    if (kind === "fresh") {
      setSyncing(true);
    } else {
      setContinuing(true);
    }

    try {
      const res: any = await syncIntegration(integrationKey);

      if (res?.success) {
        const data: IntegrationImportResult = res.data;

        const nextRemaining = data.remaining_ids ?? [];

        let stalled = false;

        if (kind === "fresh") {
          previousRemainingRef.current = nextRemaining;
        } else {
          const previous = previousRemainingRef.current ?? [];

          stalled =
            previous.length > 0 &&
            nextRemaining.length > 0 &&
            sameIds(previous, nextRemaining);

          previousRemainingRef.current = nextRemaining;
        }

        onResult(data, "sync", stalled);

        onAfterMutation();
      } else {
        handleError(res);
      }
    } catch {
      toast.error(
        "Sync request failed — if it was already running it will finish on the server; refresh in a minute.",
      );
    } finally {
      if (kind === "fresh") {
        setSyncing(false);
      } else {
        setContinuing(false);
      }
    }
  };

  return {
    syncing,
    continuing,
    sync,
  };
};
