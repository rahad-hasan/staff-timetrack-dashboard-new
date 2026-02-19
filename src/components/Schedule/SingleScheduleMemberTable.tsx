"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { User } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "../Common/SearchBar";
import Link from "next/link";

const SingleScheduleMemberTable = ({ data }: { data: [{ user: User; }] | undefined }) => {
    console.log(data);
    const [sorting, setSorting] = useState<SortingState>([])
    const [searchTerm, setSearchTerm] = useState("");
    const [rowSelection, setRowSelection] = useState({})

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data?.filter((row: { user: User }) => {
            return (
                row.user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [data, searchTerm]);

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
            accessorKey: "email",
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