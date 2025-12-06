"use client";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  return (
    <div className="w-full border border-borderColor dark:border-darkBorder  dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
      <div className=" flex items-center justify-between">
        <div className=" flex items-center gap-1.5 sm:gap-3 sm:w-1/2">
          <h2 className=" text-base sm:text-lg uppercase text-headingTextColor dark:text-darkTextPrimary">
            Core work members{" "}
          </h2>
          {/* <Info size={18} className=" cursor-pointer" /> */}
        </div>
        <Button
          className=" text-sm md:text-base text-headingTextColor dark:text-darkTextSecondary"
          variant={"outline2"}
          size={"sm"}
        >
          <span className=" hidden sm:block">Top Core worker</span>
          <span className=" sm:hidden">Top worker</span>{" "}
          <ChevronDown size={20} />
        </Button>
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
