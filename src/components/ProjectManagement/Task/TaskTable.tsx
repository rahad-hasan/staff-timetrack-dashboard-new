/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import lowFlag from '../../../assets/dashboard/lowFlag.svg'
import mediumFlag from '../../../assets/dashboard/mediumFlag.svg'
import noneFlag from '../../../assets/dashboard/noneFlag.svg'
// import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog } from "@/components/ui/dialog";
import EditTaskModal from "./EditTaskModal";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
import { ITask } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import { toast } from "sonner";
import { editTask } from "@/actions/task/action";

const TaskTable = ({ data }: { data: ITask[] }) => {
    console.log("TaskTable", data);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<ITask | null>(null)

    async function handleStatusUpdate(values: { status: string, id: number }) {
        setLoading(true);
        try {
            const res = await editTask({ data: { status: values.status }, id: values.id });
            console.log("success:", res);

            if (res?.success) {
                toast.success(res?.message || "Status updated successfully");
            } else {
                toast.error(res?.message || "Failed to update status");
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    const columns: ColumnDef<ITask>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Task Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                const project = row?.original?.project?.name;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-headingTextColor dark:text-darkTextPrimary">{name}</span>
                        <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">{project}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "assignedBy",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Assignee
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const assignee = row?.original?.assignedBy?.name;
                const image = row?.original?.assignedBy?.image;
                return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Avatar>
                            <AvatarImage src={image} alt={assignee} />
                            <AvatarFallback>{assignee?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{assignee}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "timeWorked",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time Worked
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return <div className="">{row?.original?.duration}</div>;
            },
        },
        {
            accessorKey: "priority",
            // header: "Priority",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Priority
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const priority = row.getValue("priority") as string;
                const flagImage = priority === "Low" ? lowFlag : priority === "Medium" ? mediumFlag : noneFlag;
                return (
                    <div className="flex items-center gap-2">
                        <Image src={flagImage} width={100} height={100} alt="flag" className="w-4" />
                        <span>{priority}</span>
                    </div>
                );
            }
        },
        // {
        //     accessorKey: "status",
        //     // header: "Status",
        //     // header: () => <div className=" text-right">Status</div>,
        //     header: ({ column }) => {
        //         return (
        //             <div className=" flex justify-end">
        //                 <span
        //                     className=" cursor-pointer flex items-center gap-1"
        //                     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //                 >
        //                     Status
        //                     <ArrowUpDown className="ml-2 h-4 w-4" />
        //                 </span>
        //             </div>
        //         )
        //     },
        //     cell: ({ row }) => {
        //         const status = row.getValue("status") as string;

        //         const statusClass =
        //             status === "In Progress"
        //                 ? "bg-blue-100 dark:bg-darkPrimaryBg text-blue-800 dark:text-darkTextPrimary"
        //                 : "bg-gray-100 dark:bg-darkPrimaryBg text-gray-800 dark:text-darkTextPrimary";

        //         const handleStatusChange = (newStatus: string) => {
        //             console.log(newStatus);
        //         };

        //         return (
        //             <div className="flex justify-end">
        //                 <DropdownMenu>
        //                     <DropdownMenuTrigger asChild>
        //                         <Button
        //                             variant="outline2"
        //                             className={`px-2 py-1.5 rounded-full text-sm font-medium ${statusClass}`}
        //                         >
        //                             <span className={` w-2 h-2 rounded-full ${status === "In Progress" ? "bg-blue-300 dark:bg-gray-300 " : "bg-gray-300"}`}></span>
        //                             {status}
        //                             <ChevronDown />
        //                         </Button>
        //                     </DropdownMenuTrigger>
        //                     <DropdownMenuContent align="end">
        //                         <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("In Progress")}>
        //                             In Progress
        //                         </DropdownMenuItem>
        //                         <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("Pending")}>
        //                             Pending
        //                         </DropdownMenuItem>
        //                     </DropdownMenuContent>
        //                 </DropdownMenu>
        //             </div>
        //         );
        //     },
        // },
        {
            accessorKey: "status",
            // header: "Status",
            // header: () => <div className=" text-right">Status</div>,
            header: ({ column }) => {
                return (
                    <div className=" flex justify-end">
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
                const status = row.getValue("status") as string;

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
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-2 rounded-xl text-sm font-medium ${statusClass}`}
                                >
                                    <span className={` w-2 h-2 rounded-full ${status === "processing" ? "bg-[#efaf07] " : status === "cancelled" ? "bg-[#f40139]" : status === "pending" ? "bg-[#5db0f1]" : "bg-[#26bd6c]"}`}></span>
                                    {status}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className=" space-y-2 w-[200px] p-2 rounded-lg">
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#fff5db] border border-[#efaf07] text-[#efaf07] focus:text-[#efaf07] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    disabled={loading}
                                    onClick={() => handleStatusUpdate({ status: "processing", id: row?.original?.id })}
                                >
                                    {
                                        status === "processing" && <Check className=" bg-[#efaf07] text-white rounded-full p-0.5" />
                                    }
                                    In Progress
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#fee6eb] border border-[#fcc2cf] text-[#f40139] focus:text-[#f40139] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    disabled={loading}
                                    onClick={() => handleStatusUpdate({ status: "cancelled", id: row?.original?.id })}
                                >
                                    {
                                        status === "cancelled" && <Check className=" bg-[#f40139] text-white rounded-full p-0.5" />
                                    }
                                    Cancel
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#eff7fe] border border-[#cde7fb] text-[#5db0f1] focus:text-[#5db0f1] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    disabled={loading}
                                    onClick={() => handleStatusUpdate({ status: "pending", id: row?.original?.id })}
                                >
                                    {
                                        status === "pending" && <Check className=" bg-[#5db0f1] text-white rounded-full p-0.5" />
                                    }
                                    Pending
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg bg-[#e9f8f0] border border-[#bcebd1] text-[#26bd6c] focus:text-[#26bd6c] dark:bg-darkSecondaryBg dark:border-darkBorder py-2"
                                    disabled={loading}
                                    onClick={() => handleStatusUpdate({ status: "complete", id: row?.original?.id })}
                                >
                                    {
                                        status === "complete" && <Check className=" bg-[#26bd6c] text-white rounded-full p-0.5" />
                                    }
                                    Done
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
        {
            accessorKey: "action",
            header: () => <div className="">Action</div>,
            cell: ({ row }) => {
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedTask(row?.original);
                                            setOpen(true);
                                        }}
                                        className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <EditIcon size={18} />
                                        <p>Edit Client</p>
                                    </div>

                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <DeleteIcon size={18} />
                                        <p>Delete Client</p>
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-base sm:text-lg">TASK LIST</h2>
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
                            <EmptyTableRow columns={columns} text="No tasks found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Edit modal here */}
            <Dialog open={open} onOpenChange={setOpen}>
                {selectedTask && (
                    <EditTaskModal
                        onClose={() => setOpen(false)}
                        selectedProject={selectedTask}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default TaskTable;