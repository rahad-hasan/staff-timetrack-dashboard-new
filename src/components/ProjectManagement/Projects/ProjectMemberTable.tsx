"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpDown, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ProjectMemberTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    interface IMember {
        project: string,
        image: string,
        memberName: string,
        role: string,
        memberSince: string,
        weeklyLimit: string,
        dailyLimit: string,
        timeTracking: boolean,
        status: string
    }

    const memberList = useMemo(
        () => [
            {
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/25",
                memberName: "Juyed Ahmed",
                role: "Front End Developer",
                memberSince: "Jul 18, 2025",
                weeklyLimit: "No weekly limit",
                dailyLimit: "No daily limit",
                timeTracking: true,
                status: "Inactive"
            },
            {
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/22",
                memberName: "Cameron Williamson",
                role: "Full Stack Developer",
                memberSince: "Jun 28, 2024",
                weeklyLimit: "No weekly limit",
                dailyLimit: "No daily limit",
                timeTracking: false,
                status: "Active"
            },
            {
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/26",
                memberName: "Jenny Wilson",
                role: "Manager",
                memberSince: "Aug 08, 2021",
                weeklyLimit: "No weekly limit",
                dailyLimit: "No daily limit",
                timeTracking: true,
                status: "Inactive"
            },
            {
                project: "Orbit Technology's project",
                image: "https://avatar.iran.liara.run/public/27",
                memberName: "Esther Howard",
                role: "UI/UX Designer",
                memberSince: "Jan 06, 2023",
                weeklyLimit: "No weekly limit",
                dailyLimit: "No daily limit",
                timeTracking: true,
                status: "Invited"
            }
        ],
        []
    );

    const columns: ColumnDef<IMember>[] = [
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
            accessorKey: "memberName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Member
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const memberName = row.getValue("memberName") as string;
                const image = row.original.image;
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Image
                            src={image}
                            width={40}
                            height={40}
                            alt={memberName}
                            className="rounded-full w-10"
                        />
                        <span>{memberName}</span>
                    </div>
                );
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
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2">{status}</button>
                                :
                                status === "Inactive" ?
                                    <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2">{status}</button>
                                    :
                                    <button className=" bg-[#fff5db] text-yellow-600 border border-yellow-600 rounded-lg px-2">{status}</button>
                        }
                    </div>
                )
            }
        },
        {
            accessorKey: "role",
            // header: () => <div className="">Time Worked</div>,
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
                return <div className="">{role}</div>;
            },
        },
        {
            accessorKey: "limit",
            // header: () => <div className="">Time Worked</div>,
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
                const weeklyLimit = row.original.weeklyLimit
                const dailyLimit = row.original.dailyLimit
                return <div className="">
                    <p>{weeklyLimit}</p>
                    <p>{dailyLimit}</p>
                </div>;
            },
        },
        {
            accessorKey: "memberSince",
            // header: () => <div className="">Time Worked</div>,
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
                const memberSince = row.original.memberSince
                return <div className="">
                    <p>{memberSince}</p>
                </div>;
            },
        },
        {
            accessorKey: "timeTracking",
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
                const timeTracking = row.getValue("timeTracking") as string;
                return (
                    <div className="">
                        {
                            timeTracking ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2">Enable</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2">Not Enable</button>
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
                            <Button className=" dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" className=" w-[250px] px-2">
                            <div className="">
                                <div className="space-y-2">
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkSecondaryBg px-3 cursor-pointer">
                                        <Pencil size={18} />
                                        <p>Edit User</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkSecondaryBg px-3 cursor-pointer">
                                        <Trash2 size={18} />
                                        <p>Remove User</p>
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
        data: memberList,
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
                <h2 className=" text-md sm:text-lg">TASK LIST</h2>
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

export default ProjectMemberTable;