"use client";

import Image from "next/image";
import { Loader2, Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IntegrationDef } from "@/components/Integrations/registry";
import { IntegrationStatusResponse } from "@/types/type";
import { statusMeta } from "./constants";

interface IntegrationHeaderProps {
  def: IntegrationDef;
  status: IntegrationStatusResponse | null;

  blocking: boolean;
  connectBusy: boolean;
  syncing: boolean;
  syncDisabled: boolean;

  items: unknown[] | null;
  importedItemsCount: number;

  startConnect: () => void;
  onImport: () => void;
  onSync: () => void;

  disconnectTrigger: React.ReactNode;

  isLost: boolean;
}

const IntegrationHeader = ({
  def,
  status,
  blocking,
  connectBusy,
  syncing,
  syncDisabled,
  items,
  importedItemsCount,
  startConnect,
  onImport,
  onSync,
  disconnectTrigger,
  isLost,
}: IntegrationHeaderProps) => {
  const connStatus = status?.status ?? "disconnected";
  const isConnected = connStatus === "connected";

  const meta =
    statusMeta[connStatus as keyof typeof statusMeta] ??
    statusMeta.disconnected;

  const StatusIcon = meta.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-bgSecondary dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder flex items-center justify-center shrink-0">
          <Image
            src={def.logo}
            alt={def.name}
            width={50}
            height={50}
            className="w-6"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {def.name}
            </h3>

            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                meta.className,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary max-w-md">
            {def.blurb}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start">
        {!isConnected && (
          <Button
            onClick={startConnect}
            disabled={connectBusy}
            className={cn(
              "gap-2",
              isLost && "bg-amber-600 hover:bg-amber-700 text-white",
            )}
          >
            {connectBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Image
                src={def.logo}
                alt={def.name}
                width={20}
                height={20}
                className="w-4"
              />
            )}

            {isLost ? "Reconnect" : `Connect ${def.name}`}
          </Button>
        )}

        {isConnected && (
          <>
            {def.capabilities.boardPicker && (
              <Button onClick={onImport} disabled={blocking} className="gap-2">
                <Download className="h-3.5 w-3.5" />
                Import {def.noun.plural}
              </Button>
            )}

            {def.capabilities.sync && (
              <Button
                variant="outline2"
                size="sm"
                onClick={onSync}
                disabled={syncDisabled}
                title={
                  items === null
                    ? undefined
                    : importedItemsCount === 0
                      ? `Import ${def.noun.plural} first`
                      : undefined
                }
                className="gap-2 text-headingTextColor dark:text-darkTextPrimary"
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3.5 w-3.5" />
                )}
                Sync now
              </Button>
            )}

            {disconnectTrigger}
          </>
        )}

        {isLost && disconnectTrigger}
      </div>
    </div>
  );
};

export default IntegrationHeader;
