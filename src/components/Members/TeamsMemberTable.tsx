/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Activity, ArrowUpDown, } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog } from "../ui/dialog";
import EditNewMemberModal from "./EditNewMemberModal";
import EmptyTableRow from "../Common/EmptyTableRow";
import FilterButton from "../Common/FilterButton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from "date-fns";
import DownloadIcon from "../Icons/DownloadIcon";
import EditIcon from "../Icons/FilterOptionIcon/EditIcon";
import DeleteIcon from "../Icons/DeleteIcon";
import { ITeamMembers } from "@/global/globalTypes";
import { toast } from "sonner";
import { deleteMember } from "@/actions/members/membersAction";

const TeamsMemberTable = ({ data }: any) => {

    const [loading, setLoading] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const [open, setOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<ITeamMembers | null>(null)
    console.log('selected user', selectedUser);


    async function handleDelete(info: ITeamMembers) {
        console.log('info', info);
        setLoading(true);
        try {
            const res = await deleteMember({ data: { is_deleted: info?.is_deleted ? false : true }, id: info?.id });
            console.log("success:", res);

            if (res?.success) {
                toast.success(res?.message || "Member deleted successfully");
            } else {
                toast.error(res?.message || "Failed to delete member");
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
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
                        <span className=" text-base capitalize">{role}</span>
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
            cell: (row) => {
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
                                    <div
                                        className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <DownloadIcon size={18} />
                                        <p>Export Report</p>
                                    </div>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedUser(row?.row?.original);
                                            setOpen(true);
                                        }}
                                        className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer"
                                    >
                                        <EditIcon size={20} />
                                        <p>Edit Time</p>
                                    </div>
                                    <button
                                        disabled={loading}
                                        onClick={() => handleDelete(row?.row?.original)}
                                        className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        {<DeleteIcon size={18} />}

                                        <p>{"Delete Member"}</p>
                                    </button>
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
            {/* modal here */}
            <Dialog open={open} onOpenChange={setOpen}>
                {selectedUser && (
                    <EditNewMemberModal
                        selectedUser={selectedUser}
                        onClose={() => setOpen(false)}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default TeamsMemberTable;