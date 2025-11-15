"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ArrowUpDown, ChevronDown, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import lowFlag from '../../../assets/dashboard/lowFlag.svg'
import mediumFlag from '../../../assets/dashboard/mediumFlag.svg'
import noneFlag from '../../../assets/dashboard/noneFlag.svg'
// import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import EditTaskModal from "./EditTaskModal";

const TaskTable = () => {
    console.log("TaskTable");
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);
    interface Task {
        taskName: string;
        project: string;
        image: string;
        assignee: string;
        timeWorked: string;
        priority: string;
        status: string;
    }

    const taskList = useMemo(
        () => [
            {
                taskName: "Do the Logic for Orbit Home page project",
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/25",
                assignee: "Juyed Ahmed",
                timeWorked: "12:03:00",
                priority: "Low",
                status: "In Progress"
            },
            {
                taskName: "Marketing Tools",
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/22",
                assignee: "Cameron Williamson",
                timeWorked: "12:03:00",
                priority: "Medium",
                status: "Pending"
            },
            {
                taskName: "Design Idea",
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/26",
                assignee: "Jenny Wilson",
                timeWorked: "11:03:00",
                priority: "None",
                status: "In Progress"
            },
            {
                taskName: "Do the Logic for Orbit Home page project wi...",
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/27",
                assignee: "Esther Howard",
                timeWorked: "10:03:00",
                priority: "Medium",
                status: "Pending"
            }
        ],
        []
    );

    const columns: ColumnDef<Task>[] = [
        // {
        //     id: "select",
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={
        //                 table.getIsAllPageRowsSelected() ||
        //                 (table.getIsSomePageRowsSelected() && "indeterminate")
        //             }
        //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //             aria-label="Select all"
        //             className=" cursor-pointer"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value) => row.toggleSelected(!!value)}
        //             aria-label="Select row"
        //             className=" cursor-pointer"
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        {
            accessorKey: "taskName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Task Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const task = row.getValue("taskName") as string;
                const project = row.original.project;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{task}</span>
                        <span className="">{project}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "assignee",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Assignee
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const assignee = row.getValue("assignee") as string;
                const image = row.original.image;
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Image
                            src={image}
                            width={40}
                            height={40}
                            alt={assignee}
                            className="rounded-full w-10"
                        />
                        <span>{assignee}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "timeWorked",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time Worked
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const timeWorked = row.getValue("timeWorked") as string;
                return <div className="">{timeWorked}</div>;
            },
        },
        {
            accessorKey: "priority",
            // header: "Priority",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Priority
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const priority = row.getValue("priority") as string;
                const flagImage = priority === "Low" ? lowFlag : priority === "Medium" ? mediumFlag : noneFlag;
                return (
                    <div className="flex items-center gap-2">
                        <Image src={flagImage} width={100} height={100} alt="flag" className="w-4" />
                        <span>{priority}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            // header: "Status",
            // header: () => <div className=" text-right">Status</div>,
            header: ({ column }) => {
                return (
                    <div className=" flex justify-end">
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

                const statusClass =
                    status === "In Progress"
                        ? "bg-blue-100 dark:bg-darkPrimaryBg text-blue-800 dark:text-darkTextPrimary"
                        : "bg-gray-100 dark:bg-darkPrimaryBg text-gray-800 dark:text-darkTextPrimary";

                const handleStatusChange = (newStatus: string) => {
                    console.log(newStatus);
                };

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-1.5 rounded-full text-sm font-medium ${statusClass}`}
                                >
                                    <span className={` w-2 h-2 rounded-full ${status === "In Progress" ? "bg-blue-300 dark:bg-gray-300 " : "bg-gray-300"}`}></span>
                                    {status}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("In Progress")}>
                                    In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("Pending")}>
                                    Pending
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
        {
            accessorKey: "action",
            header: () => <div className="">Action</div>,
            cell: () => {
                return <div className="">
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
                                                    <p>Edit Client</p>
                                                </div>
                                            </DialogTrigger>
                                            <EditTaskModal></EditTaskModal>
                                        </form>
                                    </Dialog>

                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Trash2 size={18} />
                                        <p>Delete Client</p>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>;
            },
        },
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
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg">TASK LIST</h2>
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
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default TaskTable;