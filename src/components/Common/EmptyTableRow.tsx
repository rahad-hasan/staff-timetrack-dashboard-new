/* eslint-disable @typescript-eslint/no-explicit-any */
import EmptyTableLogo from "@/assets/empty_table.svg";
import { TableCell } from "../ui/table";
import Image from "next/image";

interface EmptyTableRowProps {
    columns: any;
    text: string;
}

const EmptyTableRow = ({ columns, text }: EmptyTableRowProps) => {
    return (
        <TableCell colSpan={columns.length} className="h-24 text-center">
            <div className=" flex flex-col gap-2.5 items-center justify-center py-8">
                <Image src={EmptyTableLogo} alt="table empty" width={150} height={150} />
                <p className=" sm:text-lg">{text}</p>
            </div>
        </TableCell>
    );
};

export default EmptyTableRow;