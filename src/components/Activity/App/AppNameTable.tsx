"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import teamsLogo from '../../../assets/activity/teams-logo.png'
import Image from "next/image";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import BlockAppModal from "./BlockAppModal";
import EmptyTableRow from "@/components/Common/EmptyTableRow";

const AppNameTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);
    interface Task {
        appName: string;
        projectName: string;
        session: number;
        timeSpent: string;
        time: string;
        isBlock: boolean;
        startTime: string;
        endTime: string;
    }

    const taskList: Task[] = useMemo(
        () => [
            {
                appName: "VS Code",
                projectName: "Staff Time Tracker – Desktop",
                session: 50,
                timeSpent: "01:15:22",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"

            },
            {
                appName: "Google Chrome",
                projectName: "Staff Time Tracker – Admin",
                session: 47,
                timeSpent: "00:35:10",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                appName: "Postman",
                projectName: "API v2 – Reports",
                session: 69,
                timeSpent: "00:34:29",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                appName: "Terminal",
                projectName: "DevOps – PM2/Redis",
                session: 75,
                timeSpent: "00:45:03",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                appName: "Facebook",
                projectName: "DB – TimeEntries cleanup",
                session: 23,
                timeSpent: "00:45:18",
                time: "8:00 AM - 11:00 AM",
                isBlock: true,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                appName: "Figma",
                projectName: "Dashboard UI Polish",
                session: 35,
                timeSpent: "00:40:02",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                appName: "Slack",
                projectName: "Team Sync",
                session: 59,
                timeSpent: "00:20:31",
                time: "8:00 AM - 11:00 AM",
                isBlock: false,
                startTime: "8:00 am",
                endTime: "10:00 pm"
            }
        ],
        []
    );

    const columns: ColumnDef<Task>[] = [

        {
            accessorKey: "appName",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[160px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            App name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const appName = row.getValue("appName") as string;
                // const image = row.original.image;
                return (
                    <div className="flex items-center gap-2">
                        <Image src={teamsLogo} alt="app_logo" width={200} height={200} className=" w-8 border border-borderColor rounded-full p-1" />
                        <div className="">
                            <p className=" font-semibold">{appName}</p>
                            <span className="">App</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "projectName",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[180px]">
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
                    <div className="  min-w-[250px]">
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
                const isBlock = row.original.isBlock as boolean;
                return (
                    <div className=" flex items-center justify-between">
                        <div className=" flex flex-col">
                            <span className=" font-semibold">{timeSpent}</span>
                            <span className=" text-textGray dark:text-darkTextSecondary">{time}</span>
                        </div>
                        <div className="flex justify-end">

                            {
                                isBlock ?
                                    <button
                                        className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 bg-[#fee6eb]  text-red-400  border border-red-400"
                                `}
                                    >
                                        Unblock
                                    </button>
                                    :
                                    <Dialog>
                                        <form>
                                            <DialogTrigger asChild>
                                                <button
                                                    className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:text-darkTextSecondary dark:border-darkBorder border border-borderColor"
                                                `}
                                                >
                                                    Block App
                                                </button>
                                            </DialogTrigger>
                                            <BlockAppModal></BlockAppModal>
                                        </form>
                                    </Dialog>
                            }
                        </div>
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg rounded-[12px]">

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
                            <EmptyTableRow columns={columns} text="No App Activity found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default AppNameTable;