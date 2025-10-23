"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import emptyBoxLogo from "../../../assets/projects/emptyBox.svg"
import Image from "next/image";
import { ILeave } from "@/global/globalTypes";

const LeaveDataTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const leaveList: ILeave[] = useMemo(
        () => [
            {
                image: "https://picsum.photos/200/300",
                name: "Guy Hawkins",
                totalLeave: 14,
                casualLeave: 14,
                sickLeave: 12,
                earnedLeave: 7,
                availableLeave: 50
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Darlene Robertson",
                totalLeave: 14,
                casualLeave: 14,
                sickLeave: 12,
                earnedLeave: 7,
                availableLeave: 10
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Marvin McKinney",
                totalLeave: 14,
                casualLeave: 14,
                sickLeave: 12,
                earnedLeave: 7,
                availableLeave: 70
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Ronald Richards",
                totalLeave: 14,
                casualLeave: 14,
                sickLeave: 12,
                earnedLeave: 7,
                availableLeave: 30
            }
        ],
        []
    );

    const columns: ColumnDef<ILeave>[] = [
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
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Image src={img} alt="profile" width={200} height={200} className="w-8 h-8 object-cover rounded-full" />
                        <span className="">{name}</span>
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
                const totalLeave = row.getValue("totalLeave") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{totalLeave}</span>
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
                const casualLeave = row.getValue("casualLeave") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{casualLeave}</span>
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
                const sickLeave = row.getValue("sickLeave") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{sickLeave}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "earnedLeave",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Earned Leave
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const earnedLeave = row.getValue("earnedLeave") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{earnedLeave}</span>
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
                const availableLeave = row.getValue("availableLeave") as string;
                const widthPercentage = (Number(availableLeave) / 100) * 100;
                const withColor = widthPercentage > 50 ? 'bg-red-500' : widthPercentage > 40 ? 'bg-yellow-500' : 'bg-green-500';
                return (
                    <div className=" ">
                        <div className={`bg-gray-100 flex h-4 w-16 rounded-full relative`}>
                            <p className={`${withColor} flex h-4 rounded-full absolute top-0 left-0`} style={{ width: `${widthPercentage}%` }}></p>
                        </div>
                    </div>
                )
            }
        }
    ];


    const table = useReactTable({
        data: leaveList,
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
                <h2 className=" text-md sm:text-lg">Leave Data</h2>
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

export default LeaveDataTable;