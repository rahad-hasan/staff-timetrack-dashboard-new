
const HistorySkeleton = () => {
    const PulseBlock = ({ className }: { className: string }) => (
        <div className={`animate-pulse rounded bg-slate-200 dark:bg-gray-700 ${className}`} />
    );
    const gridLayout = "grid grid-cols-[1.5fr_1fr_1fr_1fr_0.5fr_0.8fr_1fr_1.5fr_0.7fr] gap-4 items-center";

    return (
        <div className="space-y-5 w-full">
            {/* 1. HERO CART SKELETON */}
            <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <PulseBlock className="h-7 w-48" />
                        <PulseBlock className="h-4 w-72 sm:w-80" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <PulseBlock className="h-8 w-28" />
                    </div>
                </div>
                <div className="flex flex-col mt-5 gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <PulseBlock className="h-9 w-56" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <PulseBlock className="h-9 w-60" />
                        <PulseBlock className="h-9 w-40" />
                        <PulseBlock className="h-9 w-20" />
                    </div>
                </div>
            </div>

            {/* 2. TABLE CONTAINER SKELETON (Using Divs) */}
            <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
                {/* Table Header Info Area */}
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <PulseBlock className="h-4 w-40" />
                    <PulseBlock className="h-6 w-44 rounded-full" />
                </div>

                {/* Custom Table Head */}
                <div className={`hidden md:${gridLayout} border-b border-borderColor dark:border-darkBorder pb-4 px-2`}>
                    {[
                        "Employee", "Leave type", "Start date", "End date",
                        "Days", "Hours", "Status", "Reason", "Action"
                    ].map((_, i) => (
                        <PulseBlock key={i} className="h-4 w-16" />
                    ))}
                </div>

                {/* Custom Table Body */}
                <div className=" overflow-x-scroll lg:overflow-auto">

                    <div className="divide-y divide-borderColor/50 dark:divide-darkBorder/50">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`py-4 px-2 ${gridLayout}`}>

                                {/* Employee Column */}
                                <div className="flex items-center gap-3">
                                    <PulseBlock className="h-10 w-10 rounded-full shrink-0" />
                                    <div className="space-y-2 overflow-hidden">
                                        <PulseBlock className="h-4 w-24" />
                                        <PulseBlock className="h-3 w-32" />
                                    </div>
                                </div>

                                {/* Leave Type */}
                                <div><PulseBlock className="h-7 w-24 rounded-full" /></div>

                                {/* Dates */}
                                <div><PulseBlock className="h-4 w-20" /></div>
                                <div><PulseBlock className="h-4 w-20" /></div>

                                {/* Days & Hours */}
                                <div><PulseBlock className="h-4 w-8" /></div>
                                <div><PulseBlock className="h-4 w-12" /></div>

                                {/* Status */}
                                <div><PulseBlock className="h-7 w-20 rounded-full" /></div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <PulseBlock className="h-4 w-full" />
                                    <PulseBlock className="h-3 w-2/3" />
                                </div>

                                {/* Action */}
                                <div className="flex justify-end">
                                    <PulseBlock className="h-9 w-20 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistorySkeleton;