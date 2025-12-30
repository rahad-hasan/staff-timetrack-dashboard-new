"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import teamsLogo from '../../../assets/activity/teams-logo.png'
import Image from "next/image";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { IUrls } from "@/types/type";

const UrlsTable = ({data}: {data:IUrls[]}) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const columns: ColumnDef<IUrls>[] = [

        {
            accessorKey: "url",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[220px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Site name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const url = row.getValue("url") as string;
                // const image = row.original.image;
                return (
                    <div className="flex items-center gap-2">
                        <Image src={teamsLogo} alt="app_logo" width={200} height={200} className=" w-10 border border-borderColor dark:border-darkBorder rounded-full p-1.5" />
                        <div className="">
                            <p className="text-base font-bold text-headingTextColor dark:text-darkTextPrimary">{url}</p>
                            <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">Site</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "projectName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <span className=" font-medium">{row?.original?.project?.name}</span>
                    </div>
                );
            }
        },
        // {
        //     accessorKey: "session",
        //     header: ({ column }) => {
        //         return (
        //             <div>
        //                 <span
        //                     className=" cursor-pointer flex items-center gap-1"
        //                     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //                 >
        //                     Sessions
        //                     <ArrowUpDown className="ml-2 h-4 w-4" />
        //                 </span>
        //             </div>
        //         )
        //     },
        //     cell: ({ row }) => {
        //         const session = row.getValue("session") as string;

        //         return (
        //             <div className="flex items-center gap-2">
        //                 <span className=" bg-[#5db0f1] text-white rounded-2xl px-3 py-0.5">{session}</span>
        //             </div>
        //         );
        //     }
        // },
        {
            accessorKey: "timeSpent",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time spent
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                // const time = row.original.time as string;
                return (
                    <div className=" flex flex-col">
                        <span className=" font-medium text-headingTextColor dark:text-darkTextPrimary">{row?.original?.duration}</span>
                        <span className=" text-sm font-thin text-subTextColor dark:text-darkTextSecondary">nai - nai</span>
                    </div>
                );
            },
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg pb-4.5 rounded-[12px]">

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead className="first:rounded-bl-none last:rounded-br-none" key={header.id}>
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
                            <EmptyTableRow columns={columns} text="No urls activity found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default UrlsTable;