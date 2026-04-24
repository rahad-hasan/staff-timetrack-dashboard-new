"use client";

import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  CalendarDays,
  CalendarRange,
  Clock3,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaveHoliday } from "@/types/type";
import MandatoryLeaveImportDialog from "../LeaveTypes/MandatoryLeaveImportDialog";
import HolidayFormDialog from "./HolidayFormDialog";

type HolidayManagementBoardProps = {
  holidays: LeaveHoliday[];
  canManageHolidays: boolean;
};

function formatHolidayDate(date: string) {
  try {
    return format(parseISO(date), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function getStatusVariant(holiday: LeaveHoliday, selectedYear: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const holidayYear = holiday.date.slice(0, 4);

  if (holidayYear > today.slice(0, 4)) {
    return "Upcoming";
  }

  if (holidayYear < today.slice(0, 4)) {
    return "Archived";
  }

  if (selectedYear !== today.slice(0, 4)) {
    return selectedYear > today.slice(0, 4) ? "Upcoming" : "Archived";
  }

  return holiday.date >= today ? "Upcoming" : "Past";
}

function getSourceTone(source?: string | null) {
  const normalized = source?.trim().toLowerCase();

  if (!normalized) {
    return "bg-slate-100 text-slate-700";
  }

  if (normalized.includes("government")) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (normalized.includes("company")) {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-amber-100 text-amber-800";
}

const HolidayManagementBoard = ({
  holidays,
  canManageHolidays,
}: HolidayManagementBoardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  const selectedYear = searchParams.get("year") || String(new Date().getFullYear());
  const [manualOpen, setManualOpen] = useState(false);
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

  const sourceCount = useMemo(
    () =>
      new Set(
        sortedHolidays
          .map((holiday) => holiday.source?.trim().toLowerCase())
          .filter(Boolean),
      ).size,
    [sortedHolidays],
  );

  const multiDayCount = useMemo(
    () => sortedHolidays.filter((holiday) => (holiday.duration ?? 1) > 1).length,
    [sortedHolidays],
  );

  const upcomingCount = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const currentYear = today.slice(0, 4);

    if (selectedYear > currentYear) {
      return sortedHolidays.length;
    }

    if (selectedYear < currentYear) {
      return 0;
    }

    return sortedHolidays.filter((holiday) => holiday.date >= today).length;
  }, [selectedYear, sortedHolidays]);

  const pushWithYear = (year: string) => {
    loader.start();
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleMutated = () => {
    router.refresh();
  };

  const stats = [
    {
      label: "Loaded holidays",
      value: sortedHolidays.length,
      helper: `Records available for ${selectedYear}`,
      accent: "#2563eb",
      icon: CalendarRange,
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      helper: selectedYear === String(new Date().getFullYear()) ? "Still ahead this year" : "Relative to today",
      accent: "#7c3aed",
      icon: Sparkles,
    },
    {
      label: "Multi-day",
      value: multiDayCount,
      helper: "Holidays spanning more than one day",
      accent: "#ea580c",
      icon: Clock3,
    },
    {
      label: "Unique sources",
      value: sourceCount,
      helper: "Distinct source labels in this view",
      accent: "#059669",
      icon: ShieldCheck,
    },
  ];

  return (
    <>
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        {manualOpen ? (
          <HolidayFormDialog
            selectedYear={selectedYear}
            onClose={() => setManualOpen(false)}
            onSuccess={handleMutated}
          />
        ) : null}
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        {importOpen ? (
          <MandatoryLeaveImportDialog
            onOpenChange={setImportOpen}
            selectedYear={selectedYear}
            onImported={handleMutated}
          />
        ) : null}
      </Dialog>

      <div className="space-y-6">
        <div className="rounded-[30px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_45%,#fdf4ff_100%)] p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
                Holiday workspace
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Company and public holidays
              </h2>
              <p className="mt-3 text-sm leading-6 text-subTextColor">
                Manage the holiday dataset that powers leave calendars, upcoming holiday widgets,
                and year-specific leave planning. Manual entries and parsed imports both resolve to
                the same holiday API.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <YearPicker
                value={selectedYear}
                onYearChange={pushWithYear}
                startYear={new Date().getFullYear() - 1}
                endYear={new Date().getFullYear() + 2}
              />
              {canManageHolidays ? (
                <>
                  <Button
                    variant="outline2"
                    onClick={() => setManualOpen(true)}
                    className="dark:bg-darkPrimaryBg"
                  >
                    <Plus className="size-4" />
                    Add manually
                  </Button>
                  <Button onClick={() => setImportOpen(true)}>
                    <Upload className="size-4" />
                    Import file
                  </Button>
                </>
              ) : (
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm text-subTextColor dark:bg-darkPrimaryBg">
                  Managers can review holidays here. Admin and HR can create or import them.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-headingTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
              <CalendarDays className="size-4 text-primary" />
              {sortedHolidays.length} holiday{sortedHolidays.length === 1 ? "" : "s"} in {selectedYear}
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-primary">
              Manual creation uses <code>/leaves/holidays</code>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-subTextColor shadow-sm dark:bg-darkPrimaryBg">
              Imports skip existing holidays automatically.
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor">
                    {item.label}
                  </p>
                  <div
                    className="rounded-2xl p-2"
                    style={{ backgroundColor: `${item.accent}14`, color: item.accent }}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-semibold" style={{ color: item.accent }}>
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-subTextColor">{item.helper}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Holiday registry
              </h3>
              <p className="text-sm text-subTextColor">
                Review each holiday with its source, duration, and year-specific status.
              </p>
            </div>
            <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
              Sorted by date and name
            </div>
          </div>

          {sortedHolidays.length ? (
            <>
              <div className="grid gap-4 md:hidden">
                {sortedHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.id ?? holiday.date}-${holiday.name}-${index}`}
                    className="rounded-[24px] border border-borderColor bg-bgSecondary/50 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {holiday.name}
                        </p>
                        <p className="mt-1 text-sm text-subTextColor">
                          {formatHolidayDate(holiday.date)}
                        </p>
                      </div>
                      <Badge className={getSourceTone(holiday.source)}>
                        {holiday.source || "unspecified"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-white px-3 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                          Duration
                        </p>
                        <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {holiday.duration ?? 1} day{(holiday.duration ?? 1) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                          Status
                        </p>
                        <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {getStatusVariant(holiday, selectedYear)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-3 py-3 text-sm text-subTextColor dark:bg-darkSecondaryBg">
                      {holiday.description || "No description provided."}
                    </div>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHolidays.map((holiday, index) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-borderColor px-6 py-16 text-center dark:border-darkBorder">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                No holidays loaded for {selectedYear}
              </div>
              <p className="mt-3 text-sm text-subTextColor">
                {canManageHolidays
                  ? "Add the first holiday manually or import a structured file for this year."
                  : "An admin or HR user can create or import holidays for this year."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HolidayManagementBoard;
