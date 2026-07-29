import { cn } from "@/lib/utils";
import { memo } from "react";
import type { TSeverity } from "@/types/trackingSuspension";

const SEVERITY_LABEL: Record<TSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const SEVERITY_CLASSES: Record<TSeverity, string> = {
  critical:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  high: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  low: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-darkSecondaryBg dark:text-darkTextSecondary dark:border-darkBorder",
};

interface Props {
  severity: TSeverity;
  className?: string;
  label?: string;
}

function SeverityChipImpl({ severity, className, label }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        SEVERITY_CLASSES[severity],
        className,
      )}
      aria-label={`Severity ${SEVERITY_LABEL[severity]}`}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          severity === "critical" && "bg-red-500",
          severity === "high" && "bg-orange-500",
          severity === "medium" && "bg-amber-500",
          severity === "low" && "bg-gray-400",
        )}
      />
      {label ?? SEVERITY_LABEL[severity]}
    </span>
  );
}

export const SeverityChip = memo(SeverityChipImpl);
