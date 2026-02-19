/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import EmptyTableRow from "../Common/EmptyTableRow";
import { ISchedules } from "@/types/type";
import FilterButton from "../Common/FilterButton";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import EditIcon from "../Icons/FilterOptionIcon/EditIcon";
import { Dialog } from "../ui/dialog";
import EditScheduleModal from "./EditScheduleModal";
import Link from "next/link";
import DeleteIcon from "../Icons/DeleteIcon";
import { deleteSchedule } from "@/actions/schedule/action";
import { toast } from "sonner";
import ConfirmDialog from "../Common/ConfirmDialog";

const ScheduleTable = ({ data }: { data: ISchedules[] }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [open, setOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ISchedules | null>(null);

    async function handleDelete(values: ISchedules) {
        if (!values?.id) {
            return;
        }
        try {
            const res = await deleteSchedule(values.id);

            if (res?.success) {
                toast.success(res?.message || "Schedule deleted successfully");
            } else {
                toast.error(res?.message || "Failed to delete schedule", {
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
        }
    }

    const columns: ColumnDef<ISchedules>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <Link href={`/schedule/${row?.original?.id}`}>
                            <span className="capitalize hover:underline-offset-2 hover:underline">
                                {name}
                            </span>
                        </Link>
                    </div>
                );
            },
        },
        {
            accessorKey: "start_time_local",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Shift Start
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const start_time_local = row.getValue("start_time_local") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {start_time_local}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "end_time_local",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Shift End
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const end_time_local = row.getValue("end_time_local") as string;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {end_time_local}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "_count?.scheduleAssigns",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Schedule Assigns
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const scheduleAssigns = row?.original?._count?.scheduleAssigns;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {scheduleAssigns}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "grace_in_min",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Grace In
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const grace_in_min = row?.original?.grace_in_min;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {grace_in_min} Min
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "grace_out_min",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Grace Out
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                );
            },
            cell: ({ row }) => {
                const grace_out_min = row?.original?.grace_out_min;
                return (
                    <div className="flex items-center gap-2 min-w-[100px]">
                        <span className="capitalize">
                            {grace_out_min} Min
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "action",
            header: () => <div className="">Action</div>,
            cell: (row) => {
                return (
                    <div className="">
                        <Popover>
                            <PopoverTrigger asChild>
                                <div>
                                    <FilterButton></FilterButton>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent side="bottom" align="end" className="w-fit p-2">
                                <div className="">
                                    <div className="space-y-2">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSchedule(row?.row?.original);
                                                setOpen(true);
                                            }}
                                            className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer"
                                        >
                                            <EditIcon size={20} />
                                            <p>Edit</p>
                                        </div>
                                        {/* <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSchedule(row?.row?.original);
                                            }}
                                            className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100  hover:dark:bg-darkPrimaryBg px-3 cursor-pointer"
                                        >
                                            <DeleteIcon size={20} />
                                            <p>Delete Shift</p>
                                        </div> */}
                                        <ConfirmDialog
                                            trigger={
                                                <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                    <DeleteIcon size={18} />
                                                    <p>Delete Schedule</p>
                                                </div>
                                            }
                                            title="Delete the schedule"
                                            description="Are you sure you want to delete this schedule? This action cannot be undone."
                                            confirmText="Confirm"
                                            cancelText="Cancel"
                                            // confirmClassName="bg-primary hover:bg-primary"
                                            onConfirm={() => handleDelete(row?.row?.original)}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
            {/* Edit Schedule Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                {selectedSchedule && (
                    <EditScheduleModal
                        selectedSchedule={selectedSchedule}
                        onClose={() => setOpen(false)}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default ScheduleTable;
