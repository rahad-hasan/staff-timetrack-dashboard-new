"use client";

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type TLeaveHistory = {
    type: "casual" | "sick" | "maternity" | "unpaid";
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    status: "approved" | "pending" | "rejected";
};

const LeaveHistory = () => {

    const history: TLeaveHistory[] = [
        {
            type: "casual",
            start_date: "2025-01-04",
            end_date: "2025-01-06",
            days: 3,
            reason: "Family function",
            status: "approved",
        },
        {
            type: "sick",
            start_date: "2025-02-10",
            end_date: "2025-02-12",
            days: 3,
            reason: "High fever",
            status: "pending",
        },
        {
            type: "maternity",
            start_date: "2025-03-01",
            end_date: "2025-03-30",
            days: 30,
            reason: "Maternity leave",
            status: "rejected",
        },
    ];

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
        >
            <DialogHeader>
                <DialogTitle className="mb-4 text-sm sm:text-lg text-headingTextColor dark:text-darkTextPrimary">
                    Leave History Of Ronald Richards
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
                {history.length === 0 && (
                    <p className="text-sm text-gray-500">No leave history found.</p>
                )}

                {history.map((item, index) => (
                    <div
                        key={index}
                        className="border dark:border-darkBorder rounded-md p-3 bg-bgSecondary dark:bg-darkSecondaryBg"
                    >

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary capitalize">
                                {item.type} Leave
                            </span>

                            <Badge
                                variant={
                                    item.status === "approved"
                                        ? "default"
                                        : item.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                }
                                className="text-xs"
                            >
                                {item.status}
                            </Badge>
                        </div>

                        <div className="text-xs text-textGray dark:text-darkTextPrimary space-y-1">
                            <p>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    From:
                                </span>{" "}
                                {item.start_date}
                            </p>
                            <p>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    To:
                                </span>{" "}
                                {item.end_date}
                            </p>
                            <p>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    Days:
                                </span>{" "}
                                {item.days}
                            </p>
                            <p>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    Reason:
                                </span>{" "}
                                {item.reason}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </DialogContent>
    );
};

export default LeaveHistory;
