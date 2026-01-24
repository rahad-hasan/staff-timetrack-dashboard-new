"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { Task } from "@/types/type";
import { Button } from "@/components/ui/button";

const SingleProjectTask = ({ data }: { data: Task[] }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})


    const getStatusStyles = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "processing":
                return {
                    button: "bg-[#fff5db] border-[#efaf07] text-[#efaf07] hover:bg-[#fff5db] dark:bg-transparent",
                    dot: "bg-[#efaf07]"
                };
            case "cancelled":
                return {
                    button: "bg-[#fee6eb] border-[#f40139] text-[#f40139] hover:bg-[#fee6eb] dark:bg-transparent",
                    dot: "bg-[#f40139]"
                };
            case "pending":
                return {
                    button: "bg-[#eff7fe] border-[#5db0f1] text-[#5db0f1] hover:bg-[#eff7fe] dark:bg-transparent",
                    dot: "bg-[#5db0f1]"
                };
            default: // completed or others
                return {
                    button: "bg-[#e9f8f0] border-[#26bd6c] text-[#26bd6c] hover:bg-[#e9f8f0] dark:bg-transparent",
                    dot: "bg-[#26bd6c]"
                };
        }
    };


    const columns: ColumnDef<Task>[] = [
        {
            accessorKey: "name",
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
                const name = row?.original?.name

                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <span>{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "description",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Description
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const description = row?.original?.description
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <span>{description ? description : "No description available"}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <span
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </span>
            ),
            cell: ({ row }) => {
                const status = row.original.status;
                const styles = getStatusStyles(status);

                return (
                    <Button
                        className={`text-sm border flex items-center gap-2 px-3 h-8 shadow-none cursor-default ${styles.button} capitalize`}
                    >
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                        {status || "N/A"}
                    </Button>
                );
            },
        }
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg">PROJECT TASK LIST</h2>
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
                            <EmptyTableRow columns={columns} text="No task found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SingleProjectTask;