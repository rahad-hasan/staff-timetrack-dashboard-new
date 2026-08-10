/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { disconnectIntegration } from "@/actions/integrations/appIntegrationAction";
import { IntegrationImportResult } from "@/types/type";
import { IntegrationDef } from "@/components/Integrations/registry";
import { useRouter } from "next/navigation";
import SyncProgressDialog from "./IntegrationDetail/SyncProgressDialog";
import ImportedItemsList from "./IntegrationDetail/ImportedItemsList";
import ConnectionInfo from "./IntegrationDetail/ConnectionInfo";
import ConnectionAlerts from "./IntegrationDetail/ConnectionAlerts";
import IntegrationHeader from "./IntegrationDetail/IntegrationHeader";
import { mergeResults } from "./IntegrationDetail/utils";
import { useSync } from "./IntegrationDetail/useSync";
import { useImport } from "./IntegrationDetail/useImport";
import { useIntegrationItems } from "./IntegrationDetail/useIntegrationItems";
import { useIntegrationStatus } from "./IntegrationDetail/useIntegrationStatus";
import IntegrationPickerDialog from "./IntegrationPickerDialog";

interface Props {
  def: IntegrationDef;
  onBack: () => void;
}

export default function IntegrationDetail({ def, onBack }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resultView, setResultView] = useState<any>(null);
  const [reconnectHint, setReconnectHint] = useState(false);
  const [mutationCooldown, setMutationCooldown] = useState(false);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

  const startCooldown = () => {
    setMutationCooldown(true);
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
    }

    cooldownTimer.current = setTimeout(() => setMutationCooldown(false), 5000);
  };

  const { status, statusLoading, statusError, fetchStatus } =
    useIntegrationStatus(def.key);

  const isConnected = status?.status === "connected";

  const isLost = status?.status === "expired" || status?.status === "revoked";

  const { items, itemsLoading, itemsError, fetchItems } = useIntegrationItems({
    integrationKey: def.key,
    enabled: isConnected && def.capabilities.boardPicker,
    nounPlural: def.noun.plural,
    onConnectionLost: () => {
      setPickerOpen(false);
      fetchStatus({
        silent: true,
      });
    },
  });

  const importedItems = useMemo(
    () => (items ?? []).filter((item) => item.already_imported),
    [items],
  );

  const syncDisabled =
    mutationCooldown || items === null || importedItems.length === 0;

  const { importing, handleImport } = useImport({
    integrationKey: def.key,
    onSuccess: (result: IntegrationImportResult) => {
      setPickerOpen(false);
      setResultView({
        mode: "import",
        result,
        stalled: false,
      });
    },

    onAfterMutation: () => {
      fetchStatus({
        silent: true,
      });
      fetchItems({
        silent: true,
      });
      router.refresh();
    },

    onConnectionLost: () => {
      setPickerOpen(false);
      fetchStatus({
        silent: true,
      });
    },

    startCooldown,
  });

  const { syncing, continuing, sync } = useSync({
    integrationKey: def.key,
    onAfterMutation: () => {
      fetchStatus({
        silent: true,
      });
      fetchItems({
        silent: true,
      });
      router.refresh();
    },

    onConnectionLost: () => {
      fetchStatus({
        silent: true,
      });
    },

    startCooldown,

    onResult: (result, mode, stalled) => {
      setResultView((current) =>
        current
          ? {
              mode,
              result: mergeResults(current.result, result),
              stalled,
            }
          : {
              mode,
              result,
              stalled,
            },
      );
    },
  });

  const handleDisconnect = async () => {
    const res: any = await disconnectIntegration(def.key);

    if (res?.success) {
      toast.success(`${def.name} disconnected`);

      fetchStatus({
        silent: true,
      });
    } else {
      toast.error(res?.message ?? "Disconnect failed");
    }
  };

  const disconnectConfirm = (
    <ConfirmDialog
      trigger={
        <Button variant="outline2" size="sm">
          Disconnect
        </Button>
      }
      title={`Disconnect ${def.name}?`}
      description={`Disconnecting stops syncing from ${def.name}.`}
      confirmText="Disconnect"
      cancelText="Cancel"
      onConfirm={handleDisconnect}
    />
  );

  return (
    <div className="mt-5">
      <button onClick={onBack} className="mb-4 text-sm">
        ← All integrations
      </button>

      <div className="rounded-2xl border p-5">
        <IntegrationHeader
          def={def}
          status={status}
          blocking={importing || syncing || continuing}
          connectBusy={false}
          syncing={syncing}
          syncDisabled={syncDisabled}
          items={items}
          importedItemsCount={importedItems.length}
          startConnect={() => {}}
          onImport={() => setPickerOpen(true)}
          onSync={() => sync("fresh")}
          disconnectTrigger={disconnectConfirm}
          isLost={isLost}
        />

        <ConnectionAlerts
          def={def}
          status={status}
          popupBlocked={false}
          isConnected={isConnected}
          isLost={isLost}
          reconnectHint={reconnectHint}
          setReconnectHint={setReconnectHint}
          syncDisabled={syncDisabled}
          syncIsStale={false}
          importedItemsCount={importedItems.length}
          onSync={() => sync("fresh")}
        />

        {isConnected && <ConnectionInfo def={def} status={status} />}

        {isConnected && def.capabilities.boardPicker && (
          <ImportedItemsList
            def={def}
            items={items}
            itemsLoading={itemsLoading}
            itemsError={itemsError}
            onRefresh={fetchItems}
          />
        )}
      </div>

      <Dialog open={pickerOpen}>
        <IntegrationPickerDialog
          def={def}
          items={items}
          itemsLoading={itemsLoading}
          itemsError={itemsError}
          importing={importing}
          onRefreshItems={fetchItems}
          onImport={handleImport}
          onCancel={() => setPickerOpen(false)}
        />
      </Dialog>

      <SyncProgressDialog open={syncing} def={def} />
    </div>
  );
}
