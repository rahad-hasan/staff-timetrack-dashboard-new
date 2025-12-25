/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import RejectLeaveRequestModal from "./RejectLeaveRequestModal";
import LeaveHistory from "./LeaveHistory";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { ILeaveRequest } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import { approveRejectLeave } from "@/actions/leaves/action";

const LeaveRequestTable = ({ data }: { data: ILeaveRequest[] }) => {
    console.log('data from server', data);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    async function handleApprove(values: ILeaveRequest) {

        setLoadingId(values.id);
        try {
            const res = await approveRejectLeave({
                data: {
                    leave_id: values.id,
                    approved: true
                }
            });

            if (res?.success) {
                toast.success(res?.message || "Request approved successfully");
            } else {
                toast.error(res?.message || "Failed to approve request");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong!");
        } finally {
            setLoadingId(null);
        }
    }

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
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <span className=" cursor-pointer">{name}</span>
                                </DialogTrigger>
                                <LeaveHistory></LeaveHistory>
                            </form>
                        </Dialog>
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
        {
            accessorKey: "action",
            header: () => {
                return (
                    <div>
                        <p>
                            Action
                        </p>
                    </div>
                )
            },
            cell: ({ row }) => {
                const isThisRowLoading = loadingId === row?.original?.id;
                return (
                    <div className="flex items-center gap-3">
                        <Button onClick={() => handleApprove(row?.original)} size={'sm'} disabled={isThisRowLoading} className=" text-sm px-2 rounded-lg">{isThisRowLoading ? "Loading..." : "Approve"}</Button>
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button size={'sm'} className=" text-sm bg-red-500 hover:bg-red-500 dark:text-white px-2 rounded-lg">Reject</Button>
                                </DialogTrigger>
                                <RejectLeaveRequestModal data={row?.original}></RejectLeaveRequestModal>
                            </form>
                        </Dialog>
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
                <h2 className=" text-base sm:text-lg dark:text-darkTextPrimary">Leave Request</h2>
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

export default LeaveRequestTable;