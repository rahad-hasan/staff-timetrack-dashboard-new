/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown, Download, Pencil, Trash2 } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { ITeamMembers } from "@/global/globalTypes";
import { Dialog, DialogTrigger } from "../ui/dialog";
import EditNewMemberModal from "./EditNewMemberModal";
import EmptyTableRow from "../Common/EmptyTableRow";
import FilterButton from "../Common/FilterButton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from "date-fns";

const TeamsMemberTable = ({ data }: any) => {
    console.log('getting from api', data);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    interface ITeamMembers {
        id: number,
        company_id: number,
        name: string,
        email: string,
        role: "admin" | "manager" | "hr" | "project_manager" | "employee",
        phone: string | null,
        image: string | null,
        pay_rate_hourly: number,
        time_zone: string,
        is_active: boolean,
        is_deleted: boolean,
        is_tracking: boolean,
        url_tracking: boolean,
        multi_factor_auth: boolean,
        created_at: string,
        updated_at: string,
    }

    const columns: ColumnDef<ITeamMembers>[] = [
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
                        <Avatar>
                            <AvatarImage src={img || undefined} alt={name} />
                            <AvatarFallback>
                                {name
                                    ?.trim()
                                    .split(" ")
                                    .map(word => word[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "is_active",
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
                const is_active = row.getValue("is_active") as string;
                return (
                    <div className="">
                        {
                            is_active ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2 py-1">Active</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2 py-1">Inactive</button>
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
                        <span className=" text-base">{role}</span>
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
                        <span className=" font-thin">{weeklyLimit}</span>
                        <span className=" font-thin">{dailyLimit}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "created_at",
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
                const created_at = row.getValue("created_at") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{format(new Date(created_at), "EEE, MMM d, yyyy")}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "is_tracking",
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
                const is_tracking = row.getValue("is_tracking") as string;
                return (
                    <div className="">
                        {
                            is_tracking ?
                                <button className=" bg-[#e9f8f0] text-primary border border-primary rounded-lg px-2 py-1">Active</button>
                                :
                                <button className=" bg-[#fee6eb] text-red-500 border border-red-500 rounded-lg px-2 py-1">Inactive</button>
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
                        <PopoverContent side="bottom" align="end" className=" w-[250px] p-2">
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
        data: data,
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