"use client";

import { format, parseISO } from "date-fns";
import { Search, PencilLine, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import EditIcon from "@/components/Icons/FilterOptionIcon/EditIcon";
import { LeaveHoliday } from "@/types/type";

function formatHolidayDate(date: string) {
  try {
    return format(parseISO(date), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

type Props = {
  filteredHolidays: LeaveHoliday[];
  searchDraft: string;
  setSearchDraft: (val: string) => void;
  selectedYear: string;
  canManageHolidays: boolean;
  handleOpenEdit: (holiday: LeaveHoliday) => void;
  handleDeleteHoliday: (holiday: LeaveHoliday) => void;
  getStatusVariant: (holiday: LeaveHoliday, year: string) => string;
  getSourceTone: (source?: string | null) => string;
};

const HolidayTable = ({
  filteredHolidays,
  searchDraft,
  setSearchDraft,
  selectedYear,
  canManageHolidays,
  handleOpenEdit,
  handleDeleteHoliday,
  getStatusVariant,
  getSourceTone,
}: Props) => {
  const noMatches =
    Boolean(searchDraft.trim()) && filteredHolidays.length === 0;

  return (
        <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Holiday registry
              </h3>
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                Search, review, and maintain year-specific holiday records from a single tenant
                registry.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full min-w-[260px] sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search by name, source, date, or note"
                  className="pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
                />
              </div>
              <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/15">
                {filteredHolidays.length} result{filteredHolidays.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {filteredHolidays.length ? (
            <>
              <div className="grid gap-4 md:hidden">
                {filteredHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.id ?? holiday.date}-${holiday.name}-${index}`}
                    className="rounded-[24px] border border-borderColor bg-bgSecondary/50 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {holiday.name}
                        </p>
                        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                          {formatHolidayDate(holiday.date)}
                        </p>
                      </div>
                      <Badge className={getSourceTone(holiday.source)}>
                        {holiday.source || "unspecified"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-borderColor/70 bg-white px-3 py-3 dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Duration
                        </p>
                        <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {holiday.duration ?? 1} day{(holiday.duration ?? 1) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-borderColor/70 bg-white px-3 py-3 dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                          Status
                        </p>
                        <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {getStatusVariant(holiday, selectedYear)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-borderColor/70 bg-white px-3 py-3 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      {holiday.description || "No description provided."}
                    </div>

                    {canManageHolidays ? (
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline2"
                          size="sm"
                          disabled={!holiday.id}
                          onClick={() => handleOpenEdit(holiday)}
                          className="dark:bg-darkSecondaryBg"
                        >
                          <PencilLine className="size-4" />
                          Edit
                        </Button>
                        <ConfirmDialog
                          title={`Delete ${holiday.name}?`}
                          description="This removes the holiday from the workspace calendar and leave planning views."
                          confirmText="Delete"
                          trigger={
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={!holiday.id}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          }
                          onConfirm={() => handleDeleteHoliday(holiday)}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      {canManageHolidays ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.map((holiday, index) => (
                      <TableRow key={`${holiday.id ?? holiday.date}-${holiday.name}-${index}`}>
                        <TableCell className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {holiday.name}
                        </TableCell>
                        <TableCell>{formatHolidayDate(holiday.date)}</TableCell>
                        <TableCell>
                          {holiday.duration ?? 1} day{(holiday.duration ?? 1) === 1 ? "" : "s"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSourceTone(holiday.source)}>
                            {holiday.source || "unspecified"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusVariant(holiday, selectedYear)}</TableCell>
                        <TableCell className="max-w-[320px] whitespace-normal text-subTextColor">
                          {holiday.description || "-"}
                        </TableCell>
                        {canManageHolidays ? (
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className=" text-green-500 hover:text-green-500"
                                disabled={!holiday.id}
                                onClick={() => handleOpenEdit(holiday)}
                                aria-label={`Edit ${holiday.name}`}
                              >
                                <EditIcon size={20} />
                              </Button>
                              <ConfirmDialog
                                title={`Delete ${holiday.name}?`}
                                description="This removes the holiday from the workspace calendar and leave planning views."
                                confirmText="Delete"
                                trigger={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className=" text-red-500 hover:text-red-500"
                                    disabled={!holiday.id}
                                    aria-label={`Delete ${holiday.name}`}
                                  >
                                    <DeleteIcon size={25} />
                                  </Button>
                                }
                                onConfirm={() => handleDeleteHoliday(holiday)}
                              />
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : noMatches ? (
            <div className="rounded-[12px] border border-dashed border-borderColor px-6 py-16 text-center dark:border-darkBorder">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/15">
                <Search className="size-4" />
                No holiday matched &quot;{searchDraft.trim()}&quot;
              </div>
              <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                Try a different holiday name, source label, or description keyword.
              </p>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-borderColor px-6 py-16 text-center dark:border-darkBorder">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/15">
                <Sparkles className="size-4" />
                No holidays loaded for {selectedYear}
              </div>
              <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                {canManageHolidays
                  ? "Add the first holiday manually or import a structured file for this year."
                  : "An admin or HR user can create or import holidays for this year."}
              </p>
            </div>
          )}
        </div>
  );
};

export default HolidayTable;