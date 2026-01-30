/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { IAttendance } from "@/global/globalTypes";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTZTime } from "@/utils";

// const AttendanceTable = ({ attendanceListData, searchTerm }: any) => {
const AttendanceTable = ({ attendanceListData }: any) => {
    // console.log('getting search params', searchTerm);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    // const filteredData = useMemo(() => {
    //     if (!searchTerm) return attendanceListData;

    //     return attendanceListData.filter((row: IAttendance) => {
    //         return (
    //             row.name.toLowerCase().includes(searchTerm.toLowerCase())
    //         );
    //     });
    // }, [attendanceListData, searchTerm]);

    const columns: ColumnDef<IAttendance>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div >
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
                const img = row?.original?.image;
                return (
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Avatar className="rounded-full w-8 h-8">
                            <AvatarImage
                                src={img ? img : ""}
                                alt={name}
                            />
                            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        // {
        //     accessorKey: "date",
        //     header: ({ column }) => {
        //         return (
        //             <div>
        //                 <span
        //                     className=" cursor-pointer flex items-center gap-1"
        //                     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //                 >
        //                     Date
        //                     <ArrowUpDown className="ml-2 h-4 w-4" />
        //                 </span>
        //             </div>
        //         )
        //     },
        //     cell: ({ row }) => {
        //         const date = row.getValue("date") as string;
        //         return (
        //             <div className="flex flex-col">
        //                 <span className="">{date}</span>
        //             </div>
        //         )
        //     }
        // },
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
                const status = row?.original?.is_online;
                return (
                    <div className="">
                        {
                            status ?
                                <button className="text-primary rounded-lg py-1">Online</button>
                                :
                                <button className=" text-subTextColor  rounded-lg py-1">-</button>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "app_version",
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
                const appVersion = row.getValue("app_version") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{appVersion}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "check_in",
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
                const checkIn = row.getValue("check_in") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{checkIn !== "-" ? formatTZTime(checkIn) : "-"}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "check_out",
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
                const checkOut = row?.getValue("check_out") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{checkOut !== "-" ? formatTZTime(checkOut) : "-"}</span>
                    </div>
                )
            }
        },
    ];


    const table = useReactTable({
        data: attendanceListData ?? [],
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
                <h2 className=" text-base sm:text-lg dark:text-darkTextPrimary">Attendance</h2>
            </div>
            <Table>
                <TableHeader>
                    {table?.getHeaderGroups().map(headerGroup => (
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
                    {table?.getRowModel().rows?.length ? (
                        table?.getRowModel().rows.map(row => (
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
                            <EmptyTableRow columns={columns} text="No attendance found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default AttendanceTable;