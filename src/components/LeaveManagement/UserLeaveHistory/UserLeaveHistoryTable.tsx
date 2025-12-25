"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { ILeaveRequest } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

const UserLeaveHistoryTable = ({ data }: { data: ILeaveRequest[] }) => {
    const userName = data?.length ? data?.[0]?.user?.name : null

    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

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
                return (
                    <div className="flex flex-col">
                        <span className="">{reason}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "approve",
            header: () => {
                return (
                    <div>
                        <p>
                            Status
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const status = row?.original?.hr_approved && row?.original?.admin_approved
                return (
                    <div className=" flex items-center ">
                        {
                            status ?
                                <p className=" text-green-500">Approved</p>
                                :
                                <p className=" text-red-500">Rejected</p>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "availableLeave",
            header: () => {
                return (
                    <div>
                        <p>
                            Available Leave
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const availableLeave = row.getValue("availableLeave") as number;
                const widthPercentage = Math.min((availableLeave / 32) * 100, 100);
                const barColor =
                    availableLeave < 10
                        ? "bg-green-500"
                        : availableLeave < 20
                            ? "bg-yellow-500"
                            : "bg-red-500";
                return (
                    <div className=" flex items-center ">
                        <p className=" w-7">{availableLeave}</p>
                        <div className={`bg-gray-100 dark:bg-gray-500 flex h-4.5 w-16 rounded-full relative`}>
                            <p className={`${barColor} flex h-4.5 rounded-full absolute top-0 left-0`} style={{ width: `${widthPercentage}%` }}></p>
                        </div>
                    </div>
                )
            }
        },
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