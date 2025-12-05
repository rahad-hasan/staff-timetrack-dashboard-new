"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown, Download, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "../ui/button";
import { ITeamMembers } from "@/global/globalTypes";
import { Dialog, DialogTrigger } from "../ui/dialog";
import EditNewMemberModal from "./EditNewMemberModal";
import EmptyTableRow from "../Common/EmptyTableRow";
import FilterButton from "../Common/FilterButton";

const TeamsMemberTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const attendanceList: ITeamMembers[] = useMemo(
        () => [
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                memberSince: "Feb 18, 2025",
                status: "Active",
                role: "Front End Developer",
                project: 2,
                weeklyLimit: "No weekly limit",
                tracking: true,
                dailyLimit: "No daily limit",
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                memberSince: "Feb 18, 2025",
                status: "Inactive",
                role: "Back End Developer",
                project: 2,
                weeklyLimit: "No weekly limit",
                tracking: true,
                dailyLimit: "No daily limit",
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                memberSince: "Feb 18, 2025",
                status: "Inactive",
                role: "Front End Developer",
                project: 2,
                weeklyLimit: "No weekly limit",
                tracking: false,
                dailyLimit: "No daily limit",
            },
            {
                image: "https://picsum.photos/200/300",
                name: "Orbit Design Agency",
                memberSince: "Feb 18, 2025",
                status: "Active",
                role: "Full Stack Developer",
                project: 2,
                weeklyLimit: "No weekly limit",
                tracking: true,
                dailyLimit: "No daily limit",
            }
        ],
        []
    );

    const columns: ColumnDef<ITeamMembers>[] = [
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
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Member name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                const img = row.original.image;
                return (
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Image src={img} alt="profile" width={200} height={200} className="w-8 h-8 object-cover rounded-full" />
                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <div>
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
                return (
                    <div className="">
                        {
                            status === "Active" ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2">Active</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2">Inactive</button>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "role",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Role
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const role = row.getValue("role") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{role}</span>
                    </div>
                )
            }
        },

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
                return (
                    <div className="flex flex-col">
                        <span className=" text-primary font-medium">{project}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "weeklyLimit",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Limit
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const weeklyLimit = row.getValue("weeklyLimit") as string;
                const dailyLimit = row.original.dailyLimit
                return (
                    <div className="flex flex-col">
                        <span className="">{weeklyLimit}</span>
                        <span className="">{dailyLimit}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "memberSince",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Member since
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const memberSince = row.getValue("memberSince") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{memberSince}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "tracking",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time Tracking
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const tracking = row.getValue("tracking") as string;
                return (
                    <div className="">
                        {
                            tracking ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2">Active</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2">Inactive</button>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "action",
            header: () => <div className="">Action</div>,
            cell: () => {
                return <div className="">
                    <Popover>
                        <PopoverTrigger asChild>
                            <div>
                                <FilterButton></FilterButton>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" className=" w-[250px] px-2">
                            <div className="">
                                <div className="space-y-2">
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Download size={18} />
                                        <p>Export Report</p>
                                    </div>
                                    <Dialog>
                                        <form>
                                            <DialogTrigger asChild>
                                                <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                    <Pencil size={18} />
                                                    <p>Edit Team</p>
                                                </div>
                                            </DialogTrigger>
                                            <EditNewMemberModal></EditNewMemberModal>
                                        </form>
                                    </Dialog>

                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
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
        data: attendanceList,
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg  p-4 2xl:p-5 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Members</h2>
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
                            <EmptyTableRow columns={columns} text="No members found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default TeamsMemberTable;