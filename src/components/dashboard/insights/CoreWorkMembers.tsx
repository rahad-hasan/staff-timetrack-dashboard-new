"use client"
import { Button } from "@/components/ui/button";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronDown, Info } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Image from "next/image";
import { useMemo } from "react";

const CoreWorkMembers = () => {
    type Member = {
        name: string;
        image: string;
        productivity: string
        total_work: string;
    };

    const memberData = useMemo(
        () => [
            { name: "Kalki Noland", image: "https://avatar.iran.liara.run/public/18", productivity: "78%", total_work: "24:08:00" },
            { name: "Minakshi Devi", image: "https://avatar.iran.liara.run/public/25", productivity: "78%", total_work: "12:08:00" },
            { name: "Dani Wolvarin", image: "https://avatar.iran.liara.run/public/20", productivity: "35%", total_work: "08:00:00" },
            { name: "Alex Johnson", image: "https://avatar.iran.liara.run/public/22", productivity: "92%", total_work: "45:15:00" },
        ],
        []
    );
    const columns: ColumnDef<Member>[] = [
        {
            accessorKey: "name",
            // header: "Name",
            header: () => <div className="">Name</div>,
            cell: ({ row }) => {
                const name = row.getValue("name") as string
                const image = row.original.image
                return (
                    <div className="flex items-center gap-3 min-w-[160px]">
                        <Image
                            src={image}
                            width={100}
                            height={100}
                            alt={name}
                            className="rounded-full w-10"
                        />
                        <span className="font-medium">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "productivity",
            header: "Productivity",
        },
        {
            accessorKey: "total_work",
            header: () => <div className=" text-right">Total Work</div>,
            cell: ({ row }) => {
                const total_work = row.getValue("total_work") as string
                return (
                    <div className="">
                        <p className=" text-right">{total_work}</p>
                    </div>
                )
            }
        },
    ]

    const table = useReactTable({
        data: memberData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div>
            <div className=" flex items-center justify-between mt-5">
                <div className=" flex items-center gap-1.5 sm:gap-3 sm:w-1/2">
                    <h2 className="text-base sm:text-lg dark:text-darkTextPrimary">Core work members </h2>
                    <Info size={18} className=" cursor-pointer" />
                </div>
                <Button className=" text-sm md:text-base dark:text-darkTextSecondary" variant={'outline2'} size={'sm'}><span className=" hidden sm:block">Top Core worker</span><span className=" sm:hidden">Top worker</span> <ChevronDown size={20} /></Button>
            </div>
            <div className=" mt-5">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CoreWorkMembers;