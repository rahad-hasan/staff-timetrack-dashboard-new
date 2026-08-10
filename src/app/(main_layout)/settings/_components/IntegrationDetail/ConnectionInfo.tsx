"use client";

import { Calendar as CalendarIcon, Globe, Mail } from "lucide-react";

import { IntegrationDef } from "@/components/Integrations/registry";
import { IntegrationStatusResponse } from "@/types/type";
import { formatRelative } from "./utils";

interface ConnectionInfoProps {
  def: IntegrationDef;
  status: IntegrationStatusResponse | null;
}

const ConnectionInfo = ({ def, status }: ConnectionInfoProps) => {
  if (!status) return null;

  const accountLabel =
    status.provider_email ??
    status.metadata?.account_user_name ??
    `${def.name} account`;

  const sites = status.metadata?.sites ?? [];

  return (
    <div
      className={[
        "mt-5 grid grid-cols-1 gap-3",
        sites.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      ].join(" ")}
    >
      {/* Connected Account */}
      <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
          <Mail className="h-3 w-3" />
          Connected account
        </p>

        <p className="mt-1 truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
          {accountLabel}
        </p>
      </div>

      {/* Last Synced */}
      <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
          <CalendarIcon className="h-3 w-3" />
          Last synced
        </p>

        <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
          {formatRelative(status.last_synced_at)}
        </p>
      </div>

      {/* Sites */}
      {sites.length > 0 && (
        <div className="rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/40 dark:bg-darkPrimaryBg/40 p-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-subTextColor dark:text-darkTextSecondary">
            <Globe className="h-3 w-3" />
            Sites
            <span className="font-semibold">{sites.length}</span>
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {sites.map((site) =>
              site.url ? (
                <a
                  key={site.id}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-primary hover:underline"
                >
                  {site.name}
                </a>
              ) : (
                <span
                  key={site.id}
                  className="truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
                >
                  {site.name}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionInfo;
