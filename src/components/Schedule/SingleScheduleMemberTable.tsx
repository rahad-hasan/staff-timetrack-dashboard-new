/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCallback, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { User } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "../Common/SearchBar";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import FilterButton from "../Common/FilterButton";
import ConfirmDialog from "../Common/ConfirmDialog";
import DeleteIcon from "../Icons/DeleteIcon";
import { deleteMemberFromSchedule } from "@/actions/schedule/action";
import { toast } from "sonner";

const SingleScheduleMemberTable = ({ id, data }: { id: number | undefined, data: [{ user: User; }] | undefined }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [rowSelection, setRowSelection] = useState({});

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data?.filter((row: { user: User }) => {
            return (
                row.user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [data, searchTerm]);

    const handleDelete = useCallback(async (user: User) => {
        // console.log({ data: { member_id: user?.id }, id: id! });
        setLoading(true);
        try {
            const res = await deleteMemberFromSchedule({ data: { member_id: user?.id }, id: id! });

            if (res?.success) {
                toast.success(res?.message || "Member removed successfully");
            } else {
                toast.error(res?.message || "Failed to remove member", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!", {
                style: {
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none'
                },
            });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns: ColumnDef<{ user: User }>[] = [
        {
            accessorKey: "user.name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const name = row?.original?.user?.name
                const image = row?.original?.user?.image ? row?.original?.user?.image : ""
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Avatar>
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/members/${row?.original?.user?.id}`}>
                            <span className="hover:underline-offset-2 hover:underline">{name}</span>
                        </Link>
                    </div>
                )
            }
        },
        {
            accessorKey: "user.email",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Email
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const email = row?.original?.user?.email
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <span>{email}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "action",
            header: () =>
                <>
                    <div className="">Action</div>
                </>,
            cell: ({ row }) => {
                return (
                    <>
                        <div className="">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div>
                                        <FilterButton></FilterButton>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="center" className=" w-[120px] p-2">
                                    <div className="">
                                        <div className="space-y-2">
                                            <ConfirmDialog
                                                trigger={
                                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                        <DeleteIcon size={18} />
                                                        <p>Remove</p>
                                                    </div>
                                                }
                                                title="Remove the member from schedule"
                                                description="Are you sure you want to remove this member from the schedule? This action cannot be undone."
                                                confirmText="Confirm"
                                                cancelText="Cancel"
                                                // confirmClassName="bg-primary hover:bg-primary"
                                                onConfirm={() => handleDelete(row?.original?.user)}
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </>
                );
            },
        },
    ];

    const table = useReactTable({
        data: filteredData!,
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
            <div className=" mb-5 flex justify-between items-center">
                <h2 className=" text-base sm:text-lg">SCHEDULE MEMBER LIST</h2>
                <SearchBar onSearch={setSearchTerm} />
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header?.id}>
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
                            <EmptyTableRow columns={columns} text="No member found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SingleScheduleMemberTable;