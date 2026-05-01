"use client";

import { format } from "date-fns";
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
import { toast } from "sonner";
import { deleteLeaveHoliday } from "@/actions/leaves/action";
import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IMeta, LeaveHoliday } from "@/types/type";
import MandatoryLeaveImportDialog from "./MandatoryLeaveImportDialog";
import HolidayFormDialog from "./HolidayFormDialog";
import HolidayTable from "./HolidayTable";
import AppPagination from "@/components/Common/AppPagination";
import CalendarIcon from "@/components/Icons/CalendarIcon";

type HolidayManagementBoardProps = {
  holidays: LeaveHoliday[];
  canManageHolidays: boolean;
  meta: IMeta
};

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
    return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-200";
  }

  if (normalized.includes("government")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";
  }

  if (normalized.includes("company")) {
    return "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200";
  }

  return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200";
}

const HolidayManagementBoard = ({
  holidays,
  canManageHolidays,
  meta,
}: HolidayManagementBoardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  const selectedYear = searchParams.get("year") || String(new Date().getFullYear());
  const [manualOpen, setManualOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingHoliday, setEditingHoliday] = useState<LeaveHoliday | null>(null);
  const [searchDraft, setSearchDraft] = useState("");

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

  const filteredHolidays = useMemo(() => {
    const normalizedSearch = searchDraft.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedHolidays;
    }

    return sortedHolidays.filter((holiday) =>
      [holiday.name, holiday.source, holiday.description, holiday.date]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [searchDraft, sortedHolidays]);

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

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingHoliday(null);
    setManualOpen(true);
  };

  const handleOpenEdit = (holiday: LeaveHoliday) => {
    setFormMode("edit");
    setEditingHoliday(holiday);
    setManualOpen(true);
  };

  const handleDeleteHoliday = async (holiday: LeaveHoliday) => {
    if (!holiday.id) {
      toast.error("This holiday cannot be deleted because its record id is missing.", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
      return;
    }

    const response = await deleteLeaveHoliday(holiday.id);

    if (response?.success) {
      toast.success(response.message || "Holiday deleted successfully.");
      handleMutated();
      return;
    }

    toast.error(response?.message || "Failed to delete holiday.", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
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
      helper:
        selectedYear === String(new Date().getFullYear())
          ? "Still ahead this year"
          : "Relative to today",
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
      <Dialog
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);

          if (!open) {
            setFormMode("create");
            setEditingHoliday(null);
          }
        }}
      >
        {manualOpen ? (
          <HolidayFormDialog
            mode={formMode}
            initialData={formMode === "edit" ? editingHoliday : null}
            selectedYear={selectedYear}
            onClose={() => {
              setManualOpen(false);
              setFormMode("create");
              setEditingHoliday(null);
            }}
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
        <div className="rounded-[12px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_45%,#fdf4ff_100%)] p-3 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                Holiday workspace
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Company and public holidays
              </h2>
              <p className="mt-3 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                A shared holiday registry for the whole workspace. Every user can review upcoming
                and past holidays here, while admin and HR maintain the records that feed leave
                calendars, planning, and upcoming holiday widgets.
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
                    onClick={handleOpenCreate}
                    className="dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
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
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                  Read-only access. Admin and HR can add, update, import, and delete holidays.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-2  rounded-full px-4 py-2 font-medium text-headingTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
              <CalendarIcon size={16} className="text-primary"/>
              {sortedHolidays.length} holiday{sortedHolidays.length === 1 ? "" : "s"} in {selectedYear}
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-primary dark:bg-primary/15">
              Everyone can review the holiday calendar
            </div>
            <div className="rounded-full px-4 py-2 text-subTextColor shadow-sm dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
              {canManageHolidays
                ? "Holiday changes sync across leave views immediately."
                : "Only admin and HR can change holiday records."}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                    {item.label}
                  </p>
                  <div
                    className="rounded-2xl p-2"
                    style={{ backgroundColor: `${item.accent}14`, color: item.accent }}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
                <p className=" text-3xl font-semibold" style={{ color: item.accent }}>
                  {item.value}
                </p>
                <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                  {item.helper}
                </p>
              </div>
            );
          })}
        </div>

        <HolidayTable
          filteredHolidays={filteredHolidays}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          selectedYear={selectedYear}
          canManageHolidays={canManageHolidays}
          handleOpenEdit={handleOpenEdit}
          handleDeleteHoliday={handleDeleteHoliday}
          getStatusVariant={getStatusVariant}
          getSourceTone={getSourceTone}
        />

        {
          meta?.total > 10 &&
          <AppPagination
            total={meta?.total}
            currentPage={meta.page}
            limit={meta?.limit}
          />
        }

      </div>
    </>
  );
};

export default HolidayManagementBoard;