/* eslint-disable @typescript-eslint/no-explicit-any */
import EmptyTableLogo from "@/assets/empty_table.svg";
import { TableCell, TableRow } from "../ui/table";
import Image from "next/image";

interface EmptyTableRowProps {
    columns: any;
    text: string;
    padding?: number
}

const EmptyTableRow = ({ columns, text, padding }: EmptyTableRowProps) => {
    return (
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
                <div
                    className="flex flex-col items-center justify-center gap-2.5 py-8"
                    style={padding ? { paddingTop: `${padding * 0.25}rem`, paddingBottom: `${padding * 0.25}rem` } : undefined}
                >
                    <Image src={EmptyTableLogo} alt="table empty" width={120} height={120} />
                    <p className="sm:text-lg">{text}</p>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default EmptyTableRow;
