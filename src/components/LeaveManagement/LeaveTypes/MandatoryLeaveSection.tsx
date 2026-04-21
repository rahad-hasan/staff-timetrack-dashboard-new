"use client";

import { format, parseISO } from "date-fns";
import { CalendarRange, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { LeaveHoliday } from "@/types/type";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MandatoryLeaveImportDialog from "./MandatoryLeaveImportDialog";

type MandatoryLeaveSectionProps = {
  holidays: LeaveHoliday[];
  selectedYear: string;
  canImportMandatoryLeave: boolean;
  onImported: () => void | Promise<void>;
};

function formatHolidayDate(date: string) {
  try {
    return format(parseISO(date), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

const MandatoryLeaveSection = ({
  holidays,
  selectedYear,
  canImportMandatoryLeave,
  onImported,
}: MandatoryLeaveSectionProps) => {
  const [importOpen, setImportOpen] = useState(false);

  const sortedHolidays = useMemo(
    () =>
      [...holidays].sort((first, second) => {
        if (first.date === second.date) {
          return first.name.localeCompare(second.name);
        }

        return first.date.localeCompare(second.date);
      }),
    [holidays],
  );

  return (
    <>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        {importOpen ? (
          <MandatoryLeaveImportDialog
            onOpenChange={setImportOpen}
            selectedYear={selectedYear}
            onImported={onImported}
          />
        ) : null}
      </Dialog>

      <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
              Mandatory leave calendar
            </p>
            <h3 className="mt-2 text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Company holidays for {selectedYear}
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-subTextColor">
              These records are sourced from the backend Holiday model under the Leave module. New
              imports append valid holidays and skip rows that already exist for the selected year.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-sm font-medium text-primary">
              <CalendarRange className="size-4" />
              {sortedHolidays.length} holiday{sortedHolidays.length === 1 ? "" : "s"}
            </div>

            {canImportMandatoryLeave ? (
              <Button onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import mandatory leave
              </Button>
            ) : (
              <div className="rounded-full bg-bgSecondary px-4 py-2 text-sm text-subTextColor dark:bg-darkPrimaryBg">
                Managers can review holidays, but only admin and HR can import them.
              </div>
            )}
          </div>
        </div>

        {sortedHolidays.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHolidays.map((holiday, index) => (
                <TableRow
                  key={`${holiday.id ?? holiday.date}-${holiday.name}-${index}`}
                >
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell>{formatHolidayDate(holiday.date)}</TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal text-subTextColor">
                    {holiday.description || "-"}
                  </TableCell>
                  <TableCell>{holiday.source || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-[24px] border border-dashed border-borderColor px-6 py-16 text-center dark:border-darkBorder">
            <div className="mx-auto w-fit rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary">
              No holidays loaded for {selectedYear}
            </div>
            <p className="mt-3 text-sm text-subTextColor">
              {canImportMandatoryLeave
                ? "Import a source file to create the first mandatory leave records for this year."
                : "An admin or HR user can import the yearly mandatory leave file here."}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default MandatoryLeaveSection;
