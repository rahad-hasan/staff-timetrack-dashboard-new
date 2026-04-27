"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { deleteLeaveType, updateLeaveType } from "@/actions/leaves/action";
import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useLogInUserStore } from "@/store/logInUserStore";
import { ILeaveDetailsResponse, LeaveTypeRecord } from "@/types/type";
import LeaveTypeDetailsSheet from "./LeaveTypeDetailsSheet";
import LeaveTypeFormDialog from "./LeaveTypeFormDialog";
import LeaveTypeCard from "./PolicyCatalogCard";
import EmployeeLeaveCoverageList from "./EmployeeLeaveCoverageList";

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

  const [teamSearch, setTeamSearch] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | null>(null);
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);


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

      <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {policyCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
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

      <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
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
           {leaveTypes.map((leaveType) => (
            <LeaveTypeCard
              key={leaveType.id}
              leaveType={leaveType}
              resolvedCanEditLeaveTypes={resolvedCanEditLeaveTypes}
              handleOpenDetails={handleOpenDetails}
              handleEdit={handleEdit}
              handleDeleteType={handleDeleteType}
              handleToggleActive={handleToggleActive}
            />
        ))}
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

      <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
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
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
            <Input
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              placeholder="Search employee"
              className="h-10 pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
            />
          </div>
        </div>

        <EmployeeLeaveCoverageList filteredUsers={filteredUsers} />
      </div>
    </div>
  );
};

export default LeaveTypesBoard;