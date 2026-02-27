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
    const getRowToneClass = (isLate: boolean, isEarly: boolean) => {
        if (isLate && isEarly) {
            return "bg-lime-50/70 dark:bg-lime-500/10 border-lime-200/80 dark:border-lime-500/40";
        }
        if (isLate) {
            return "bg-rose-50/70 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/40";
        }
        if (isEarly) {
            return "bg-amber-50/70 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/40";
        }
        return "";
    };

    const getAccentClass = (isLate: boolean, isEarly: boolean) => {
        if (isLate && isEarly) return "border-l-lime-500";
        if (isLate) return "border-l-rose-500";
        if (isEarly) return "border-l-amber-500";
        return "border-l-borderColor dark:border-l-darkBorder";
    };
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
                        <span className="">
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
                        <span className="">
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className=" text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">
                    Work Report
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-subTextColor dark:text-darkTextSecondary">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Late
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Early
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-lime-500" />
                        Late + Early
                    </span>
                </div>
            </div>
            <Table className="border-separate border-spacing-y-1">
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id} className="border-b-0">
                            {hg.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="text-subTextColor dark:text-darkTextPrimary"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => {
                            const isLate = row.original.late_minutes > 0;
                            const isEarly = row.original.early_minutes > 0;
                            const rowToneClass = getRowToneClass(isLate, isEarly);
                            const leftAccentClass = getAccentClass(isLate, isEarly);
                            const isHighlighted = isLate || isEarly;

                            return (
                                <TableRow key={row.id} className="group border-b-0 overflow-hidden last:[&_td]:pb-4">
                                    {row.getVisibleCells().map((cell, idx, arr) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === arr.length - 1;
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={[
                                                    "border-y border-borderColor/80 dark:border-darkBorder/40 bg-white/60 dark:bg-darkPrimaryBg/40 px-4 py-3 text-sm transition-colors group-hover:bg-white/90 dark:group-hover:bg-darkPrimaryBg/60",
                                                    isFirst && "rounded-l-xl",
                                                    isLast && "rounded-r-xl",
                                                    isFirst && (isHighlighted ? "border-l-4" : "border-l"),
                                                    isLast && "border-r",
                                                    rowToneClass,
                                                    isFirst && isHighlighted && leftAccentClass,
                                                ].join(" ")}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <EmptyTableRow columns={columns} text="No schedules found." />
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default WorkReportTable;
