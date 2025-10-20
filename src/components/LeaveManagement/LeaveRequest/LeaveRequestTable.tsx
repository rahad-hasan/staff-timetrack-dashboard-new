"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import emptyBoxLogo from "../../../assets/projects/emptyBox.svg"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ILeaveRequest } from "@/global/globalTypes";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import RejectLeaveRequestModal from "./RejectLeaveRequestModal";

const LeaveRequestTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const leaveRequestList: ILeaveRequest[] = useMemo(
        () => [
            {
                image: "https://picsum.photos/200/300",
                name: "Guy Hawkins",
                from: "12 Oct,2025",
                to: "14 Oct,2025",
                days: 4,
                reason: "Going to my village",
                availableLeave: 10
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Darlene Robertson",
                from: "12 Oct,2025",
                to: "14 Oct,2025",
                days: 3,
                reason: "Going to my village",
                availableLeave: 22
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Marvin McKinney",
                from: "12 Oct,2025",
                to: "14 Oct,2025",
                days: 5,
                reason: "Going to my village",
                availableLeave: 18
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Ronald Richards",
                from: "12 Oct,2025",
                to: "14 Oct,2025",
                days: 2,
                reason: "Going to my village",
                availableLeave: 6
            }
        ],
        []
    );

    const columns: ColumnDef<ILeaveRequest>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Member name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                const img = row.original.image;
                return (
                    <div className="flex items-center gap-2">
                        <Image src={img} alt="profile" width={200} height={200} className="w-8 h-8 object-cover rounded-full" />
                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "from",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            From
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const from = row.getValue("from") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{from}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "to",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            To
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const to = row.getValue("to") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{to}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "days",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Days
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const days = row.getValue("days") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{days}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "reason",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Reason
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
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
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Available Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
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
                        <div className={`bg-gray-100 flex h-4 w-16 rounded-full relative`}>
                            <p className={`${barColor} flex h-4 rounded-full absolute top-0 left-0`} style={{ width: `${widthPercentage}%` }}></p>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "action",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Action
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: () => {

                return (
                    <div className="flex items-center gap-3">
                        <Button size={'sm'} className=" text-sm">Approve</Button>
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <Button size={'sm'} className=" text-sm bg-red-500 hover:bg-red-500">Reject</Button>
                                </DialogTrigger>
                                <RejectLeaveRequestModal></RejectLeaveRequestModal>
                            </form>
                        </Dialog>
                    </div>
                )
            }
        },
    ];

    const table = useReactTable({
        data: leaveRequestList,
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
        <div className="mt-5 border-2 border-borderColor p-3 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-md sm:text-lg">Leave Request</h2>
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
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <div className=" flex flex-col items-center justify-center py-8">
                                    <Image src={emptyBoxLogo} alt="Empty" width={200} height={200} className=" w-24 mb-3" />
                                    <p className=" text-lg mb-1">No project found!</p>
                                    <p>Currently this client have no project data</p>
                                </div>

                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default LeaveRequestTable;