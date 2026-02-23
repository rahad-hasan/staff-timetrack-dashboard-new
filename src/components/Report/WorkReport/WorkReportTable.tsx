"use client"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";

type IDaysReport = {
    date: string;
    check_in: string;
    check_out: string;
    check_in_local: string;
    check_out_local: string;
    late_minutes: number;
    early_minutes: number;
    late_hm: string;
    early_hm: string;
    worked_duration: string;
}

const WorkReportTable = ({ data }: {
    data: IDaysReport[]
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const columns: ColumnDef<IDaysReport>[] = [
        {
            accessorKey: "date",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const date = row.getValue("date") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                            <span className="capitalize">
                                {date}
                            </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "check_in_local",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Check In
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const check_in_local = row.getValue("check_in_local") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {check_in_local}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "check_out_local",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Check Out
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const check_out_local = row.getValue("check_out_local") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {check_out_local}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "late_hm",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Late
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const late_hm = row.getValue("late_hm") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {late_hm}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "early_hm",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Early
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const early_hm = row.getValue("early_hm") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {early_hm}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "worked_duration",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Worked Duration
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const worked_duration = row.getValue("worked_duration") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {worked_duration}
                        </span>
                    </div>
                );
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
                <h2 className=" text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">
                    Schedules
                </h2>
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <EmptyTableRow
                                columns={columns}
                                text="No schedules found."
                            ></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default WorkReportTable;