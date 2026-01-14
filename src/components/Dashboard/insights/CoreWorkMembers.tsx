/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DownArrow from "@/components/Icons/DownArrow";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ICoreMember } from "@/types/type";
import EmptyTableRow from "@/components/Common/EmptyTableRow";

const CoreWorkMembers = ({ data= [] }: { data: ICoreMember[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    router.push(`?${params.toString()}`);
  };

  const columns: ColumnDef<ICoreMember>[] = [
    {
      accessorKey: "name",
      header: () => <div className="">Name</div>,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const image = row.original.image ? row.original.image : "";
        return (
          <div className="flex items-center gap-3 min-w-[160px]">
            <Avatar className="size-10">
              <AvatarImage src={image} alt={name}></AvatarImage>
              <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-headingTextColor dark:text-darkTextPrimary">
              {name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "productivity",
      header: "Productivity",
      cell: ({ row }) => (
        <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
          {row?.original?.activity}%
        </p>
      ),
    },
    {
      accessorKey: "total_work",
      header: () => <div className="text-right">Total Work</div>,
      cell: ({ row }) => (
        <p className="text-right text-headingTextColor dark:text-darkTextPrimary">
          {row?.original?.work_duration?.formatted}
        </p>
      ),
    },
  ];

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("highest");

  const menuItems = [
    { value: "highest", label: "Top Activity" },
    { value: "lowest", label: "Low Activity" },
  ];

  // LOGIC: Calculate how many empty rows are needed to reach 4
  const MIN_ROWS = 3;
  const actualRows = table?.getRowModel()?.rows;
  const emptyRowsCount = Math.max(0, MIN_ROWS - actualRows.length);

  return (
    <div className="w-full border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px] h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-3 sm:w-1/2">
          <h2 className="text-base sm:text-lg uppercase text-headingTextColor dark:text-darkTextPrimary">
            Core work members
          </h2>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline2"
              className="w-[170px] sm:w-[200px] h-9 flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
            >
              <span className="truncate">
                {value ? menuItems.find((item: any) => item.value === value)?.label : "Select item..."}
              </span>
              <DownArrow size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[170px] sm:w-[200px] px-0 py-1 dark:bg-darkSecondaryBg">
            <Command className="dark:bg-darkSecondaryBg">
              <CommandList>
                <CommandEmpty>No item found.</CommandEmpty>
                <CommandGroup>
                  {menuItems.map((item: any) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        setType(currentValue);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1">{item.label}</span>
                      <Check className={cn("ml-auto", value === item.value ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-5 pb-1">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* 1. Render Actual Data */}
            {actualRows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* 2. Render Static Skeletons (No Pulse) to fill space */}
            {emptyRowsCount > 0 && actualRows?.length !== 0 &&
              Array.from({ length: emptyRowsCount }).map((_, idx) => (
                <TableRow key={`empty-${idx}`} className="hover:bg-transparent">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gray-100 dark:bg-darkBorder" />
                      <div className="h-4 w-24 rounded bg-gray-100 dark:bg-darkBorder" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 rounded bg-gray-100 dark:bg-darkBorder" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 ml-auto rounded bg-gray-100 dark:bg-darkBorder" />
                  </TableCell>
                </TableRow>
              ))}

            {/* 3. Render "No results" only if data is empty AND we weren't trying to fill up to 4 */}
            {actualRows.length === 0 && (
              <TableRow>
                <EmptyTableRow columns={columns} text="No core members available." padding={2}></EmptyTableRow>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CoreWorkMembers;