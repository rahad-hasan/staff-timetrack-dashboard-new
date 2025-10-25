"use client"
import { EllipsisVertical } from "lucide-react";
import { useMemo } from "react";
import Image from "next/image";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import SmallChart from "@/components/Dashboard/SmallChart/SmallChart";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const Members = () => {
    type Member = {
        name: string;
        project: string;
        progress: string;
        task: string;
        lastActive: string;
        image: string;
        productivity: string
        today_work: string;
        week_work: string;
    };

    const memberData = useMemo(
        () => [
            { name: "Kalki Noland", project: "Orbit Technology's project", progress: "20%", task: "No task assigned", lastActive: "1h ago", image: "https://avatar.iran.liara.run/public/18", productivity: "78%", week_work: "24:08:00", today_work: "7:08:00" },
            { name: "Minakshi Devi", project: "Orbit Technology's project", progress: "75%", task: "No task assigned", lastActive: "1d ago", image: "https://avatar.iran.liara.run/public/25", productivity: "78%", week_work: "12:08:00", today_work: "4:00:00" },
            { name: "Dani Wolvarin", project: "Orbit Technology's project", progress: "100%", task: "No task assigned", lastActive: "5h ago", image: "https://avatar.iran.liara.run/public/20", productivity: "35%", week_work: "08:00:00", today_work: "5:12:00" },
            { name: "Alex Johnson", project: "Orbit Technology's project", progress: "50%", task: "No task assigned", lastActive: "3h ago", image: "https://avatar.iran.liara.run/public/22", productivity: "92%", week_work: "45:15:00", today_work: "8:05:00" },
        ],
        []
    );

    const columns: ColumnDef<Member>[] = [
        {
            accessorKey: "name",
            // header: "Name",
            header: () => <div className="">Member info</div>,
            cell: ({ row }) => {
                const name = row.getValue("name") as string
                const image = row.original.image
                const project = row.original.project
                const task = row.original.task
                return (
                    <div className="flex items-center gap-3 min-w-[220px]">
                        <Image
                            src={image}
                            width={100}
                            height={100}
                            alt={name}
                            className="rounded-full w-10"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium">{name}</span>
                            <span className="font-medium">{project}</span>
                            <span className="">{task}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "today_work",
            header: () => <div className="">Today</div>,
            cell: ({ row }) => {
                const progress = row.original.progress
                const today_work = row.original.today_work

                const progressValue = parseInt(progress.replace("%", ""));
                let bgColor = "bg-red-500";
                if (progressValue >= 75) {
                    bgColor = "bg-[#5db0f1]";
                } else if (progressValue >= 25) {
                    bgColor = "bg-yellow-500";
                }
                return (
                    <div className="flex items-center gap-3 min-w-[80px]">
                        <div className="flex flex-col">
                            <span className={` ${bgColor} rounded-full text-center text-white px-1  text-sm mb-0.5`}>{progress}</span>
                            <span className="">{today_work}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "week_work",
            header: () => <div className=" text-center">This Week</div>,
            cell: ({ row }) => {
                const progress = row.original.progress
                const week_work = row.original.week_work
                const lastActive = row.original.lastActive

                const progressValue = parseInt(progress.replace("%", ""));
                let bgColor = "bg-red-500";
                if (progressValue >= 75) {
                    bgColor = "bg-[#5db0f1]";
                } else if (progressValue >= 25) {
                    bgColor = "bg-yellow-500";
                }
                return (
                    <div className=" flex justify-end gap-0">
                        <div className=" flex flex-col items-start">
                            <span className={` ${bgColor} rounded-full text-center text-white px-2  text-sm mb-0.5`}>{progress}</span>
                            <div className="flex flex-col">
                                <span className=" font-semibold">{week_work}</span>
                                <span className="">Last Active {lastActive}</span>
                            </div>
                        </div>
                        <div className="">
                            <SmallChart></SmallChart>
                        </div>
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
        <div className=" border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px] w-full">
            <div className=" flex justify-between items-center">
                <h2 className=" text-md sm:text-lg dark:text-darkTextPrimary">MEMBERS</h2>
                <div className=" flex items-center gap-3">
                    <Button className=" text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                    <Button className=" text-sm md:text-base " size={'sm'}>All Member</Button>
                </div>
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

export default Members;