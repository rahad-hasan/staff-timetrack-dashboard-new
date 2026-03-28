/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { IApp } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import chrome_logo from "../../../assets/apps_logo/chrome_logo.png";
import figma_logo from "../../../assets/apps_logo/figma_logo.png";
import photoshop_logo from "../../../assets/apps_logo/photoshop_logo.png";
import premiere_pro_logo from "../../../assets/apps_logo/premiere_pro_logo.png";
import teams_logo from "../../../assets/apps_logo/teams_logo.png";
import time_tracker_logo from "../../../assets/apps_logo/time_tracker_logo.png";
import vs_code_logo from "../../../assets/apps_logo/vs_code_logo.png";
import zoom_logo from "../../../assets/apps_logo/zoom_logo.png";
import microsoft_office_word from "../../../assets/apps_logo/microsoft_office_word.png";
import postman_logo from "../../../assets/apps_logo/postman_logo.png";
import terminal_logo from "../../../assets/apps_logo/terminal_logo.png";
import microsoft_powerPoint from "../../../assets/apps_logo/microsoft_powerPoint.png";
import edge from "../../../assets/apps_logo/microsoft_edge.png";
import microsoft_excel from "../../../assets/apps_logo/microsoft_excel.png";
import notepad from "../../../assets/apps_logo/notepad.png";
import adobe_acrobat from "../../../assets/apps_logo/adobe_acrobat.png";
import adobe_illustrator from "../../../assets/apps_logo/adobe_illustrator.png";

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

const AppNameTable = ({ data }: { data: IApp[] }) => {
  // const logInUserData = useLogInUserStore(state => state.logInUserData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<IApp>[] = [
    {
      accessorKey: "app_name",
      header: ({ column }) => {
        return (
          <div className=" min-w-[120px] max-w-[190px]">
            <span
              className=" cursor-pointer flex items-center gap-1"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              App name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
          </div>
        );
      },
      cell: ({ row }) => {
        const appName = row.getValue("app_name") as string;
        // const image = row.original.image;
        const lowerAppName = appName.toLowerCase();

        // 2. Logic to find the matching logo
        const matchedKey = Object.keys(APP_LOGOS).find((key) =>
          lowerAppName.includes(key),
        );
        const logoSrc = matchedKey ? APP_LOGOS[matchedKey] : null;
        return (
          <div className="flex items-center gap-2 min-w-[120px] max-w-[190px]">
            {logoSrc ? (
              <div className="w-9 h-9 flex items-center justify-center ">
                <Image
                  src={logoSrc}
                  alt={appName}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
            ) : (
              <Avatar className="w-9 h-9 ">
                <AvatarImage src={""} />
                <AvatarFallback>{appName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}

            <div className="">
              <p className=" text-base font-bold text-headingTextColor dark:text-darkTextPrimary capitalize">
                {appName}
              </p>
              <span className="font-normal text-subTextColor dark:text-darkTextSecondary">
                App
              </span>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "session",
      header: ({ column }) => {
        return (
          <div className="">
            <span
              className=" cursor-pointer flex items-center gap-1"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Session
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <span className=" font-medium">{row?.original?.session}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      // header: () => <div className="">Time Worked</div>,
      header: ({ column }) => {
        return (
          <div className="  min-w-[100px] flex justify-center">
            <span
              className=" cursor-pointer flex items-center gap-1"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Time spent
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
          </div>
        );
      },
      cell: ({ row }) => {
        // const time = row.original.time as string;
        // const isBlock = row.original.isBlock as boolean;
        // const isBlock = false
        return (
          <div className=" flex justify-center">
            <div className=" flex flex-col ">
              <span className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
                {row?.original?.duration}
              </span>
              {/* <span className="text-sm font-thin text-subTextColor dark:text-darkTextSecondary">nai-nai</span> */}
            </div>
          </div>
        );
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
    <div className="mt-5 border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg pb-4.5 rounded-[12px]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="first:rounded-bl-none last:rounded-br-none"
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <EmptyTableRow
                columns={columns}
                text="No App Activity found."
              ></EmptyTableRow>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppNameTable;
