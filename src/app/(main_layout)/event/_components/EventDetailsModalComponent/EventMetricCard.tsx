import { ReactNode } from "react";

const EventMetricCard = ({
    icon,
    label,
    value,
    helper,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    helper?: string;
}) => (
    <div className="rounded-lg border border-borderColor bg-white px-4 py-3.5 dark:border-darkBorder dark:bg-darkPrimaryBg">
        <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {icon}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                {label}
            </p>
        </div>
        <p className="mt-2.5 text-sm font-semibold leading-snug text-headingTextColor dark:text-darkTextPrimary">
            {value}
        </p>
        {helper && (
            <p className="mt-1 text-[11px] text-subTextColor dark:text-darkTextSecondary">
                {helper}
            </p>
        )}
    </div>
);

export default EventMetricCard;