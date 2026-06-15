import { memo } from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ISuspensionSummaryTotals } from "@/types/trackingSuspension";

interface Props {
  totals: ISuspensionSummaryTotals | null;
  loading?: boolean;
}

const cardBase =
  "flex flex-col gap-2 rounded-[12px] border border-borderColor bg-bgPrimary p-4 dark:border-darkBorder dark:bg-darkSecondaryBg";

function Card({
  icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          {label}
        </span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            accent ?? "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-7 w-20 animate-pulse rounded-md bg-bgSecondary dark:bg-darkPrimaryBg" />
      ) : (
        <div className="text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
          {value}
        </div>
      )}
    </div>
  );
}

function KpiStripImpl({ totals, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card
        icon={<Users className="size-4" />}
        label="Users flagged"
        value={totals?.total_users ?? 0}
        loading={loading}
      />
      <Card
        icon={<AlertTriangle className="size-4" />}
        label="Events"
        value={totals?.total_events ?? 0}
        loading={loading}
      />
      <Card
        icon={<Zap className="size-4" />}
        label="Ongoing"
        value={totals?.total_ongoing ?? 0}
        accent="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
        loading={loading}
      />
      <Card
        icon={<ShieldAlert className="size-4" />}
        label="High severity"
        value={totals?.total_high_severity ?? 0}
        accent="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"
        loading={loading}
      />
      <Card
        icon={<Clock className="size-4" />}
        label="Total paused"
        value={totals?.total_duration ?? "00:00:00"}
        loading={loading}
      />
    </div>
  );
}

export const KpiStrip = memo(KpiStripImpl);
