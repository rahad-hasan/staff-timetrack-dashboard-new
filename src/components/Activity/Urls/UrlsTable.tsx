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
// import teamsLogo from '../../../assets/activity/teams-logo.png'
// import Image from "next/image";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { IUrl } from "@/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UrlsTable = ({ data }: { data: IUrl[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<IUrl>[] = [
    {
      accessorKey: "url",
      header: ({ column }) => {
        return (
          <div className=" min-w-[120px]">
            <span
              className=" cursor-pointer flex items-center gap-1"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Site name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </span>
          </div>
        );
      },
      cell: ({ row }) => {
        const url = row.getValue("url") as string;
        // const image = row.original.image;
        return (
          <div className="flex items-center gap-2 min-w-[150px]">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={""} />
              <AvatarFallback>
                {/* {url.charAt(0)}{url.charAt(1)} */}
                Ur
              </AvatarFallback>
            </Avatar>
            <div className="">
              <p className=" text-sm font-bold text-headingTextColor dark:text-darkTextPrimary break-words whitespace-normal">
                {url}
              </p>
              <span className=" font-normal text-subTextColor dark:text-darkTextSecondary">
                Site
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
          <div>
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
        return (
          <div className=" flex flex-col">
            <span className=" font-medium text-headingTextColor dark:text-darkTextPrimary">
              {row?.original?.duration}
            </span>
            {/* <span className=" text-sm font-thin text-subTextColor dark:text-darkTextSecondary">nai - nai</span> */}
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
                text="No urls activity found."
              ></EmptyTableRow>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UrlsTable;
