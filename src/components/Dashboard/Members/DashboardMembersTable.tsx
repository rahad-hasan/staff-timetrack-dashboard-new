"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import SmallChart from "@/components/Dashboard/SmallChart/SmallChart";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import FilterButton from "@/components/Common/FilterButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IMembersStatsDashboard } from "@/types/type";


const DashboardMembersTable = ({ data }: { data: IMembersStatsDashboard[] }) => {
    console.log('getting from members', data);
    // const columns: ColumnDef<Member>[] = [
    const columns: ColumnDef<IMembersStatsDashboard>[] = [
        {
            accessorKey: "name",
            // header: "Name",
            header: () => <div className="">Member info</div>,
            cell: ({ row }) => {
                const name = row?.getValue("name") as string
                const image = row?.original?.image ? row?.original?.image : ""
                const project = row?.original?.current_task?.project_name
                const task = row?.original?.current_task?.task_name
                return (
                    <div className="flex items-center gap-3 min-w-[220px]">

                        <Avatar>
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold mb-1">{name}</span>
                            <span className=" mb-1 font-normal text-headingTextColor dark:text-darkTextPrimary">{project}</span>
                            <span className=" text-xs font-normal text-subTextColor dark:text-darkTextSecondary">{task}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "today_work",
            header: () => <div className="">Today</div>,
            cell: ({ row }) => {
                const progress = row?.original?.today?.activity_percentage
                const today_work = row?.original?.today?.work_duration?.formatted

                const progressValue = progress;
                let bgColor = "bg-red-500";
                if (progressValue >= 75) {
                    bgColor = "bg-[#5db0f1]";
                } else if (progressValue >= 25) {
                    bgColor = "bg-yellow-500";
                }
                return (
                    <div className="flex gap-3 min-w-[80px]">
                        <div className="-mt-5">
                            <span className={` ${bgColor} rounded-full text-center text-white px-2 py-0.5 text-sm mb-1`}>{progress}%</span>
                            <p className="">{today_work}</p>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "week_work",
            header: () => <div className=" text-center">This Week</div>,
            cell: ({ row }) => {
                const progress = row?.original?.this_week?.activity_percentage
                const week_work = row?.original?.this_week?.work_duration?.formatted
                const lastActive = row?.original?.last_active

                const progressValue = progress;
                let bgColor = "bg-red-500";
                if (progressValue >= 75) {
                    bgColor = "bg-[#5db0f1]";
                } else if (progressValue >= 25) {
                    bgColor = "bg-yellow-500";
                }
                return (
                    <div className=" flex justify-end gap-0">
                        <div className=" flex flex-col items-start">
                            <span className={` ${bgColor} rounded-full text-center text-white px-2  text-sm mb-1`}>{progress}%</span>
                            <div className="flex flex-col">
                                <span className=" font-medium mb-1 text-headingTextColor dark:text-darkTextPrimary">{week_work}</span>
                                <span className=" font-normal text-xs text-subTextColor dark:text-darkTextSecondary">Last Active {lastActive}</span>
                            </div>
                        </div>
                        <div className=" ">
                            <SmallChart data={row?.original?.weekly_chart}></SmallChart>
                        </div>
                    </div>
                )
            }
        },
    ]

    const table = useReactTable({
        data: data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="w-full h-full border border-borderColor dark:border-darkBorder  dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" flex justify-between items-center">
                <h2 className=" text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">MEMBERS</h2>
                <div className=" flex items-center gap-3">
                    <FilterButton />
                    <Link href={`/teams`}>
                        <Button className="py-[14px] px-[16px] sm:py-[18px] sm:px-[20px] rounded-[8px]" size={'sm'}>All Member</Button>
                    </Link>
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

export default DashboardMembersTable;