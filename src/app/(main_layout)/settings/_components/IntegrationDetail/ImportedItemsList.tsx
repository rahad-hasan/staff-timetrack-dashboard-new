"use client";

import { RefreshCcw, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { IntegrationDef } from "@/components/Integrations/registry";
import { IntegrationItem } from "@/types/type";

interface ImportedItemsListProps {
  def: IntegrationDef;

  items: IntegrationItem[] | null;
  itemsLoading: boolean;
  itemsError: string | null;

  onRefresh: () => void;
}

const ImportedItemsList = ({
  def,
  items,
  itemsLoading,
  itemsError,
  onRefresh,
}: ImportedItemsListProps) => {
  const importedItems = (items ?? []).filter((item) => item.already_imported);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
          Imported {def.noun.plural}
          {items !== null && (
            <span className="ml-1.5 text-xs font-normal text-subTextColor dark:text-darkTextSecondary">
              {importedItems.length}
            </span>
          )}
        </p>

        <Button
          variant="outline2"
          size="sm"
          onClick={onRefresh}
          disabled={itemsLoading}
          aria-label={`Refresh ${def.noun.plural}`}
          className="text-headingTextColor dark:text-darkTextPrimary"
        >
          <RefreshCcw
            className={cn("h-3.5 w-3.5", itemsLoading && "animate-spin")}
          />
        </Button>
      </div>

      {/* Loading */}
      {itemsLoading && (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-14 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!itemsLoading && itemsError && (
        <div className="mt-3">
          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
            {itemsError}
          </div>

          <Button
            variant="outline2"
            size="sm"
            className="mt-3"
            onClick={onRefresh}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!itemsLoading &&
        !itemsError &&
        items !== null &&
        importedItems.length === 0 && (
          <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
            No {def.noun.plural} imported yet. Use{" "}
            <span className="font-medium">Import {def.noun.plural}</span> to
            bring your {def.name} work in.
          </p>
        )}

      {/* Imported list */}
      {!itemsLoading && !itemsError && importedItems.length > 0 && (
        <ul className="mt-3 space-y-2">
          {importedItems.map((item) => {
            const subtitle = [
              item.workspace?.name,
              item.space?.name,
              item.badge,

              item.items_count != null
                ? `${item.items_count} ${def.countNoun}${
                    item.items_count === 1 ? "" : "s"
                  }`
                : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {item.name}
                  </p>

                  {subtitle && (
                    <p className="truncate text-xs text-subTextColor dark:text-darkTextSecondary">
                      {subtitle}
                    </p>
                  )}
                </div>

                {item.project_id !== null && (
                  <Link
                    href={`/project-management/projects/${item.project_id}`}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View project
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ImportedItemsList;
