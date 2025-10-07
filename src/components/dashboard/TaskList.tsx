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
import { Button } from "../ui/button";
import { ArrowUpDown, EllipsisVertical } from "lucide-react";

const TaskList = () => {

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
        {
            accessorKey: "taskName",
            header: "Task Name",
            cell: ({ row }) => {
                const task = row.getValue("taskName") as string;
                const project = row.original.project;
                console.log(row);
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
            header: "Assignee",
            cell: ({ row }) => {
                const assignee = row.getValue("assignee") as string;
                const image = row.original.image;
                return (
                    <div className="flex items-center gap-2">
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
                    <div
                    >
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
            header: "Priority",
            cell: ({ row }) => {
                const project = row.getValue("priority") as string;
                return <span>{project}</span>;
            }
        },
        {
            accessorKey: "status",
            // header: "Status",
            header: () => <div className=" text-right">Status</div>,
            cell: ({ row, table }) => {
                const status = row.getValue("status") as string;

                const statusClass =
                    status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800";

                const handleStatusChange = (newStatus: string) => {
                    console.log(newStatus);
                };

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-1 rounded-full text-sm font-medium ${statusClass}`}
                                >
                                    {status}
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
        }
    ];
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data: taskList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),

        state: {
            sorting,
        },
    });

    return (
        <div className="mt-5 border-2 border-borderColor p-3 rounded-[12px]">
            <div className=" flex justify-between items-center mb-5">
                <h2 className=" text-lg">TASK LIST</h2>
                <div className=" flex items-center gap-3">
                    <Button variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                    <Button size={'sm'}>All Task</Button>
                </div>
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

export default TaskList;