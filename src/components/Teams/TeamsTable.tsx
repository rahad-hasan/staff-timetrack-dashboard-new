"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowUpDown, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import EditTeamModal from "./EditTeamModal";

const TeamsTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    interface ITeam {
        teamName: string;
        date: string;
        image: string;
        project: string;
        status: string;
    }

    const taskList: ITeam[] = useMemo(
        () => [
            {
                teamName: "Software Development Team",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/25",
                project: "Time tracker",
                status: "In Progress"
            },
            {
                teamName: "Marketing Team",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/22",
                project: "House price prediction",
                status: "Pending"
            },
            {
                teamName: "UI UX Design Team",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/26",
                project: "Spam detection",
                status: "In Progress"
            },
            {
                teamName: "SEO Team ",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/27",
                project: "Time tracker",
                status: "Pending"
            }
        ],
        []
    );

    const columns: ColumnDef<ITeam>[] = [
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
            accessorKey: "teamName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Team Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const teamName = row.getValue("teamName") as string;

                return (
                    <div className="">
                        <span className="font-medium">{teamName}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "image",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[120px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Members
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
            accessorKey: "project",
            header: ({ column }) => {
                return (
                    <div className=" min-w-[190px]">
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
                return (
                    <div className="">
                        <span>{project}</span>
                    </div>
                );
            }
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
                                                    <p>Edit Team</p>
                                                </div>
                                            </DialogTrigger>
                                            <EditTeamModal></EditTeamModal>
                                        </form>
                                    </Dialog>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Trash2 size={18} />
                                        <p>Delete Team</p>
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
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg">Teams</h2>
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

export default TeamsTable; 