/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import FilterButton from "@/components/Common/FilterButton";
import { IRowAppsUrls } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import chrome_logo from '../../../assets/apps_logo/chrome_logo.png';
import figma_logo from '../../../assets/apps_logo/figma_logo.png';
import photoshop_logo from '../../../assets/apps_logo/photoshop_logo.png';
import premiere_pro_logo from '../../../assets/apps_logo/premiere_pro_logo.png';
import teams_logo from '../../../assets/apps_logo/teams_logo.png';
import time_tracker_logo from '../../../assets/apps_logo/time_tracker_logo.png';
import vs_code_logo from '../../../assets/apps_logo/vs_code_logo.png';
import zoom_logo from '../../../assets/apps_logo/zoom_logo.png';
import microsoft_office_word from '../../../assets/apps_logo/microsoft_office_word.png';
import postman_logo from '../../../assets/apps_logo/postman_logo.png';
import terminal_logo from '../../../assets/apps_logo/terminal_logo.png';
import Image from "next/image";

const APP_LOGOS: Record<string, any> = {
    chrome: chrome_logo,
    figma: figma_logo,
    photoshop: photoshop_logo,
    premiere: premiere_pro_logo,
    teams: teams_logo,
    tracker: time_tracker_logo,
    vscode: vs_code_logo,
    code: vs_code_logo,
    zoom: zoom_logo,
    office: microsoft_office_word,
    postman: postman_logo,
    terminal: terminal_logo,
};
const AppsAndUrl = ({ data }: { data: IRowAppsUrls[] }) => {

    const columns: ColumnDef<IRowAppsUrls>[] = [
        {
            accessorKey: "app_name",
            header: () => <div className="">App or Site</div>,
            cell: ({ row }) => {
                const name = row?.getValue("app_name") as string

                const lowerAppName = name.toLowerCase();
                const matchedKey = Object.keys(APP_LOGOS).find(key => lowerAppName.includes(key));
                const logoSrc = matchedKey ? APP_LOGOS[matchedKey] : null;

                return (
                    <div className="flex items-center gap-3 min-w-[160px]">
                        {logoSrc ? (
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                <Image
                                    src={logoSrc}
                                    alt={name}
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={""} />
                                <AvatarFallback>
                                    {name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold mb-1 capitalize text-headingTextColor dark:text-darkTextPrimary">{name?.length > 40 ? `${name.substring(0, 50)}...` : name}</span>
                            <span className="text-sm font-normal text-subTextColor dark:text-darkTextSecondary">App</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "today_duration",
            header: () => <div className="">Today</div>,
            cell: ({ row }) => {
                const today_duration = row?.original?.today_duration
                return (
                    <div className="flex items-center gap-3">
                        <span className="text-headingTextColor dark:text-darkTextPrimary">{today_duration}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "total_duration",
            header: () => <div className="text-center">This Week</div>,
            cell: ({ row }) => {
                const total_duration = row?.original?.total_duration
                return (
                    <div className="flex justify-center items-center">
                        <span className="text-headingTextColor dark:text-darkTextPrimary">{total_duration}</span>
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

    const MIN_ROWS = 5;
    const actualRows = table.getRowModel().rows;
    const emptyRowsCount = Math?.max(0, MIN_ROWS - actualRows?.length);

    return (
        <div className="w-full h-full border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary font-medium uppercase">APPS & URL</h2>
                <div className="flex items-center gap-3">
                    <FilterButton />
                    <Link href={`/activity/app`}>
                        <Button className="py-[14px] px-[16px] sm:py-[18px] sm:px-[20px] rounded-[8px]" size={'sm'}>View Report</Button>
                    </Link>
                </div>
            </div>

            <div className="mt-5">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
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

                        {actualRows?.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                        {actualRows?.length > 0 && emptyRowsCount > 0 &&
                            Array.from({ length: emptyRowsCount }).map((_, idx) => (
                                <TableRow key={`empty-${idx}`} className="hover:bg-transparent border-none">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-darkBorder/50" />
                                            <div className="flex flex-col gap-2">
                                                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-darkBorder/50" />
                                                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-darkBorder/30" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-darkBorder/50" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-darkBorder/50" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        }

                        {actualRows?.length === 0 && (
                            <EmptyTableRow columns={columns} text="No application data found." padding={10} />
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AppsAndUrl;