/* eslint-disable @typescript-eslint/no-explicit-any */
import EmptyTableLogo from "@/assets/empty_table.svg";
import { TableCell } from "../ui/table";
import Image from "next/image";

interface EmptyTableRowProps {
    columns: any;
    text: string;
    padding?: number
}

const EmptyTableRow = ({ columns, text, padding }: EmptyTableRowProps) => {
    return (
        <TableCell colSpan={columns.length} className="h-24 text-center">
            <div className={` flex flex-col gap-2.5 items-center justify-center ${padding? `py-${padding}`: "py-8"} `}>
                <Image src={EmptyTableLogo} alt="table empty" width={120} height={120} />
                <p className=" sm:text-lg">{text}</p>
            </div>
        </TableCell>
    );
};

export default EmptyTableRow;