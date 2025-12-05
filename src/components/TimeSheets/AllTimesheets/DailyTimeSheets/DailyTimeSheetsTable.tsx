"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
import CheckIcon from "@/components/Icons/CheckIcon";

const DailyTimeSheetsTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])

    interface DailyData {
        taskName: string,
        project: string,
        activity: number,
        manager: string,
        manual: boolean,
        totalTime: string,
    }

    // table
    const DailyDataList: DailyData[] = useMemo(
        () => [
            {
                taskName: "Do the Logic for Orbit Home page project",
                project: "Orbit Technology's Project",
                activity: 40,
                manager: "Juyed Ahmed",
                manual: true,
                totalTime: "12:03:00",
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                taskName: "Marketing Tools",
                project: "Orbit Technology's Project",
                activity: 5,
                manager: "Cameron Williamson",
                manual: false,
                totalTime: "12:03:00",
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                taskName: "Design Idea",
                project: "Orbit Technology's Project",
                activity: 70,
                manager: "Jenny Wilson",
                manual: true,
                totalTime: "11:03:00",
                startTime: "8:00 am",
                endTime: "10:00 pm"
            },
            {
                taskName: "Do the Logic for Orbit Home page project wi...",
                project: "Orbit Technology's Project",
                activity: 35,
                manager: "Esther Howard",
                manual: false,
                totalTime: "10:03:00",
                startTime: "8:00 am",
                endTime: "10:00 pm"
            }
        ],
        []
    );
    const columns: ColumnDef<DailyData>[] = [
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
                const taskName = row.original.taskName;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-base">{project}</span>
                        <span className=" font-normal">{taskName}</span>
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
                const activity = row.getValue("activity") as number;
                return (
                    <div className="flex items-center gap-2">
                        {
                            activity < 30 ?
                                <span className=" bg-[#f40139] text-white font-normal px-1.5 py-0.5 rounded-full">{activity}%</span>
                                :
                                <span className=" bg-[#5db0f1] text-white font-normal px-1.5 py-0.5 rounded-full">{activity}%</span>
                        }
                    </div>
                );
            }
        },
        {
            accessorKey: "manual",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Manual
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const manual = row.getValue("manual") as string;
                return (
                    <div className="flex items-center gap-2 text-primary">
                        <span>{manual ? <CheckIcon size={22}/> : ''}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "totalTime",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Total time
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const totalTime = row.getValue("totalTime") as string;
                return (
                    <div className=" flex items-center justify-between">
                        <div className=" flex justify-between gap-4">
                            <div className="">
                                <h1 className=" font-medium">
                                    {totalTime}
                                </h1>
                                <p className=" text-sm font-thin">8:00 am - 10:00 pm</p>
                            </div>
                        </div>
                        <FilterButton />
                    </div>
                );
            },
        }
    ];

    const table = useReactTable({
        data: DailyDataList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="border border-borderColor dark:border-darkBorder  dark:bg-darkPrimaryBg pb-4.5 rounded-[12px] overflow-hidden">
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
                            <EmptyTableRow columns={columns} text="No Project found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default DailyTimeSheetsTable;