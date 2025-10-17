"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { ITimeActivity } from "@/global/globalTypes";
import emptyBoxLogo from "../../../assets/projects/emptyBox.svg"
import Image from "next/image";

const TimeAndActivitiesTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const timeActivityList: ITimeActivity[] = useMemo(
        () => [
            {
                image: "https://picsum.photos/200/300",
                name: "Admin",
                project: "Orbit Design Agency",
                duration: "12:30:00",
                activity: 40,
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Admin",
                project: "Orbit Design Agency",
                duration: "05.05.38",
                activity: 75,
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Admin",
                project: "Orbit Design Agency",
                duration: "10.10.00",
                activity: 66,
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Admin",
                project: "Orbit Design Agency",
                duration: "9.09.55",
                activity: 35,
            }
        ],
        []
    );

    const columns: ColumnDef<ITimeActivity>[] = [
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
            accessorKey: "project",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const project = row.getValue("project") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{project}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "duration",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Duration
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const duration = row.getValue("duration") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{duration}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "activity",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Activity
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const activity = row.getValue("activity") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{activity}%</span>
                    </div>
                )
            }
        },
    ];


    const table = useReactTable({
        data: timeActivityList,
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
                <h2 className=" text-md sm:text-lg">Sun, Sep 28, 2025 </h2>
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

export default TimeAndActivitiesTable;