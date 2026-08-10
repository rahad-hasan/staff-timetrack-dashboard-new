/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { importIntegrationItems } from "@/actions/integrations/appIntegrationAction";
import {
  IntegrationImportPayload,
  IntegrationImportResult,
} from "@/types/type";

interface UseImportProps {
  integrationKey: string;

  onSuccess: (result: IntegrationImportResult) => void;

  onAfterMutation: () => void;

  onConnectionLost: () => void;

  startCooldown: () => void;
}

interface UseImportReturn {
  importing: boolean;

  handleImport: (payload: IntegrationImportPayload) => Promise<void>;
}

export const useImport = ({
  integrationKey,
  onSuccess,
  onAfterMutation,
  onConnectionLost,
  startCooldown,
}: UseImportProps): UseImportReturn => {
  const [importing, setImporting] = useState(false);

  const handleImport = async (payload: IntegrationImportPayload) => {
    if (importing) return;

    setImporting(true);

    try {
      const res: any = await importIntegrationItems(integrationKey, payload);

      if (res?.success) {
        onSuccess(res.data);
        onAfterMutation();

        return;
      }

      if (res?.statusCode === 401) {
        toast.error(res?.message || "Import failed");

        onConnectionLost();

        return;
      }

      const message = res?.message || "Import failed";

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
    } catch {
      toast.error(
        "Import request failed — if it was already running it will finish on the server; refresh in a minute.",
      );
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    handleImport,
  };
};
