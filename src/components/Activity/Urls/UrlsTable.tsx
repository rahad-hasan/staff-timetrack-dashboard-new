"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import teamsLogo from '../../../assets/activity/teams-logo.png'
import Image from "next/image";

const UrlsTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);
    interface Activity {
        url: string;
        projectName: string;
        session: number;
        timeSpent: string;
        time: string;
        isBlock: boolean;
    }

    const taskList: Activity[] = useMemo(
        () => [
            {
                url: "https://ui.shadcn.com",
                projectName: "Staff Time Tracker – Desktop",
                session: 50,
                timeSpent: "01:15:22",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            },
            {
                url: "https://lucide.dev",
                projectName: "Staff Time Tracker – Admin",
                session: 47,
                timeSpent: "00:35:10",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            },
            {
                url: "https://www.figma.com",
                projectName: "API v2 – Reports",
                session: 69,
                timeSpent: "00:34:29",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            },
            {
                url: "http://localhost:3000",
                projectName: "DevOps – PM2/Redis",
                session: 75,
                timeSpent: "00:45:03",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            },
            {
                url: "https://chatgpt.com",
                projectName: "DB – TimeEntries cleanup",
                session: 23,
                timeSpent: "00:45:18",
                time: "8:00 AM - 11:00 AM",
                isBlock: true,
            },
            {
                url: "https://www.npmjs.com",
                projectName: "Dashboard UI Polish",
                session: 35,
                timeSpent: "00:40:02",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            },
            {
                url: "https://gemini.google.com",
                projectName: "Team Sync",
                session: 59,
                timeSpent: "00:20:31",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
            }
        ],
        []
    );

    const columns: ColumnDef<Activity>[] = [

        {
            accessorKey: "url",
            header: ({ column }) => {
                return (
                    <div  className="  min-w-[220px]">
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
                        <Image src={teamsLogo} alt="app_logo" width={200} height={200} className=" w-8 border border-borderColor rounded-full p-1" />
                        <div className="">
                            <p className=" font-semibold">{url}</p>
                            <span className="">Site</span>
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
                const projectName = row.getValue("projectName") as string;

                return (
                    <div className="flex items-center gap-2">
                        <span className=" font-semibold">{projectName}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "session",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Sessions
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const session = row.getValue("session") as string;

                return (
                    <div className="flex items-center gap-2">
                        <span className=" bg-[#5db0f1] text-white rounded-2xl px-3 py-0.5">{session}</span>
                    </div>
                );
            }
        },
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
                const timeSpent = row.getValue("timeSpent") as string;
                const time = row.original.time as string;
                return (
                    <div className=" flex flex-col">
                        <span className=" font-semibold">{timeSpent}</span>
                        <span className=" text-textGray dark:text-darkTextSecondary">{time}</span>
                    </div>
                );
            },
        }
    ];

    const table = useReactTable({
        data: taskList,
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
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder rounded-[12px]">

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
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default UrlsTable;