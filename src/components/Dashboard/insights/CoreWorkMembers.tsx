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
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DownArrow from "@/components/Icons/DownArrow";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  // CommandInput,
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


const CoreWorkMembers = () => {
  type Member = {
    name: string;
    image: string;
    productivity: string;
    total_work: string;
  };

  const memberData = useMemo(
    () => [
      {
        name: "Kalki Noland",
        image: "https://avatar.iran.liara.run/public/18",
        productivity: "78%",
        total_work: "24:08:00",
      },
      {
        name: "Minakshi Devi",
        image: "https://avatar.iran.liara.run/public/25",
        productivity: "73%",
        total_work: "12:08:00",
      },
      {
        name: "Minakshi Devi",
        image: "https://avatar.iran.liara.run/public/25",
        productivity: "78%",
        total_work: "12:08:00",
      },
    ],
    []
  );

  // const [visibleRows, setVisibleRows] = useState<Member[]>(memberData);

  // useEffect(() => {
  //   const handleResize = () => {
  //    if (window.innerWidth < 1640) {
  //       // Display only the first 5 members when screen width is below 1800px but above 1700px
  //       setVisibleRows(memberData.slice(0, 4));
  //     }
  //     else if (window.innerWidth < 1850) {
  //       // Display only the first 5 members when screen width is below 1800px but above 1700px
  //       setVisibleRows(memberData.slice(0, 5));
  //     } else {
  //       // Display all members when screen width is 1800px or above
  //       setVisibleRows(memberData);
  //     }
  //   };

  //   // Set initial state based on current window size
  //   handleResize();

  //   // Listen for window resize events
  //   window.addEventListener("resize", handleResize);

  //   // Cleanup listener on component unmount
  //   return () => window.removeEventListener("resize", handleResize);
  // }, [memberData]);
  // ;


  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      // header: "Name",
      header: () => <div className="">Name</div>,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const image = row.original.image;
        return (
          <div className="flex items-center gap-3 min-w-[160px]">
            <Avatar className="size-10">
              <AvatarImage src={image} alt={name}></AvatarImage>
              <AvatarFallback>UA</AvatarFallback>
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
      cell: ({ row }) => {
        const productivity = row.getValue("productivity") as string;
        return (
          <div className="">
            <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
              {productivity}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "total_work",
      header: () => <div className=" text-right">Total Work</div>,
      cell: ({ row }) => {
        const total_work = row.getValue("total_work") as string;
        return (
          <div className="">
            <p className=" text-right text-headingTextColor dark:text-darkTextPrimary">
              {total_work}
            </p>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: memberData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  // for dropdown
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("top-core-worker")

  const menuItems = [
    { value: "top-core-worker", label: "Top Core worker" },
    { value: "top-activity", label: "Top Activity" },
    { value: "low-activity", label: "Low Activity" },
  ];

  return (
    <div className="w-full border border-borderColor dark:border-darkBorder  dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
      <div className=" flex items-center justify-between">
        <div className=" flex items-center gap-1.5 sm:gap-3 sm:w-1/2">
          <h2 className=" text-base sm:text-lg uppercase text-headingTextColor dark:text-darkTextPrimary">
            Core work members{" "}
          </h2>
          {/* <Info size={18} className=" cursor-pointer" /> */}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="" asChild>
            <Button
              variant="outline2"
              role="combobox"
              aria-expanded={open}
              className="w-[170px] sm:w-[200px] h-9 flex justify-between items-center gap-2
            dark:border-darkBorder dark:text-darkTextPrimary
            dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
              >
              <span className="truncate">
                {value
                  ? menuItems.find((item: any) => item.value === value)?.label
                  : "Select item..."}
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
                      className="cursor-pointer hover:dark:bg-darkPrimaryBg flex items-center gap-2"
                      onSelect={(currentValue) => {
                        setValue(currentValue);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1">{item.label}</span>

                      <Check
                        className={cn(
                          "ml-auto",
                          value === item.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

      </div>

      <div className=" mt-5  pb-1">
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
                  );
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
