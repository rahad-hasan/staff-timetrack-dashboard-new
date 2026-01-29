"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { IUserLeaveData } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import LeaveDataDetailsModal from "./LeaveDataDetailsModal";

const LeaveDataTable = ({ data }: { data: IUserLeaveData[] }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const columns: ColumnDef<IUserLeaveData>[] = [
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
                const name = row?.original?.user?.name;
                const image = row?.original?.user?.image ? row?.original?.user?.image : ""
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Avatar className="">
                            <AvatarImage src={image} alt={name}></AvatarImage>
                            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Dialog>
                            <form>
                                <DialogTrigger asChild>
                                    <span className=" font-medium cursor-pointer">{name}</span>

                                </DialogTrigger>
                                <LeaveDataDetailsModal data={row?.original}></LeaveDataDetailsModal>
                            </form>
                        </Dialog>
                    </div>
                )
            }
        },
        {
            accessorKey: "totalLeave",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Total Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="flex flex-col">
                        <span className=" font-medium">{row?.original?.total_taken}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "casualLeave",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Casual Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return (
                    <div className="flex flex-col">
                        <span className=" font-medium">{row?.original?.casual?.taken}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "sickLeave",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Sick Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="flex flex-col">
                        <span className=" font-medium">{row?.original?.sick?.taken}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "paidLeave",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Paid Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="flex flex-col">
                        <span className=" font-medium">{row?.original?.paid?.taken}</span>
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
                const taken = row?.original?.available || 0;
                const allowed = row?.original?.total_allowed || 1;
                const percentage = Math.min((taken / allowed) * 100, 100);
                const withColor =
                    percentage > 80 ? 'bg-green-500' :
                        percentage > 50 ? 'bg-yellow-500' :
                            'bg-red-500';

                return (
                    <div className="flex items-center gap-2">
                        <div className="bg-[#ececec] dark:bg-gray-700 flex h-4 w-24 rounded-full relative overflow-hidden">
                            <div
                                className={`${withColor} h-full rounded-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {Math.round(percentage)}%
                        </span>
                    </div>
                );
            }
        }
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg dark:text-darkTextPrimary">Leave Data</h2>
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
                            <EmptyTableRow columns={columns} text="No leave data found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default LeaveDataTable;