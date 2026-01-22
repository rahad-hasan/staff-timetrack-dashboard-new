"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
import CheckIcon from "@/components/Icons/CheckIcon";
import { format, parseISO } from "date-fns";
import { IDailyTimeEntryItem } from "@/types/type";

const DailyTimeSheetsTable = ({ data }: { data: IDailyTimeEntryItem[] }) => {
    const [sorting, setSorting] = useState<SortingState>([])

    const columns: ColumnDef<IDailyTimeEntryItem>[] = [
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

                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-headingTextColor dark:text-darkTextPrimary">{row?.original?.project?.name}</span>
                        <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">{row?.original?.task?.name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "activity",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Activity
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return (
                    <div className="flex items-center gap-2">
                        {
                            row?.original?.activity_score_avg === null || row?.original?.activity_score_avg < 30 ?
                                <span className=" bg-[#f40139] text-white font-normal px-2 py-0.5 rounded-full">{row?.original?.activity_score_avg === null ? 0 : row?.original?.activity_score_avg}%</span>
                                :
                                <span className=" bg-[#5db0f1] text-white font-normal px-2 py-0.5 rounded-full">{row?.original?.activity_score_avg}%</span>
                        }
                    </div>
                );
            }
        },
        {
            accessorKey: "manual",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Manual
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return (
                    <div className="flex items-center gap-2 text-primary">
                        <span>{row?.original?.is_manual ? <CheckIcon size={22} /> : ''}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "totalTime",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Total time
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return (
                    <div className=" flex items-center justify-between">
                        <div className=" flex justify-between gap-4">
                            <div className="">
                                <h1 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {row?.original?.total_duration_formatted}
                                </h1>
                                <p className=" text-sm font-thin text-subTextColor dark:text-darkTextSecondary">{format(parseISO(row?.original?.span?.start), 'h:mm a')} - {format(parseISO(row?.original?.span?.end), 'h:mm a')}</p>
                            </div>
                        </div>
                        <FilterButton />
                    </div>
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
        state: {
            sorting,
        },
    });

    return (
        <div className="border border-borderColor dark:border-darkBorder  dark:bg-darkPrimaryBg pb-4.5 rounded-[12px] overflow-hidden">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead className="first:rounded-bl-none last:rounded-br-none" key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table?.getRowModel()?.rows?.length ? (
                        table.getRowModel()?.rows?.map(row => (
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
                            <EmptyTableRow columns={columns} text="No time entry found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default DailyTimeSheetsTable;