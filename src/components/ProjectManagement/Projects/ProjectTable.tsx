/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
// import lowFlag from '../../assets/dashboard/lowFlag.svg'
// import mediumFlag from '../../assets/dashboard/mediumFlag.svg'
// import noneFlag from '../../assets/dashboard/noneFlag.svg'
// import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IProject } from "@/types/type";
import EyeIcon from "@/components/Icons/EyeIcon";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
// import DuplicateIcon from "@/components/Icons/FilterOptionIcon/DuplicateIcon";
// import ArchiveIcon from "@/components/Icons/FilterOptionIcon/ArchiveIcon";
// import MemberIcon from "@/components/Icons/FilterOptionIcon/MemberIcon";
// import DeleteIcon from "@/components/Icons/DeleteIcon";
import EditProjectModal from "./EditProjectModal";
import { toast } from "sonner";
import { deleteProject, editProject } from "@/actions/projects/action";
import { useProjectFormStore } from "@/store/ProjectFormStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import { formatTZDayMonthYear } from "@/utils";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import ConfirmDialog from "@/components/Common/ConfirmDialog";


const ProjectTable = ({ data }: { data: IProject[] }) => {

    const [open, setOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<IProject | null>(null)
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const router = useRouter();
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    const resetData = useProjectFormStore(state => state.resetData);
    // handle edit modal close and clean zustand store
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            resetData();
        }
        setOpen(isOpen);
    };

    // Function to handle row click and navigation
    const handleRowClick = (taskId: number) => {
        router.push(`/project-management/projects/${taskId}`);
    };

    async function handleStatusUpdate(values: { status: string, id: number }) {
        setLoading(true);
        try {
            const res = await editProject({ data: { status: values.status }, id: values.id });

            if (res?.success) {
                toast.success(res?.message || "Status updated successfully");
            } else {
                toast.error(res?.message || "Failed to update status", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            console.error("failed:", error);
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
    }

    async function handleDelete(values: IProject) {
        setDeleteLoading(true);
        try {
            const res = await deleteProject(values.id);

            if (res?.success) {
                toast.success(res?.message || "Project deleted successfully");
            } else {
                toast.error(res?.message || "Failed to delete project", {
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
            setDeleteLoading(false);
        }
    }

    const columns: ColumnDef<IProject>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const task = row.getValue("name") as string;
                const start_date = row.original.start_date;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-headingTextColor dark:text-darkTextPrimary">{task}</span>
                        <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">{formatTZDayMonthYear(start_date)}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "manager",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[180px]">
                        <span
                            className=" flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Manager
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const managers = row.original.projectManagerAssigns ?? [];
                const MAX_VISIBLE = 3;

                const visibleManagers = managers.slice(0, MAX_VISIBLE);
                const remainingCount = managers.length - MAX_VISIBLE;

                return (
                    <div className="flex items-center">
                        {visibleManagers.map((item, index) => (
                            <Avatar key={index} className={index !== 0 ? "-ml-3" : ""}>
                                <AvatarImage
                                    src={item?.user?.image ?? ""}
                                    alt={item.user.name}
                                />
                                <AvatarFallback>
                                    {item.user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        ))}

                        {remainingCount > 0 && (
                            <div className="-ml-3 w-11 h-11 z-50 rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-medium text-[#926fef] border border-white">
                                {remainingCount}+
                            </div>
                        )}
                    </div>

                );
            }
        },
        {
            accessorKey: "assignee",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[150px]">
                        <span
                            className=" flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Assignee
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const assignee = row.original.projectAssigns ?? [];
                const MAX_VISIBLE = 3;

                const visibleAssignee = assignee.slice(0, MAX_VISIBLE);
                const remainingCount = assignee.length - MAX_VISIBLE;
                return (
                    <div className="flex items-center">
                        {visibleAssignee.map((item, index) => (
                            <Avatar key={index} className={index !== 0 ? "-ml-3" : ""}>
                                <AvatarImage
                                    src={item?.user?.image ?? ""}
                                    alt={item.user.name}
                                />
                                <AvatarFallback>
                                    {item.user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        ))}

                        {remainingCount > 0 && (
                            <div className="-ml-3 w-11 h-11 z-50 rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-medium text-[#926fef] border border-white">
                                {remainingCount}+
                            </div>
                        )}
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
                            className=" flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time Worked
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return <div className="">{row?.original?.summary?.duration}</div>;
            },
        },
        {
            accessorKey: "deadline",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Deadline
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const deadline = row.getValue("deadline") as string;
                return <div className="">{formatTZDayMonthYear(deadline)}</div>;
            },
        },
        // {
        //     accessorKey: "status",
        //     // header: "Status",
        //     // header: () => <div className=" text-right">Status</div>,
        //     header: ({ column }) => {
        //         return (
        //             <div className=" flex justify-end">
        //                 <span
        //                     className=" flex items-center gap-1"
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
                            className="  flex items-center gap-1"
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
                        {
                            (logInUserData?.role === 'admin' ||
                                logInUserData?.role === 'manager') ?
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
                                :
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-2 rounded-xl text-sm font-medium ${statusClass} cursor-default`}
                                >
                                    <span className={` w-2 h-2 rounded-full ${status === "processing" ? "bg-[#efaf07] " : status === "cancelled" ? "bg-[#f40139]" : status === "pending" ? "bg-[#5db0f1]" : "bg-[#26bd6c]"}`}></span>
                                    {status}
                                    <ChevronDown />
                                </Button>
                        }
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
                                    <div onClick={() => handleRowClick(row?.original?.id)} className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <EyeIcon size={18} />
                                        <p>View Project</p>
                                    </div>
                                    {
                                        (logInUserData?.role === 'admin' ||
                                            logInUserData?.role === 'manager') &&
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProject(row?.original);
                                                setOpen(true);
                                            }}
                                            className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                            <EditIcon size={18} />
                                            <p>Edit Project</p>
                                        </div>
                                    }


                                    {/* <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <MemberIcon size={18} />
                                        <p>Manage member</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <DuplicateIcon size={18} />
                                        <p>Duplicate Project</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <ArchiveIcon size={18} />
                                        <p>Archive Project</p>
                                    </div> */}
                                    <ConfirmDialog
                                        trigger={
                                            <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                <DeleteIcon size={18} />
                                                <p>Delete Project</p>
                                            </div>
                                        }
                                        title="Delete the project"
                                        description="Are you sure you want to delete this project? This action cannot be undone."
                                        confirmText="Confirm"
                                        cancelText="Cancel"
                                        // confirmClassName="bg-primary hover:bg-primary"
                                        onConfirm={() => handleDelete(row?.original)}
                                    />

                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div >;
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
                <h2 className=" text-base sm:text-lg">Projects</h2>
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
                            // <Link key={row.id} href={`/project-management/projects/${row.original._id}`} className=" w-full">
                            <TableRow className="" key={row.id} >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                            // </Link>
                        ))
                    ) : (
                        <TableRow>
                            <EmptyTableRow columns={columns} text="No project found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* Edit modal here */}
            <Dialog open={open} onOpenChange={handleOpenChange}>
                {selectedProject && (
                    <EditProjectModal
                        onClose={() => setOpen(false)}
                        selectedProject={selectedProject}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default ProjectTable;