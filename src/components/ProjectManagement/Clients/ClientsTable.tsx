/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { IClients } from "@/global/globalTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import EditClientModal from "./EditClientModal";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import FilterButton from "@/components/Common/FilterButton";
// import EyeIcon from "@/components/Icons/EyeIcon";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import { toast } from "sonner";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { deleteClient } from "@/actions/clients/action";
// import DeleteIcon from "@/components/Icons/DeleteIcon";

const ClientsTable = ({ data }: any) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<IClients | null>(null)

    async function handleDelete(info: any) {
        setLoading(true);
        try {
            const res = await deleteClient(info?.id);

            if (res?.success) {
                toast.success(res?.message || "Client deleted successfully");
            } else {
                toast.error(res?.message || "Failed to delete client", {
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
            setLoading(false);
        }
    }
    const columns: ColumnDef<IClients>[] = [
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
                            <ArrowUpDown className="ml-2 h-4 w-4 " />
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
            cell: (row) => {
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
                                    {/* <Link href={`/project-management/clients/777`}>
                                        <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                            <EyeIcon size={18} />
                                            <p>View Client</p>
                                        </div>
                                    </Link> */}

                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedClient(row?.row?.original);
                                            setOpen(true);
                                        }}
                                        className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                        <EditIcon size={18} />
                                        <p>Edit Client</p>
                                    </div>

                                    <ConfirmDialog
                                        trigger={
                                            <div className=" flex items-center gap-2 w-full py-2 rounded-lg hover:bg-gray-100 hover:dark:bg-darkPrimaryBg px-3 cursor-pointer">
                                                <DeleteIcon size={18} />
                                                <p>Delete Client</p>
                                            </div>
                                        }
                                        title="Delete the client"
                                        description="Are you sure you want to delete this client? This action cannot be undone."
                                        confirmText="Confirm"
                                        cancelText="Cancel"
                                        // confirmClassName="bg-primary hover:bg-primary"
                                        onConfirm={() => handleDelete(row?.row?.original)}
                                    />
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
                <h2 className=" text-base sm:text-lg">Clients</h2>
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
                            <EmptyTableRow columns={columns} text="No clients found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {/* modal here */}
            <Dialog open={open} onOpenChange={setOpen}>
                {selectedClient && (
                    <EditClientModal
                        onClose={() => setOpen(false)}
                        selectedClient={selectedClient}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default ClientsTable;