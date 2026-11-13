/* eslint-disable @typescript-eslint/no-explicit-any */
import EmptyTableLogo from "@/assets/empty_table.svg";
import { TableCell } from "../ui/table";
import Image from "next/image";

interface EmptyStateProps {
    text: string;
    padding?: number;
}

interface EmptyTableRowProps extends EmptyStateProps {
    columns: any;
}

/**
 * The "nothing here" illustration and message, for anywhere that is not a
 * table: a card list, a grid, a panel.
 *
 * Lists used to borrow `EmptyTableRow` for this, which put a bare `<td>`
 * inside a `<div>`. The HTML parser drops a cell outside a table, so the
 * server markup never matched React's tree, and hydration failed (#418) on
 * every empty list.
 */
export const EmptyState = ({ text, padding }: EmptyStateProps) => {
    return (
        <div className={` flex flex-col gap-2.5 items-center justify-center text-center text-headingTextColor dark:text-darkTextPrimary ${padding ? `py-${padding}` : "py-8"} `}>
            <Image src={EmptyTableLogo} alt="table empty" width={120} height={120} />
            <p className=" sm:text-lg">{text}</p>
        </div>
    );
};

/**
 * `EmptyState` as one full-width table cell. A cell needs its row: render it
 * inside a `<TableRow>`, never straight in a `<TableBody>` (the parser invents
 * a row there, which mismatches hydration too) or outside a table (use
 * `EmptyState`).
 */
const EmptyTableRow = ({ columns, text, padding }: EmptyTableRowProps) => {
    return (
        <TableCell colSpan={columns.length} className="h-24 text-center">
            <EmptyState text={text} padding={padding} />
        </TableCell>
    );
};

export default EmptyTableRow;
