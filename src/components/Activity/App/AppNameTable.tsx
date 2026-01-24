/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
// import teamsLogo from '../../../assets/activity/teams-logo.png'
// import Image from "next/image";
// import {
//     Dialog,
//     DialogTrigger,
// } from "@/components/ui/dialog"
// import BlockAppModal from "./BlockAppModal";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { IApps } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
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
};

const AppNameTable = ({ data }: { data: IApps[] }) => {
    // const logInUserData = useLogInUserStore(state => state.logInUserData);
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    const columns: ColumnDef<IApps>[] = [

        {
            accessorKey: "app_name",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[160px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            App name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const appName = row.getValue("app_name") as string;
                // const image = row.original.image;
                const lowerAppName = appName.toLowerCase();

                // 2. Logic to find the matching logo
                const matchedKey = Object.keys(APP_LOGOS).find(key => lowerAppName.includes(key));
                const logoSrc = matchedKey ? APP_LOGOS[matchedKey] : null;
                return (
                    <div className="flex items-center gap-2">
                        {logoSrc ? (
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                <Image
                                    src={logoSrc}
                                    alt={appName}
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={""} />
                                <AvatarFallback>
                                    {appName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div className="">
                            <p className=" text-base font-bold text-headingTextColor dark:text-darkTextPrimary capitalize">{appName}</p>
                            <span className="font-normal text-subTextColor dark:text-darkTextSecondary">App</span>
                        </div>
                    </div>
                )
            }
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
                            User name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const name = row.original.user.name;
                const img = row.original.user.image;
                return (
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Avatar className=" w-9 h-9">
                            <AvatarImage src={img || undefined} alt={name} />
                            <AvatarFallback className="">
                                {name
                                    ?.trim()
                                    .split(" ")
                                    .map(word => word[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <span className="">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "projectName",
            header: ({ column }) => {
                return (
                    <div className="  min-w-[180px]">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Project name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {

                return (
                    <div className="flex items-center gap-2">
                        <span className=" font-medium">{row?.original?.project?.name}</span>
                    </div>
                );
            }
        },
        // {
        //     accessorKey: "session",
        //     header: ({ column }) => {
        //         return (
        //             <div>
        //                 <span
        //                     className=" cursor-pointer flex items-center gap-1"
        //                     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //                 >
        //                     Sessions
        //                     <ArrowUpDown className="ml-2 h-4 w-4" />
        //                 </span>
        //             </div>
        //         )
        //     },
        //     cell: ({ row }) => {
        //         const session = row.getValue("session") as string;

        //         return (
        //             <div className="flex items-center gap-2">
        //                 <span className=" bg-[#5db0f1] text-white rounded-2xl font-normal px-3 py-0.5">nai</span>
        //             </div>
        //         );
        //     }
        // },
        {
            accessorKey: "timeSpent",
            // header: () => <div className="">Time Worked</div>,
            header: ({ column }) => {
                return (
                    <div className="  min-w-[250px] flex justify-center">
                        <span
                            className=" cursor-pointer flex items-center gap-1"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Time spent
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </span>
                    </div>
                )
            },
            cell: ({ row }) => {
                // const time = row.original.time as string;
                // const isBlock = row.original.isBlock as boolean;
                // const isBlock = false
                return (
                    <div className=" flex justify-center">
                        <div className=" flex flex-col ">
                            <span className=" font-medium text-headingTextColor dark:text-darkTextPrimary">{row?.original?.duration}</span>
                            {/* <span className="text-sm font-thin text-subTextColor dark:text-darkTextSecondary">nai-nai</span> */}
                        </div>


                        {/* {
                            (logInUserData?.role === 'admin' ||
                                logInUserData?.role === 'manager' ||
                                logInUserData?.role === 'hr'
                            )
                            &&
                            <div className="flex justify-end">

                                {
                                    isBlock ?
                                        <button
                                            className={` w-[95px] py-2 flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer rounded-lg m-0.5 bg-[#fee6eb]  text-red-500  border-none"
                                `}
                                        >
                                            Unblock
                                        </button>
                                        :
                                        <Dialog>
                                            <form>
                                                <DialogTrigger asChild>
                                                    <button
                                                        className={` w-[95px] py-2 flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:text-darkTextSecondary dark:border-darkBorder border border-borderColor"
                                                `}
                                                    >
                                                        Block App
                                                    </button>
                                                </DialogTrigger>
                                                <BlockAppModal></BlockAppModal>
                                            </form>
                                        </Dialog>
                                }
                            </div>
                        } */}

                    </div>
                );
            },
        }
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
        <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg pb-4.5 rounded-[12px]">

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead className="first:rounded-bl-none last:rounded-br-none" key={header.id}>
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
                            <EmptyTableRow columns={columns} text="No App Activity found."></EmptyTableRow>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default AppNameTable;