import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const AttendeeStatBlock = ({
    icon,
    label,
    value,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    tone: "emerald" | "blue" | "amber" | "red" | "slate";
}) => {
    const tones: Record<typeof tone, string> = {
        emerald:
            "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/8 dark:text-emerald-300",
        blue: "border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/8 dark:text-blue-300",
        amber: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/8 dark:text-amber-300",
        red: "border-red-200 bg-red-50/70 text-red-700 dark:border-red-500/25 dark:bg-red-500/8 dark:text-red-300",
        slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/25 dark:bg-slate-500/8 dark:text-slate-300",
    };

    return (
        <div className={cn("rounded-lg border px-3 py-2.5", tones[tone])}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-90">
                {icon}
                {label}
            </div>
            <p className="mt-1.5 text-lg font-semibold leading-none">{value}</p>
        </div>
    );
};

export default AttendeeStatBlock;