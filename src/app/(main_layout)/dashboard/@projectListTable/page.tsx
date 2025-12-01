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

import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
// import lowFlag from '../../assets/dashboard/lowFlag.svg'
// import mediumFlag from '../../assets/dashboard/mediumFlag.svg'
// import noneFlag from '../../assets/dashboard/noneFlag.svg'
// import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FilterButton from "@/components/Common/FilterButton";

const ProjectListTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);
    interface Task {
        taskName: string;
        date: string;
        image: string;
        manager: string;
        timeWorked: string;
        status: string;
    }

    const taskList = useMemo(
        () => [
            {
                taskName: "Do the Logic for Orbit Home page project",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/25",
                manager: "Juyed Ahmed",
                timeWorked: "12:03:00",
                status: "In Progress"
            },
            {
                taskName: "Marketing Tools",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/22",
                manager: "Cameron Williamson",
                timeWorked: "12:03:00",
                status: "Pending"
            },
            {
                taskName: "Design Idea",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/26",
                manager: "Jenny Wilson",
                timeWorked: "11:03:00",
                status: "In Progress"
            },
            {
                taskName: "Do the Logic for Orbit Home page project wi...",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/27",
                manager: "Esther Howard",
                timeWorked: "10:03:00",
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
                const date = row.original.date;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-headingTextColor dark:text-darkTextPrimary">{task}</span>
                        <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">{date}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "manager",
            header: ({ column }) => {
                return (
                    <div className=" min-w-[190px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Manager
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const manager = row.getValue("manager") as string;
                const image = row.original.image;
                return (
                    <div className="flex items-center gap-2">
                        <Image
                            src={image}
                            width={40}
                            height={40}
                            alt={manager}
                            className="rounded-full w-10"
                        />
                        <span>{manager}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "assignee",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[120px]">
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
                const image = row.original.image;
                return (
                    <div className="flex items-center">
                        {[image, image, image].map((imgSrc, index) => (
                            <Image
                                key={index}
                                src={imgSrc}
                                width={40}
                                height={40}
                                alt={`Assignee ${index + 1}`}
                                className="rounded-full w-10 -ml-3 border border-white"
                            />
                        ))}
                        <div className="w-10 h-10 -ml-3 rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-medium text-[#926fef] border border-white">
                            10+
                        </div>
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
                        ? "bg-[#fff5db] border border-[#efaf07] text-[#efaf07] hover:text-[#efaf07]"
                        :
                        status === "Pending" ?
                            "bg-[#fee6eb] border border-[#fcc2cf] text-[#f40139] hover:text-[#f40139]"
                            :
                            status === "To do" ?
                                "bg-[#eff7fe] border border-[#cde7fb] text-[#5db0f1] hover:text-[#5db0f1]"
                                :
                                "bg-[#e9f8f0] border border-[#bcebd1] text-[#26bd6c] hover:text-[#26bd6c]";

                const handleStatusChange = (newStatus: string) => {
                    console.log(newStatus);
                };

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-2 rounded-xl text-sm font-medium ${statusClass}`}
                                >
                                    <span className={` w-2 h-2 rounded-full ${status === "In Progress" ? "bg-[#efaf07]" : status === "Pending" ? "bg-[#f40139]" : status === "To do" ? "bg-[#5db0f1]" : "bg-[#26bd6c]"}`}></span>
                                    {status}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className=" space-y-2 w-[200px] p-2 rounded-lg">
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#fff5db] border border-[#efaf07] text-[#efaf07] focus:text-[#efaf07] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    onClick={() => handleStatusChange("In Progress")}
                                >
                                    {
                                        status === "In Progress" && <Check className=" bg-[#efaf07] text-white rounded-full p-0.5" />
                                    }
                                    In Progress
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#fee6eb] border border-[#fcc2cf] text-[#f40139] focus:text-[#f40139] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    onClick={() => handleStatusChange("Pending")}
                                >
                                    {
                                        status === "Pending" && <Check className=" bg-[#f40139] text-white rounded-full p-0.5" />
                                    }
                                    Pending
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#eff7fe] border border-[#cde7fb] text-[#5db0f1] focus:text-[#5db0f1] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    onClick={() => handleStatusChange("To do")}
                                >
                                    {
                                        status === "To do" && <Check className=" bg-[#5db0f1] text-white rounded-full p-0.5" />
                                    }
                                    To do
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#e9f8f0] border border-[#bcebd1] text-[#26bd6c] focus:text-[#26bd6c] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    onClick={() => handleStatusChange("Done")}
                                >
                                    {
                                        status === "Done" && <Check className=" bg-[#26bd6c] text-white rounded-full p-0.5" />
                                    }
                                    Done
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" flex justify-between items-center mb-5">
                <h2 className=" text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Project list</h2>
                <div className=" flex items-center gap-3">
                    <FilterButton />
                    <Link href={`/project-management/projects`}>
                        <Button className="py-[14px] px-[16px] sm:py-[18px] sm:px-[20px] rounded-[8px]" size={'sm'}>All Project</Button>
                    </Link>
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

export default ProjectListTable; 