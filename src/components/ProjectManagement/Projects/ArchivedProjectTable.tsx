"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
// import lowFlag from '../../assets/dashboard/lowFlag.svg'
// import mediumFlag from '../../assets/dashboard/mediumFlag.svg'
// import noneFlag from '../../assets/dashboard/noneFlag.svg'
import { Checkbox } from "@/components/ui/checkbox"
import noDataIcon from "../../../assets/no_data_icon.svg"

const ArchivedProjectTable = () => {
    console.log("ArchivedProjectTable");
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);
    interface Project {
        projectName: string;
        date: string;
        image: string;
        manager: string;
        timeWorked: string;
        status: string;
        deadline: string;
    }

    const projectList = useMemo(
        () => [
            {
                projectName: "Do the Logic for Orbit Home page project",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/25",
                manager: "Juyed Ahmed",
                timeWorked: "12:03:00",
                status: "In Progress",
                deadline: "Dec 20, 2025",
            },
            {
                projectName: "Marketing Tools",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/22",
                manager: "Cameron Williamson",
                timeWorked: "12:03:00",
                status: "Pending",
                deadline: "Jan 10, 2026",
            },
            {
                projectName: "Design Idea",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/26",
                manager: "Jenny Wilson",
                timeWorked: "11:03:00",
                status: "In Progress",
                deadline: "Jun 05, 2025",
            },
            {
                projectName: "Do the Logic for Orbit Home page project wi...",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/27",
                manager: "Esther Howard",
                timeWorked: "10:03:00",
                status: "Pending",
                deadline: "Feb 01, 2026",
            }
        ],
        []
    );

    const columns: ColumnDef<Project>[] = [
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
            accessorKey: "projectName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const projectName = row.getValue("projectName") as string;
                const date = row.original.date;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{projectName}</span>
                        <span className="">{date}</span>
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
                                className="rounded-full w-10 -ml-3 border-2 border-white"
                            />
                        ))}
                        <div className="w-10 h-10 -ml-3 rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-semibold text-[#926fef] border-2 border-white">
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
            accessorKey: "deadline",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Deadline
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const deadline = row.getValue("deadline") as string;
                return <div className="">{deadline}</div>;
            },
        }
    ];


    const table = useReactTable({
        data: projectList,
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
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-md sm:text-lg">Projects</h2>
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
                            <TableCell colSpan={columns.length} className=" py-16">
                                <div className=" flex flex-col justify-center items-center">
                                    <Image src={noDataIcon} className=" w-18 md:w-32" alt="No Data" width={200} height={200} />
                                    <h2 className=" text-lg mt-3 font-semibold">No archive projects</h2>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ArchivedProjectTable;