/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Check } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
// import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import ApproveIcon from "@/components/Icons/FilterOptionIcon/ApproveIcon";
import DenyIcon from "@/components/Icons/FilterOptionIcon/DenyIcon";
import { IManualTimeEntry } from "@/types/type";
import { format } from "date-fns";
// import EditManualTimeModal from "./EditManualTimeModal";
// import { Dialog } from "@/components/ui/dialog";
import { useLogInUserStore } from "@/store/logInUserStore";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { toast } from "sonner";
import { approveRejectManualTimeEntry } from "@/actions/timesheets/action";
import { convertDecimalHoursToHMS } from "@/utils";
import { Button } from "@/components/ui/button";


const ManualRequestsTable = ({ data }: { data: IManualTimeEntry[] }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    // const [open, setOpen] = useState(false)
    // const [selectedItem, setSelectedItem] = useState<IManualTimeEntry | null>(null)
    const logInUserData = useLogInUserStore(state => state.logInUserData);

    // handle approve or reject manual request
    const handleApproveReject = async ({ is_approved, id }: { is_approved: boolean, id: number }) => {
        try {
            const res = await approveRejectManualTimeEntry({
                data: {
                    is_approved: is_approved
                },
                id: id
            });
            console.log("success:", res);

            if (res?.success) {
                toast.success(res?.message || `Manual request ${is_approved ? "approved" : "rejected"} successfully`);
            } else {
                toast.error(res?.message || `Failed to ${is_approved ? "approved" : "rejected"} manual request`);
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error.message || "Something went wrong!");
        }
    }


    const columns: ColumnDef<IManualTimeEntry>[] = [
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
                const project = row?.original?.project?.name;
                const taskName = "Task Not Available In Api";
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-headingTextColor dark:text-darkTextPrimary">{project}</span>
                        <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">{taskName}</span>
                    </div>
                )
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
                const status = row?.original?.status;
                const statusClass =
                    status === "processing"
                        ? "bg-[#fff5db] border border-[#efaf07] text-[#efaf07] hover:text-[#efaf07]"
                        :
                        status === "cancelled" ?
                            "bg-[#fee6eb] border border-[#fcc2cf] text-[#f40139] hover:text-[#f40139]"
                            :
                            status === "pending" ?
                                "bg-[#eff7fe] border border-[#cde7fb] text-[#5db0f1] hover:text-[#5db0f1]"
                                :
                                "bg-[#e9f8f0] border border-[#bcebd1] text-[#26bd6c] hover:text-[#26bd6c]"
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline2"
                            className={`px-3 py-1 rounded-xl text-sm font-medium cursor-default ${statusClass}`}
                        >
                            <span className={` w-2 h-2 rounded-full ${status === "processing" ? "bg-[#efaf07] " : status === "cancelled" ? "bg-[#f40139]" : status === "pending" ? "bg-[#5db0f1]" : "bg-[#26bd6c]"}`}></span>
                            {status}
                        </Button>
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
            cell: () => {

                return (
                    <div className="flex items-center gap-2">
                        <span>{<Check className=" text-primary border border-primary rounded-full p-0.5" />}</span>
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
                    <div className=" flex justify-between items-center gap-4">
                        <div className="">
                            <h1 className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
                                {convertDecimalHoursToHMS(row?.original?.duration)}
                            </h1>
                            <p className=" text-sm font-thin text-subTextColor dark:text-darkTextSecondary">{format(new Date(row?.original?.start_time), 'hh:mm a')} - {format(new Date(row?.original?.end_time), 'hh:mm a')}</p>
                        </div>
                        <>
                            {
                                (logInUserData?.role === 'admin' ||
                                    logInUserData?.role === 'manager' ||
                                    logInUserData?.role === 'hr') &&
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div>
                                            <FilterButton></FilterButton>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent side="bottom" align="end" className=" w-[260px] p-2">
                                        <div className="">
                                            <div className="space-y-2">
                                                {/* <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedItem(row?.original);
                                                setOpen(true);
                                            }}
                                            className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                            <EditIcon size={20} />
                                            <p>Edit Time</p>
                                        </div> */}

                                                <ConfirmDialog
                                                    trigger={
                                                        <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                            <ApproveIcon size={20} />
                                                            <p>Approve requested time</p>
                                                        </div>
                                                    }
                                                    title="Approve the entry"
                                                    description="Are you sure you want to approve this entry? This action cannot be undone."
                                                    confirmText="Confirm"
                                                    cancelText="Cancel"
                                                    confirmClassName="bg-primary hover:bg-primary"
                                                    onConfirm={() => handleApproveReject({ is_approved: true, id: row?.original?.id })}
                                                />
                                                <ConfirmDialog
                                                    trigger={
                                                        <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                            <DenyIcon size={20} />
                                                            <p>Deny requested time</p>
                                                        </div>
                                                    }
                                                    title="Reject the entry"
                                                    description="Are you sure you want to reject this entry? This action cannot be undone."
                                                    confirmText="Confirm"
                                                    cancelText="Cancel"
                                                    onConfirm={() => handleApproveReject({ is_approved: false, id: row?.original?.id })}
                                                />


                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            }
                        </>
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
        <div className="border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg pb-4.5 rounded-[12px] overflow-hidden">
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
                        <TableRow className="">
                            <EmptyTableRow columns={columns} text="No manual request found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* edit modal here */}
            {/* <Dialog open={open} onOpenChange={setOpen}>
                {selectedItem && (
                    <EditManualTimeModal
                        onClose={() => setOpen(false)}
                        selectedItem={selectedItem}
                    />
                )}
            </Dialog> */}
        </div>
    );
};

export default ManualRequestsTable;