"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { ILeaveRequest } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const UserLeaveHistoryTable = ({ data }: { data: ILeaveRequest[] }) => {
    const userName = data?.length ? data?.[0]?.user?.name : null

    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const getStatusStyles = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "processing":
                return {
                    button: "bg-[#fff5db] border-[#efaf07] text-[#efaf07] hover:bg-[#fff5db] dark:bg-transparent",
                    dot: "bg-[#efaf07]"
                };
            case "cancelled":
                return {
                    button: "bg-[#fee6eb] border-[#f40139] text-[#f40139] hover:bg-[#fee6eb] dark:bg-transparent",
                    dot: "bg-[#f40139]"
                };
            case "pending":
                return {
                    button: "bg-[#eff7fe] border-[#5db0f1] text-[#5db0f1] hover:bg-[#eff7fe] dark:bg-transparent",
                    dot: "bg-[#5db0f1]"
                };
            default: // completed or others
                return {
                    button: "bg-[#e9f8f0] border-[#26bd6c] text-[#26bd6c] hover:bg-[#e9f8f0] dark:bg-transparent",
                    dot: "bg-[#26bd6c]"
                };
        }
    };

    const columns: ColumnDef<ILeaveRequest>[] = [
        {
            accessorKey: "name",
            header: () => {
                return (
                    <div>
                        <p>
                            Member name
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const img = row?.original?.user?.image ? row?.original?.user?.image : ''
                const name = row?.original?.user?.name
                return (
                    <div className="flex items-center gap-2 min-w-[160px]">
                        <Avatar>
                            <AvatarImage src={img} alt={name} />
                            <AvatarFallback>
                                {name
                                    ?.trim()
                                    .split(" ")
                                    .map(word => word[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <p className=" cursor-pointer">{name}</p>

                    </div>
                )
            }
        },
        {
            accessorKey: "type",
            header: () => {
                return (
                    <div>
                        <p>
                            leave Type
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const leaveType = row.getValue("type") as string;
                return (
                    <div className="flex flex-col">
                        <span className="capitalize">{leaveType} Leave</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "start_date",
            header: () => {
                return (
                    <div>
                        <p>

                            From
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const start_date = row.getValue("start_date") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{format(new Date(start_date), "EEE, MMM d, yyyy")}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "end_date",
            header: () => {
                return (
                    <div>
                        <p>

                            To
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const end_date = row.getValue("end_date") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{format(new Date(end_date), "EEE, MMM d, yyyy")}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "leave_count",
            header: () => {
                return (
                    <div>
                        <p>
                            Days
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const leave_count = row.getValue("leave_count") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{leave_count}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "reason",
            header: () => {
                return (
                    <div>
                        <p>
                            Reason
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const reason = row.getValue("reason") as string;

                const truncatedReason = reason?.length > 10
                    ? reason.substring(0, 10) + "..."
                    : reason;

                return (
                    <div className="flex flex-col">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="">
                                    {truncatedReason}
                                </span>
                            </TooltipTrigger>
                            {
                                reason.length > 10 &&
                                <TooltipContent className="p-3 w-56 text-headingTextColor dark:text-darkTextPrimary">
                                    <div>
                                        <p className="text-sm">{reason}</p>
                                    </div>
                                </TooltipContent>
                            }

                        </Tooltip>
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <span
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </span>
            ),
            cell: ({ row }) => {
                const status = row.original.hr_approved ? "processing" : row.original.admin_approved ? "approved" : "pending";
                const styles = getStatusStyles(status);

                return (
                    <Button
                        className={`text-sm border flex items-center gap-2 px-3 h-8 shadow-none ${styles.button} cursor-default capitalize`}
                    >
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                        {status || "N/A"}
                    </Button>
                );
            },
        },
        // {
        //     accessorKey: "availableLeave",
        //     header: () => {
        //         return (
        //             <div>
        //                 <p>
        //                     Available Leave
        //                 </p>
        //             </div>
        //         )
        //     },
        //     cell: ({ row }) => {
        //         const availableLeave = row.getValue("availableLeave") as number;
        //         const widthPercentage = Math.min((availableLeave / 32) * 100, 100);
        //         const barColor =
        //             availableLeave < 10
        //                 ? "bg-green-500"
        //                 : availableLeave < 20
        //                     ? "bg-yellow-500"
        //                     : "bg-red-500";
        //         return (
        //             <div className=" flex items-center ">
        //                 <p className=" w-7">{availableLeave}</p>
        //                 <div className={`bg-gray-100 dark:bg-gray-500 flex h-4.5 w-16 rounded-full relative`}>
        //                     <p className={`${barColor} flex h-4.5 rounded-full absolute top-0 left-0`} style={{ width: `${widthPercentage}%` }}></p>
        //                 </div>
        //             </div>
        //         )
        //     }
        // },
    ];

    const table = useReactTable({
        data: data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
    });

    return (
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5  rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg dark:text-darkTextPrimary">Leave History {userName && `Of ${userName}`}</h2>
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <EmptyTableRow columns={columns} text="No leave request found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default UserLeaveHistoryTable;