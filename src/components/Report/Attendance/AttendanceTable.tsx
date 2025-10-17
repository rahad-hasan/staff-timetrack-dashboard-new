"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"
import { IAttendance } from "@/global/globalTypes";
import emptyBoxLogo from "../../../assets/projects/emptyBox.svg"
import Image from "next/image";

const AttendanceTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const attendanceList: IAttendance[] = useMemo(
        () => [
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                date: "Feb 18, 2025",
                status: "Active",
                appVersion: "12.07.02",
                checkIn: "11:00 AM",
                checkOut: "8:00 PM"
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                date: "Feb 18, 2025",
                status: "Inactive",
                appVersion: "12.07.05",
                checkIn: "10:00 AM",
                checkOut: "7:00 PM"
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                date: "Feb 18, 2025",
                status: "Inactive",
                appVersion: "12.07.01",
                checkIn: "8:00 AM",
                checkOut: "6:00 PM"
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                date: "Feb 18, 2025",
                status: "Active",
                appVersion: "11.09.05",
                checkIn: "12:00 PM",
                checkOut: "10:00 PM"
            }
        ],
        []
    );

    const columns: ColumnDef<IAttendance>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className=" cursor-pointer"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className=" cursor-pointer"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
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
            accessorKey: "date",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const date = row.getValue("date") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{date}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Status
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className="">
                        {
                            status === "Active" ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2">Active</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2">Inactive</button>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "appVersion",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            App Version
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const appVersion = row.getValue("appVersion") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{appVersion}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "checkIn",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Check In
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const checkIn = row.getValue("checkIn") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{checkIn}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "checkOut",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Check Out
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const checkOut = row.getValue("checkOut") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{checkOut}</span>
                    </div>
                )
            }
        },
    ];


    const table = useReactTable({
        data: attendanceList,
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
                <h2 className=" text-md sm:text-lg">Attendance</h2>
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

export default AttendanceTable;