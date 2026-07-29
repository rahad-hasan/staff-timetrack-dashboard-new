import { cn } from "@/lib/utils";
import { memo } from "react";

function bandFor(score: number) {
  if (score >= 80) return { label: "Critical", color: "bg-red-500", text: "text-red-600 dark:text-red-300" };
  if (score >= 60) return { label: "High", color: "bg-orange-500", text: "text-orange-600 dark:text-orange-300" };
  if (score >= 30) return { label: "Medium", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-300" };
  return { label: "Low", color: "bg-gray-400", text: "text-gray-600 dark:text-darkTextSecondary" };
}

function RiskGaugeImpl({ score }: { score: number | null }) {
  if (score == null) return null;
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandFor(safeScore);
  return (
    <div
      className="rounded-[10px] border border-borderColor bg-bgSecondary p-3 dark:border-darkBorder dark:bg-darkSecondaryBg"
      role="img"
      aria-label={`Risk score ${safeScore} of 100 (${band.label})`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          Risk score
        </span>
        <span className={cn("text-xs font-semibold", band.text)}>{band.label}</span>
      </div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-semibold tabular-nums text-headingTextColor dark:text-darkTextPrimary">
          {safeScore}
        </span>
        <span className="pb-1 text-xs text-subTextColor dark:text-darkTextSecondary">
          / 100
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-borderColor/60 dark:bg-darkBorder/60"
        aria-hidden
      >
        <div
          className={cn("h-full rounded-full transition-[width]", band.color)}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

export const RiskGauge = memo(RiskGaugeImpl);
