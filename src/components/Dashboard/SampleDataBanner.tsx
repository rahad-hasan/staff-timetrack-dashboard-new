"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dismissSampleData } from "@/actions/dashboard/sampleData";

const SampleDataBanner = () => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const handleDismiss = () => {
        if (pending) return;
        startTransition(async () => {
            try {
                await dismissSampleData();
                toast.success("Sample data hidden. Your tracked data will appear here.");
                router.refresh();
            } catch {
                toast.error("Could not hide sample data. Please try again.");
            }
        });
    };

    return (
        <div
            role="status"
            className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 dark:border-primary/30 dark:bg-primary/15 px-4 py-3 2xl:px-5 2xl:py-4"
        >
            <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    You are viewing sample data
                </p>
                <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                    The dashboard is filled with demo projects, members, tasks, and
                    activity so you can see how it works.
                </p>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                    Start tracking time to see your real data.
                </p>
            </div>
            {/* aria-busy + guard instead of disabled: disabling the focused
                button mid-dismiss drops keyboard focus to <body>. */}
            <Button
                onClick={handleDismiss}
                aria-busy={pending}
                variant="ghost"
                size="sm"
                className="self-start sm:self-center shrink-0 rounded-lg border border-borderColor/70 bg-bgPrimary text-headingTextColor hover:bg-bgSecondary dark:border-darkBorder/40 dark:bg-darkTertiaryBg dark:text-darkTextPrimary dark:hover:bg-darkSecondaryBg"
                aria-label="Don't show sample data again"
            >
                {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <X className="h-3.5 w-3.5" />
                )}
                Don&apos;t show
            </Button>
        </div>
    );
};

export default SampleDataBanner;
