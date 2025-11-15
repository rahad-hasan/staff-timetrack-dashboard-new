"use client";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import screenshortImg from "../../../assets/dashboard/screenshort1.png";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const UnusualActivityTable = () => {
    const [sorting, setSorting] = useState<SortingState>([]);

    const unusualActivities = useMemo(
        () => [
            {
                date: "2025-10-25",
                employee: "John Doe",
                reason: "Long Idle",
                description: "Idle for 45 min between 2 PM–2:45 PM",
                duration: "45 min",
                evidence: "View Screenshot",
                evidence_url: screenshortImg,
            },
            {
                date: "2025-10-25",
                employee: "Sarah",
                reason: "Non-Work URL",
                description: "Visited facebook.com during shift",
                duration: "10 min",
                evidence: "View Screenshot",
                evidence_url: screenshortImg,
            },
            {
                date: "2025-10-24",
                employee: "Tom",
                reason: "Late Check-In",
                description: "Started work at 11:20 AM (expected 9 AM)",
                duration: "2h 20min delay",
                evidence: "Screenshot",
                evidence_url: screenshortImg,
            },
            {
                date: "2025-10-24",
                employee: "Mia",
                reason: "No Input Detected",
                description: "Active window Chrome but no keystrokes/mouse",
                duration: "20 min",
                evidence: "Screenshot",
                evidence_url: screenshortImg,
            },
            {
                date: "2025-10-23",
                employee: "Ali",
                reason: "Repeated Frame",
                description: "3 identical screenshots in a row",
                duration: "15 min",
                evidence: "Compare Images",
                evidence_url: screenshortImg,
            },
        ],
        []
    );

    const columns: ColumnDef<(typeof unusualActivities)[0]>[] = [
        {
            accessorKey: "date",
            header: ({ column }) => (
                <div
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-sm font-medium">{row.getValue("date")}</div>
            ),
        },
        {
            accessorKey: "employee",
            header: ({ column }) => (
                <div
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Employee
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
            ),
            cell: ({ row }) => (
                <span className="font-semibold">{row.getValue("employee")}</span>
            ),
        },
        {
            accessorKey: "reason",
            header: ({ column }) => (
                <div
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Reason
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
            ),
            cell: ({ row }) => {
                const reason = row.getValue("reason") as string;
                const color =
                    reason.includes("Idle") || reason.includes("No Input")
                        ? "bg-red-100 text-red-700"
                        : reason.includes("URL")
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700";
                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}
                    >
                        {reason}
                    </span>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {row.getValue("description")}
                </p>
            ),
        },
        {
            accessorKey: "duration",
            header: ({ column }) => (
                <div
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Duration
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
            ),
            cell: ({ row }) => (
                <span className="font-semibold">{row.getValue("duration")}</span>
            ),
        },
        {
            accessorKey: "evidence",
            header: "Evidence",
            cell: ({ row }) => {
                const evidence = row.original.evidence;
                const evidenceUrl = row.original.evidence_url;

                return evidence === "—" ? (
                    <span className="text-gray-400">—</span>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Image
                                src={evidenceUrl}
                                alt="screenshot"
                                width={200}
                                height={200}
                                className="rounded-md w-20 cursor-pointer border border-gray-300 hover:opacity-80 transition"
                            />
                        </DialogTrigger>

                        <DialogContent className="max-w-[95vw] md:max-w-[97vw] lg:max-w-[1400px] p-0 overflow-hidden">
                            <DialogHeader className="p-3 flex justify-between items-center border-b">
                                <DialogTitle className="text-lg font-semibold">
                                    Screenshot Preview
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex justify-center items-center bg-gray-50 dark:bg-darkSecondaryBg">
                                <Image
                                    src={evidenceUrl}
                                    alt="Screenshot Preview"
                                    width={1600}
                                    height={900}
                                    className="rounded-md object-contain w-full h-auto "
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                );
            },
        },
    ];

    const table = useReactTable({
        data: unusualActivities,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="border-2 border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] overflow-x-auto mt-5">
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
                                            header.getContext()
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
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No unusual activity found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default UnusualActivityTable;
