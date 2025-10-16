"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { ArrowUpDown, EllipsisVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { IClients } from "@/global/globalTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ClientsTable = () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    console.log(rowSelection);


    const clients: IClients[] = useMemo(
        () => [
            {
                name: "Orbit Design Agency",
                email: "orbitagency@gmail.com",
                phone: "880 124 214 3134",
                address: "Dhaka, Bangladesh"
            },
            {
                name: "Orbit Design Agency",
                email: "orbitagency@gmail.com",
                phone: "880 124 214 3134",
                address: "Dhaka, Bangladesh"
            },
            {
                name: "Orbit Design Agency",
                email: "orbitagency@gmail.com",
                phone: "880 124 214 3134",
                address: "Dhaka, Bangladesh"
            },
            {
                name: "Orbit Design Agency",
                email: "orbitagency@gmail.com",
                phone: "880 124 214 3134",
                address: "Dhaka, Bangladesh"
            }
        ],
        []
    );

    const columns: ColumnDef<IClients>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className=" cursor-pointer"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className=" cursor-pointer"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
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
                const name = row.getValue("name") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Email
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const email = row.getValue("email") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{email}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "phone",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Phone
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const phone = row.getValue("phone") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{phone}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "address",
            header: ({ column }) => {
                return (
                    <div>
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Address
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const address = row.getValue("address") as string;
                return (
                    <div className="flex flex-col">
                        <span className="">{address}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "action",
            header: () => <div className="">Action</div>,
            cell: ({ row }) => {
                console.log(row);
                return <div className="">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" className=" w-[250px] px-2">
                            <div className="">
                                <div className="space-y-2">
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 px-3 cursor-pointer">
                                        <Eye size={18} />
                                        <p>View Client</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 px-3 cursor-pointer">
                                        <Pencil size={18} />
                                        <p>Edit Client</p>
                                    </div>
                                    <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 px-3 cursor-pointer">
                                        <Trash2 size={18} />
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
        data: clients,
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
        <div className="mt-5 border-2 border-borderColor p-3 rounded-[12px]">
            <div className=" mb-5">
                <h2 className=" text-md sm:text-lg">TASK LIST</h2>
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

export default ClientsTable;