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
import microsoft_powerPoint from '../../../assets/apps_logo/microsoft_powerPoint.png';
import edge from '../../../assets/apps_logo/microsoft_edge.png';
import microsoft_excel from '../../../assets/apps_logo/microsoft_excel.png';
import notepad from '../../../assets/apps_logo/notepad.png';
import adobe_acrobat from '../../../assets/apps_logo/adobe_acrobat.png';
import adobe_illustrator from '../../../assets/apps_logo/adobe_illustrator.png';
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
    word: microsoft_office_word,
    postman: postman_logo,
    terminal: terminal_logo,
    command: terminal_logo,
    powerpoint: microsoft_powerPoint,
    edge: edge,
    excel: microsoft_excel,
    notepad: notepad,
    acrobat: adobe_acrobat,
    illustrator: adobe_illustrator,
};
/**
 * The dashboard's top apps and sites over the selected period.
 *
 * The API answers each tab with its own window (`daily` is today alone,
 * `weekly` the last 7 days, `monthly` the last 30), so the totals column is
 * headed with the period it actually covers. It used to say "This Week" over
 * every window, the default Daily view included.
 */
const AppsAndUrl = ({
    data,
    rangeLabel,
    showToday,
}: {
    data: IRowAppsUrls[];
    /** Header of the totals column: "Today", "Last 7 Days" or "Last 30 Days". */
    rangeLabel: string;
    /**
     * False when the period IS today: a "Today" column next to it would only
     * repeat the totals.
     */
    showToday: boolean;
}) => {

    const todayColumn: ColumnDef<IRowAppsUrls> = {
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
    };

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
        ...(showToday ? [todayColumn] : []),
        {
            accessorKey: "total_duration",
            header: () => <div className="text-center">{rangeLabel}</div>,
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
        data: data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const MIN_ROWS = 5;
    const actualRows = table.getRowModel().rows;
    const emptyRowsCount = Math?.max(0, MIN_ROWS - actualRows?.length);

    return (
        <div className="w-full h-full border border-borderColor/60 dark:border-darkBorder/50 dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary font-medium uppercase">APPS & URL</h2>
                <div className="flex items-center gap-3">
                    <FilterButton />
                    <Link href={`/activity/apps`}>
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
                                    {showToday && (
                                        <TableCell>
                                            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-darkBorder/50" />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-darkBorder/50" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        }

                        {/* A cell needs its row: straight in the body, the parser
                            invents one and the server HTML no longer matches. */}
                        {actualRows?.length === 0 && (
                            <TableRow>
                                <EmptyTableRow columns={columns} text="No application data found." padding={10} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AppsAndUrl;