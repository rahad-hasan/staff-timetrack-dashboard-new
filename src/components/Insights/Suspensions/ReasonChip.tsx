import { cn } from "@/lib/utils";
import { memo } from "react";

export const REASON_LABELS: Record<string, string> = {
  NONE: "None",
  LOW_DIVERSITY_TYPING: "Low diversity typing",
  INPUT_FLOOD: "Input flood",
  RHYTHMIC_INPUT: "Rhythmic input",
  AUTO_CLICKER: "Auto-clicker",
  GHOST_WORKER: "Ghost worker",
  MODIFIED_DATA: "Modified data",
  SUSPICIOUS_APP: "Suspicious app",
  HIGH_ACTIVITY: "High activity",
  CONSISTENT_ACTIVITY: "Consistent activity",
  PREDOMINANT_MOUSE: "Predominant mouse",
  PREDOMINANT_KEYBOARD: "Predominant keyboard",
  SUSTAINED_HIGH_FOCUS: "Sustained high focus",
  BREAKLESS_WORK: "Breakless work",
  MANUAL: "Manual",
};

export function reasonLabel(code?: string | null) {
  if (!code) return "—";
  return REASON_LABELS[code] ?? code.replace(/_/g, " ").toLowerCase();
}

interface Props {
  code: string | null | undefined;
  className?: string;
}

function ReasonChipImpl({ code, className }: Props) {
  if (!code) return <span className="text-subTextColor">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-borderColor bg-bgSecondary px-2 py-0.5 text-xs font-medium text-headingTextColor",
        "dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextPrimary",
        className,
      )}
      title={code}
    >
      {reasonLabel(code)}
    </span>
  );
}

export const ReasonChip = memo(ReasonChipImpl);
