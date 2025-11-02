"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Check, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import EditManualTimeModal from "./EditManualTimeModal";

const ManualRequestsTable = () => {
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
                manual: true,
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
                manual: true,
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
                        <span className="font-medium">{project}</span>
                        <span className="">{taskName}</span>
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
                                <span className=" bg-[#f40139] text-white font-semibold px-2 rounded-full">{activity} %</span>
                                :
                                <span className=" bg-[#5db0f1] text-white font-semibold px-2 rounded-full">{activity} %</span>
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
                    <div className="flex items-center gap-2">
                        <span>{manual ? <Check className=" text-primary border-2 border-primary rounded-full p-0.5" /> : ''}</span>
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
                    <div className=" flex justify-between gap-4">
                        <div className="">
                            <h1 className=" font-semibold">
                                {totalTime}
                            </h1>
                            <p>8:00 am - 10:00 pm</p>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                            </PopoverTrigger>
                            <PopoverContent side="bottom" align="end" className=" w-[250px] px-2">
                                <div className="">
                                    <div className="space-y-2">
                                        <Dialog>
                                            <form>
                                                <DialogTrigger asChild>
                                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                        <Pencil size={18} />
                                                        <p>Edit Time</p>
                                                    </div>
                                                </DialogTrigger>
                                                <EditManualTimeModal></EditManualTimeModal>
                                            </form>
                                        </Dialog>

                                        <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                            <Trash2 size={18} />
                                            <p>Delete Time</p>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
        <div className="border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px]">
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

export default ManualRequestsTable;