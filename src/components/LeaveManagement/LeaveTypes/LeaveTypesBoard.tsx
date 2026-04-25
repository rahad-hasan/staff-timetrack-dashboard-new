"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarRange,
  PencilLine,
  Plus,
  Power,
  Search,
  Sparkles,
  Trash2,
  Users2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteLeaveType, updateLeaveType } from "@/actions/leaves/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { YearPicker } from "@/components/Common/YearPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  formatApplicableGender,
  formatNoticeDays,
  getLeaveTypeTheme,
} from "@/lib/leave";
import { useLogInUserStore } from "@/store/logInUserStore";
import { ILeaveDetailsResponse, LeaveTypeRecord } from "@/types/type";
import LeaveTypeDetailsSheet from "./LeaveTypeDetailsSheet";
import LeaveTypeFormDialog from "./LeaveTypeFormDialog";

type LeaveTypesBoardProps = {
  leaveTypes: LeaveTypeRecord[];
  detailsData: ILeaveDetailsResponse;
  canEditLeaveTypes: boolean;
};

const LeaveTypesBoard = ({
  leaveTypes,
  detailsData,
  canEditLeaveTypes,
}: LeaveTypesBoardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();
  const logInUserRole = useLogInUserStore((state) => state.logInUserData?.role);
  const resolvedDetails = useMemo(
    () =>
      detailsData?.details ?? {
        year: new Date().getFullYear(),
        leave_types: [],
      },
    [detailsData],
  );
  const resolvedSummaryRows = useMemo(
    () => (Array.isArray(detailsData?.data) ? detailsData.data : []),
    [detailsData],
  );

  const currentSearch = searchParams.get("search") ?? "";
  const currentFilter = searchParams.get("is_active") ?? "all";
  const selectedYear = searchParams.get("year") || String(resolvedDetails.year);
  const resolvedCanEditLeaveTypes =
    canEditLeaveTypes || ["admin", "hr"].includes(logInUserRole ?? "");

  const [searchDraft, setSearchDraft] = useState(currentSearch);
  const [teamSearch, setTeamSearch] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | null>(null);
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);

  useEffect(() => {
    setSearchDraft(currentSearch);
  }, [currentSearch]);

  const tenantLeaveTypes = resolvedDetails.leave_types ?? [];
  const activePolicyCount = tenantLeaveTypes.filter((leaveType) => leaveType.is_active).length;
  const summaryTotals = resolvedSummaryRows.reduce(
    (acc, row) => {
      acc.allowed += row.total_allowed;
      acc.taken += row.total_taken;
      acc.remaining += row.total_remaining;
      acc.approvedHours += row.approved_leave_hours;
      return acc;
    },
    { allowed: 0, taken: 0, remaining: 0, approvedHours: 0 },
  );

  const filteredUsers = useMemo(() => {
    if (!teamSearch.trim()) return resolvedSummaryRows;

    return resolvedSummaryRows.filter((row) =>
      row.user.name.toLowerCase().includes(teamSearch.trim().toLowerCase()),
    );
  }, [resolvedSummaryRows, teamSearch]);

  const pushWithParams = (params: URLSearchParams) => {
    loader.start();
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (searchDraft.trim()) {
      params.set("search", searchDraft.trim());
    } else {
      params.delete("search");
    }

    pushWithParams(params);
  };

  const handleFilterChange = (value: "all" | "true" | "false") => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("is_active");
    } else {
      params.set("is_active", value);
    }

    pushWithParams(params);
  };

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    pushWithParams(params);
  };

  const handleCreate = () => {
    setFormMode("create");
    setEditingLeaveType(null);
    setFormOpen(true);
  };

  const handleEdit = (leaveType: LeaveTypeRecord) => {
    setFormMode("edit");
    setEditingLeaveType(leaveType);
    setFormOpen(true);
  };

  const handleOpenDetails = (leaveTypeId: number) => {
    setSelectedLeaveTypeId(leaveTypeId);
    setDetailsOpen(true);
  };

  const handleMutationSuccess = () => {
    setDetailsRefreshKey((value) => value + 1);
    router.refresh();
  };

  const handleDeleteType = async (leaveType: LeaveTypeRecord) => {
    const response = await deleteLeaveType(leaveType.id);

    if (response?.success) {
      toast.success(response.message || "Leave type deleted");
      if (selectedLeaveTypeId === leaveType.id) {
        setDetailsOpen(false);
      }
      handleMutationSuccess();
      return;
    }

    toast.error(response?.message || "Failed to delete leave type", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
  };

  const handleToggleActive = async (leaveType: LeaveTypeRecord, nextState: boolean) => {
    const response = await updateLeaveType(leaveType.id, {
      is_active: nextState,
    });

    if (response?.success) {
      toast.success(
        response.message ||
          (nextState ? "Leave type activated" : "Leave type deactivated"),
      );
      handleMutationSuccess();
      return;
    }

    toast.error(response?.message || "Failed to update leave type", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
  };

  const policyCards = [
    {
      label: "Visible policies",
      value: leaveTypes.length,
      helper: currentFilter === "all" ? "Current tenant result set" : "Current filtered state",
      color: "#7c3aed",
    },
    {
      label: "Active policies",
      value: activePolicyCount,
      helper: `${tenantLeaveTypes.length} total policies in ${resolvedDetails.year}`,
      color: "#059669",
    },
    {
      label: "Policies in use",
      value: leaveTypes.filter((leaveType) => leaveType.leave_requests_count > 0).length,
      helper: "Leave types already tied to requests",
      color: "#ea580c",
    },
    {
      label: "Approved hours",
      value: summaryTotals.approvedHours.toFixed(summaryTotals.approvedHours % 1 ? 1 : 0),
      helper: "Tracked across the tenant summary",
      color: "#0284c7",
    },
  ];

  const noResults =
    leaveTypes.length === 0 &&
    (Boolean(currentSearch.trim()) || currentFilter !== "all");

  return (
    <div className="space-y-6">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        {formOpen ? (
          <LeaveTypeFormDialog
            mode={formMode}
            initialData={editingLeaveType}
            onClose={() => {
              setFormOpen(false);
              setEditingLeaveType(null);
            }}
            onSuccess={handleMutationSuccess}
          />
        ) : null}
      </Dialog>

      <LeaveTypeDetailsSheet
        leaveTypeId={selectedLeaveTypeId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        canEditLeaveTypes={resolvedCanEditLeaveTypes}
        onEdit={handleEdit}
        onMutated={handleMutationSuccess}
        refreshKey={detailsRefreshKey}
      />

      <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
              Leave policy studio
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Tenant leave types
            </h2>
            <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              Manage real tenant-scoped leave types from the backend LeaveType API. Employees only consume active policies, while admin and HR can create, refine, retire, or delete them safely.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <YearPicker
              value={selectedYear}
              onYearChange={handleYearChange}
              startYear={new Date().getFullYear() - 1}
              endYear={new Date().getFullYear() + 1}
            />
            {resolvedCanEditLeaveTypes ? (
              <Button onClick={handleCreate}>
                <Plus className="size-4" />
                New type
              </Button>
            ) : (
              <div className="rounded-full bg-bgSecondary px-4 py-2 text-sm text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                This role has read-only access to leave types.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-[540px] gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search leave types by title"
                className="h-10 pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
              />
            </div>
            <Button type="submit" variant="outline2" className="dark:bg-darkPrimaryBg">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ].map((item) => {
              const isActive = currentFilter === item.value;
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? "default" : "outline2"}
                  className={!isActive ? "dark:bg-darkPrimaryBg" : ""}
                  onClick={() =>
                    handleFilterChange(item.value as "all" | "true" | "false")
                  }
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {policyCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-subTextColor">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
              {card.helper}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
              Holiday workspace
            </p>
            <h3 className="mt-2 text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Holidays are managed separately now
            </h3>
            <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              Open the dedicated holiday screen to add records manually, import source files, and
              review the year-specific holiday registry without mixing it into leave policy setup.
            </p>
          </div>

          <div className="rounded-[24px] border border-borderColor bg-bgSecondary/60 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <CalendarRange className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Holiday management
                </p>
                <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                  Use the dedicated submenu to manage holidays for {selectedYear}.
                </p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link href="/leave-management/holidays">
                Open holidays
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Policy catalog
            </h3>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Cards are powered by <code>/leaves/types</code> and show real backend policy rules.
            </p>
          </div>
          <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/15">
            Active types appear in employee request flows.
          </div>
        </div>

        {leaveTypes.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {leaveTypes.map((leaveType) => {
              const theme = getLeaveTypeTheme(leaveType.color_code);

              return (
                <div
                  key={leaveType.id}
                  className="rounded-[26px] border bg-white p-5 shadow-sm dark:bg-darkPrimaryBg"
                  style={{
                    borderColor: theme.borderColor,
                    boxShadow: `inset 0 1px 0 ${theme.backgroundColor}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <h4 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                          {leaveType.title}
                        </h4>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                          }}
                        >
                          {leaveType.days_allowed} days / year
                        </span>
                        <span className="rounded-full bg-bgSecondary px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                          {leaveType.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline2"
                      size="icon"
                      className="dark:bg-darkSecondaryBg"
                      onClick={() => handleOpenDetails(leaveType.id)}
                    >
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-subTextColor">
                    <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
                      <span>Applicable gender</span>
                      <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {formatApplicableGender(leaveType.applicable_gender)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
                      <span>Min notice</span>
                      <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {formatNoticeDays(leaveType.min_notice_days)}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em]">Attachment</p>
                        <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {leaveType.requires_document ? "Required" : "Optional"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-bgSecondary px-4 py-3 dark:bg-darkSecondaryBg">
                        <p className="text-xs uppercase tracking-[0.14em]">Requests tied</p>
                        <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {leaveType.leave_requests_count}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      variant="outline2"
                      className="dark:bg-darkSecondaryBg"
                      onClick={() => handleOpenDetails(leaveType.id)}
                    >
                      View details
                    </Button>

                    {resolvedCanEditLeaveTypes ? (
                      <Button
                        variant="outline2"
                        className="dark:bg-darkSecondaryBg"
                        onClick={() => handleEdit(leaveType)}
                      >
                        <PencilLine className="size-4" />
                        Edit
                      </Button>
                    ) : null}

                    {resolvedCanEditLeaveTypes ? (
                      leaveType.can_delete ? (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline2" className="dark:bg-darkSecondaryBg">
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          }
                          title={`Delete ${leaveType.title}?`}
                          description="This permanently removes the leave type from the tenant workspace."
                          confirmText="Delete"
                          cancelText="Keep"
                          onConfirm={() => handleDeleteType(leaveType)}
                        />
                      ) : (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline2" className="dark:bg-darkSecondaryBg">
                              <Power className="size-4" />
                              {leaveType.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          }
                          title={
                            leaveType.is_active
                              ? `Deactivate ${leaveType.title}?`
                              : `Activate ${leaveType.title}?`
                          }
                          description={
                            leaveType.is_active
                              ? "Historical requests will remain intact, but the type will disappear from employee request forms."
                              : "This will restore the leave type to employee request forms."
                          }
                          confirmText={leaveType.is_active ? "Deactivate" : "Activate"}
                          cancelText="Cancel"
                          onConfirm={() =>
                            handleToggleActive(leaveType, !leaveType.is_active)
                          }
                        />
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-borderColor px-6 py-16 text-center dark:border-darkBorder">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              {noResults
                ? "No leave types matched the current search or status filter."
                : "No leave types have been created for this workspace yet."}
            </div>
            <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
              {resolvedCanEditLeaveTypes
                ? "Create the first leave type to unlock policy-driven leave requests."
                : "Leave types will appear here as soon as an admin or HR user creates them."}
            </p>
            {resolvedCanEditLeaveTypes && !noResults ? (
              <Button className="mt-5" onClick={handleCreate}>
                <Plus className="size-4" />
                Create leave type
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-borderColor bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Employee leave coverage
            </h3>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Team-wide leave balances from <code>/leaves/details</code>, linked to each user’s leave history page.
            </p>
          </div>

          <div className="relative w-full xl:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor" />
            <Input
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              placeholder="Search employee"
              className="h-10 pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.length ? (
            filteredUsers.map((row) => (
              <div
                key={row.user.id}
                className="rounded-[24px] border border-borderColor bg-bgSecondary/50 p-5 dark:border-darkBorder dark:bg-darkPrimaryBg"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <Link
                    href={`/leave-management/user-leave-history/${row.user.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="size-11">
                      <AvatarImage src={row.user.image ?? ""} alt={row.user.name} />
                      <AvatarFallback>{row.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {row.user.name}
                      </p>
                      <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {row.user.email}
                      </p>
                    </div>
                  </Link>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                      <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                        Allowed
                      </p>
                      <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {row.total_allowed}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                      <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                        Taken
                      </p>
                      <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {row.total_taken}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                      <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                        Remaining
                      </p>
                      <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {row.total_remaining}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm dark:bg-darkSecondaryBg">
                      <p className="text-xs uppercase tracking-[0.14em] text-subTextColor">
                        Approved hours
                      </p>
                      <p className="mt-1 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                        {row.approved_leave_hours_formatted}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.leave_types.length ? (
                    row.leave_types.map((leaveType) => {
                      const theme = getLeaveTypeTheme(leaveType.color_code);

                      return (
                        <div
                          key={leaveType.id}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                          style={{
                            backgroundColor: theme.backgroundColor,
                            color: theme.textColor,
                          }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: theme.color }}
                          />
                          <span>{leaveType.title}</span>
                          <span className="opacity-70">
                            {leaveType.remaining}/{leaveType.allowed}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      <Users2 className="size-4" />
                      No leave type summary available for this user.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-darkSecondaryBg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <CalendarClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        Leave history detail
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        Open the employee’s dashboard-style leave history page.
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline2" className="dark:bg-darkPrimaryBg">
                    <Link href={`/leave-management/user-leave-history/${row.user.id}`}>
                      Open history
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-borderColor px-6 py-16 text-center text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
              No employees matched the current search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveTypesBoard;
