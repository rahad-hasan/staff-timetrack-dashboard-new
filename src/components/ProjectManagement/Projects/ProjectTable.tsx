"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { useMemo, useState } from "react";
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
import { ArrowUpDown, ChevronDown, Copy, EllipsisVertical, Eye, Package2, Pencil, Trash2, UsersRound } from "lucide-react";
// import lowFlag from '../../assets/dashboard/lowFlag.svg'
// import mediumFlag from '../../assets/dashboard/mediumFlag.svg'
// import noneFlag from '../../assets/dashboard/noneFlag.svg'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import EditProjectModal from "./EditProjectModal";

const ProjectTable = () => {
    console.log("ProjectTable");
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    const router = useRouter();

    // Function to handle row click and navigation
    const handleRowClick = (taskId: number) => {
        router.push(`/project-management/projects/${taskId}`);
    };

    interface Task {
        _id: number;
        taskName: string;
        date: string;
        image: string;
        manager: string;
        timeWorked: string;
        status: string;
        deadline: string;
    }

    const taskList = useMemo(
        () => [
            {
                _id: 15645,
                taskName: "Do the Logic for Orbit Home page project",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/25",
                manager: "Juyed Ahmed",
                timeWorked: "12:03:00",
                status: "In Progress",
                deadline: "Dec 20, 2025",
            },
            {
                _id: 53452,
                taskName: "Marketing Tools",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/22",
                manager: "Cameron Williamson",
                timeWorked: "12:03:00",
                status: "Pending",
                deadline: "Jan 10, 2026",
            },
            {
                _id: 15644,
                taskName: "Design Idea",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/26",
                manager: "Jenny Wilson",
                timeWorked: "11:03:00",
                status: "In Progress",
                deadline: "Jun 05, 2025",
            },
            {
                _id: 12465,
                taskName: "Do the Logic for Orbit Home page project wi...",
                date: "From 12 Aug, 2025",
                image: "https://avatar.iran.liara.run/public/27",
                manager: "Esther Howard",
                timeWorked: "10:03:00",
                status: "Pending",
                deadline: "Feb 01, 2026",
            }
        ],
        []
    );

    const columns: ColumnDef<Task>[] = [
        // {
        //     id: "select",
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={
        //                 table.getIsAllPageRowsSelected() ||
        //                 (table.getIsSomePageRowsSelected() && "indeterminate")
        //             }
        //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //             aria-label="Select all"
        //             className=" cursor-pointer"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value) => row.toggleSelected(!!value)}
        //             aria-label="Select row"
        //             className=" cursor-pointer"
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        {
            accessorKey: "taskName",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const task = row.getValue("taskName") as string;
                const date = row.original.date;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{task}</span>
                        <span className="">{date}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "manager",
            header: ({ column }) => {
                return (
                    <div className=" min-w-[190px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Manager
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const manager = row.getValue("manager") as string;
                const image = row.original.image;
                return (
                    <div className="flex items-center gap-2">
                        <Image
                            src={image}
                            width={40}
                            height={40}
                            alt={manager}
                            className="rounded-full w-10"
                        />
                        <span>{manager}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "assignee",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[120px]">
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
                const image = row.original.image;
                return (
                    <div className="flex items-center">
                        {[image, image, image].map((imgSrc, index) => (
                            <Image
                                key={index}
                                src={imgSrc}
                                width={40}
                                height={40}
                                alt={`Assignee ${index + 1}`}
                                className="rounded-full w-10 -ml-3 border-2 border-white"
                            />
                        ))}
                        <div className="w-10 h-10 -ml-3 rounded-full bg-[#ede7ff] flex items-center justify-center text-sm font-semibold text-[#926fef] border-2 border-white">
                            10+
                        </div>
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
                const timeWorked = row.getValue("timeWorked") as string;
                return <div className="">{timeWorked}</div>;
            },
        },
        {
            accessorKey: "deadline",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
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
                return <div className="">{deadline}</div>;
            },
        },
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
                    status === "In Progress"
                        ? "bg-blue-100 dark:bg-darkPrimaryBg text-blue-800 dark:text-darkTextPrimary"
                        : "bg-gray-100 dark:bg-darkPrimaryBg text-gray-800 dark:text-darkTextPrimary";

                const handleStatusChange = (newStatus: string) => {
                    console.log(newStatus);
                };

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline2"
                                    className={`px-2 py-1.5 rounded-full text-sm font-medium ${statusClass}`}
                                >
                                    <span className={` w-2 h-2 rounded-full ${status === "In Progress" ? "bg-blue-300 dark:bg-gray-300 " : "bg-gray-300"}`}></span>
                                    {status}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("In Progress")}>
                                    In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem className=" cursor-pointer" onClick={() => handleStatusChange("Pending")}>
                                    Pending
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
                console.log(row);
                return <div className="">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className=" dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" className=" w-[250px] px-2">
                            <div className="">
                                <div className="space-y-2">
                                    <div onClick={() => handleRowClick(row.original._id)} className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Eye size={18} />
                                        <p>View Project</p>
                                    </div>
                                    <Dialog>
                                        <form>
                                            <DialogTrigger asChild>
                                                <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                    <Pencil size={18} />
                                                    <p>Edit Project</p>
                                                </div>
                                            </DialogTrigger>
                                            <EditProjectModal></EditProjectModal>
                                        </form>
                                    </Dialog>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <UsersRound size={18} />
                                        <p>Manage member</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Copy size={18} />
                                        <p>Duplicate Project</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Package2 size={18} />
                                        <p>Archive Project</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <Trash2 size={18} />
                                        <p>Delete Project</p>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div >;
            },
        },
    ];


    const table = useReactTable({
        data: taskList,
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
        <div className="mt-5 border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px]">
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
                            <TableRow className=" cursor-pointer" key={row.id} >
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
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No tasks found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ProjectTable;