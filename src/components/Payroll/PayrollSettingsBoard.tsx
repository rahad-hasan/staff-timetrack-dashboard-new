"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CalendarX2,
  Coins,
  PencilLine,
  Plus,
  Power,
  PowerOff,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useTopLoader } from "nextjs-toploader";

import { updatePayrollProfile } from "@/actions/payroll/action";
import AppPagination from "@/components/Common/AppPagination";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
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
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatPayrollMoney } from "@/lib/payroll";
import {
  EligibleUser,
  EmployeePayrollProfile,
  PayrollSummary,
} from "@/types/payroll";
import { IMeta } from "@/types/type";
import PayrollEmptyState from "./PayrollEmptyState";
import PayrollProfileFormDialog from "./PayrollProfileFormDialog";
import { ProfileActiveBadge, SalaryTypeBadge } from "./PayrollBadges";

type Tab = "all" | "active" | "inactive" | "not-configured";

interface PayrollSettingsBoardProps {
  profiles: EmployeePayrollProfile[];
  summary: PayrollSummary | null;
  eligibleUsers: EligibleUser[];
  eligibleMeta: IMeta;
  setupRoster: EligibleUser[];
  meta: IMeta;
  tab: string;
  search: string;
  currency: string;
}

const tryFormatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
};

const rateText = (profile: EmployeePayrollProfile) =>
  profile.salary_type === "monthly_fixed"
    ? `${formatPayrollMoney(profile.monthly_salary, profile.currency)} / mo`
    : `${formatPayrollMoney(profile.hourly_rate, profile.currency)} / hr`;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "all", label: "All profiles" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "not-configured", label: "Not configured" },
];

const PayrollSettingsBoard = ({
  profiles,
  summary,
  eligibleUsers,
  eligibleMeta,
  setupRoster,
  meta,
  tab,
  search: initialSearch,
  currency,
}: PayrollSettingsBoardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  const [search, setSearch] = useState(initialSearch);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<EmployeePayrollProfile | null>(null);
  const [presetUser, setPresetUser] = useState<EligibleUser | null>(null);

  const activeTab: Tab = (TABS.find((t) => t.id === tab)?.id ?? "all") as Tab;

  const setTab = (nextTab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    params.delete("page");
    const query = params.toString();
    loader.start();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Debounce the raw input, then reflect it into the URL as `?search=` so the
  // server component refetches profiles / eligible users filtered by the backend.
  // Comparing against the current URL value keeps this from pushing on mount or
  // looping once our own navigation lands.
  const debouncedSearch = useDebounce(search.trim(), 400);

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (debouncedSearch === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.delete("page");
    const query = params.toString();
    loader.start();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, loader, pathname, router, searchParams]);

  const stats = [
    {
      label: "Total profiles",
      value: summary?.with_active_profile ?? meta.total,
      helper: "Active payroll profiles in this workspace",
      accent: "#2563eb",
      icon: Users,
    },
    {
      label: "Without schedule",
      value: summary?.without_schedule ?? 0,
      helper: "Active employees with no schedule assigned",
      accent: "#d97706",
      icon: CalendarX2,
    },
    {
      label: "Not configured",
      value: summary?.without_active_profile ?? eligibleMeta.total,
      helper: "Active employees without a payroll profile",
      accent: "#dc2626",
      icon: UserPlus,
    },
    {
      label: "Members loaded",
      value: summary?.total_active_employees ?? 0,
      helper: "Active employees available for setup",
      accent: "#7c3aed",
      icon: Coins,
    },
  ];

  const handleOpenCreate = (member?: EligibleUser) => {
    setEditingProfile(null);
    setPresetUser(member ?? null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (profile: EmployeePayrollProfile) => {
    setEditingProfile(profile);
    setPresetUser(null);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProfile(null);
      setPresetUser(null);
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleToggleActive = async (profile: EmployeePayrollProfile) => {
    const nextActive = !profile.is_active;
    const response = await updatePayrollProfile(
      profile.id,
      { is_active: nextActive },
      profile.user_id,
    );

    if (response?.success) {
      toast.success(
        response.message ??
          (nextActive ? "Profile activated." : "Profile deactivated."),
      );
      router.refresh();
    } else {
      toast.error(
        response?.message ??
          (nextActive
            ? "Failed to activate profile."
            : "Failed to deactivate profile."),
      );
      throw new Error(response?.message ?? "Failed to update profile status.");
    }
  };

  return (
    <>
      <PayrollProfileFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSuccess={handleSuccess}
        mode={editingProfile ? "edit" : "create"}
        profile={editingProfile}
        presetUser={presetUser}
        members={setupRoster}
        defaultCurrency={currency}
      />

      <div className="space-y-6">
        <div className="rounded-[12px] border border-borderColor bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_45%,#fdf4ff_100%)] p-3 sm:p-5 dark:border-darkBorder dark:bg-[linear-gradient(135deg,rgba(50,57,71,1)_0%,rgba(33,39,51,1)_100%)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                Payroll workspace
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Employee payroll profiles
              </h2>
              <p className="mt-3 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                Payroll profiles drive every monthly salary calculation. Keep a
                single active profile per employee; when a salary changes,
                create a new profile so the audit trail stays intact.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button onClick={() => handleOpenCreate()}>
                <Plus className="size-4" />
                Add payroll profile
              </Button>
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
                    style={{
                      backgroundColor: `${item.accent}14`,
                      color: item.accent,
                    }}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>
                <p
                  className="text-3xl font-semibold"
                  style={{ color: item.accent }}
                >
                  {item.value}
                </p>
                <p className="mt-0.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                  {item.helper}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[12px] border border-borderColor p-3 sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-borderColor text-subTextColor hover:border-primary/40 hover:text-primary dark:border-darkBorder dark:text-darkTextSecondary",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
              />
            </div>
          </div>

          <div className="mt-5">
            {activeTab === "not-configured" ? (
              eligibleUsers.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleUsers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {member.name}
                        </TableCell>
                        <TableCell className="text-subTextColor dark:text-darkTextSecondary">
                          {member.email}
                        </TableCell>
                        <TableCell className="capitalize text-subTextColor dark:text-darkTextSecondary">
                          {member.role}
                        </TableCell>
                        <TableCell>
                          {member.has_schedule ? (
                            <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
                              Assigned
                            </span>
                          ) : (
                            <Link
                              href="/schedule"
                              title="This employee has no assigned Schedule. Payroll will use the default 8h/day. Click to assign."
                              className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-500 dark:text-amber-300"
                            >
                              <AlertTriangle className="size-3.5" />
                              Assign schedule
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline2"
                            onClick={() => handleOpenCreate(member)}
                          >
                            <Plus className="size-4" />
                            Set up payroll
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <PayrollEmptyState
                  text={
                    initialSearch
                      ? `No employees matched "${initialSearch}".`
                      : "Every active employee already has a payroll profile."
                  }
                />
              )
            ) : profiles.length ? (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Salary Type</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Overtime</TableHead>
                        <TableHead>Deduction</TableHead>
                        <TableHead>Effective</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => {
                        return (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1.5 font-medium text-headingTextColor dark:text-darkTextPrimary">
                                  {profile.user?.name ??
                                    `User #${profile.user_id}`}
                                  {!profile.has_schedule ? (
                                    <Link
                                      href="/schedule"
                                      title="This employee has no assigned Schedule. Payroll will use the default 8h/day. Click to assign."
                                      className="text-amber-600 hover:text-amber-500 dark:text-amber-300"
                                    >
                                      <AlertTriangle className="size-3.5" />
                                    </Link>
                                  ) : null}
                                </span>
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                  {profile.user?.email ?? "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <SalaryTypeBadge type={profile.salary_type} />
                            </TableCell>
                            <TableCell className="text-headingTextColor dark:text-darkTextPrimary">
                              {rateText(profile)}
                            </TableCell>
                            <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                              {profile.overtime_allow
                                ? `${profile.overtime_multiplier}× enabled`
                                : "Disabled"}
                            </TableCell>
                            <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                              {profile.salary_type === "monthly_fixed"
                                ? profile.is_deduct_salary
                                  ? "On short hours"
                                  : "None"
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                {tryFormatDate(profile.effective_from)}
                                {" → "}
                                {tryFormatDate(profile.effective_to)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <ProfileActiveBadge
                                isActive={profile.is_active}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleOpenEdit(profile)}
                                  aria-label={`Edit profile for ${profile.user?.name ?? profile.user_id}`}
                                  className="text-primary hover:text-primary"
                                >
                                  <PencilLine className="size-4" />
                                </Button>
                                <ConfirmDialog
                                  trigger={
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={
                                        profile.is_active
                                          ? `Deactivate profile for ${profile.user?.name ?? profile.user_id}`
                                          : `Activate profile for ${profile.user?.name ?? profile.user_id}`
                                      }
                                      className={
                                        profile.is_active
                                          ? "text-destructive hover:text-destructive"
                                          : "text-emerald-600 hover:text-emerald-600"
                                      }
                                    >
                                      {profile.is_active ? (
                                        <PowerOff className="size-4" />
                                      ) : (
                                        <Power className="size-4" />
                                      )}
                                    </Button>
                                  }
                                  title={
                                    profile.is_active
                                      ? "Deactivate this payroll profile?"
                                      : "Activate this payroll profile?"
                                  }
                                  description={
                                    profile.is_active
                                      ? "The profile will stop driving payroll calculations until it is activated again."
                                      : "This profile will resume driving payroll calculations for this employee."
                                  }
                                  confirmText={
                                    profile.is_active ? "Deactivate" : "Activate"
                                  }
                                  cancelText="Cancel"
                                  confirmClassName={
                                    profile.is_active
                                      ? undefined
                                      : "bg-emerald-600 hover:bg-emerald-600/90"
                                  }
                                  onConfirm={() => handleToggleActive(profile)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-subTextColor hover:text-primary"
                                >
                                  <Link
                                    href={`/payroll/settings/${profile.user_id}`}
                                  >
                                    History
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <ul className="space-y-3 md:hidden">
                  {profiles.map((profile) => {
                    return (
                      <li
                        key={profile.id}
                        className="rounded-[12px] border border-borderColor p-4 dark:border-darkBorder"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="inline-flex items-center gap-1.5 font-semibold text-headingTextColor dark:text-darkTextPrimary">
                              {profile.user?.name ?? `User #${profile.user_id}`}
                              {!profile.has_schedule ? (
                                <Link
                                  href="/schedule"
                                  title="No assigned Schedule. Payroll will use the default 8h/day. Click to assign."
                                  className="text-amber-600 dark:text-amber-300"
                                >
                                  <AlertTriangle className="size-3.5" />
                                </Link>
                              ) : null}
                            </p>
                            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                              {profile.user?.email ?? "—"}
                            </p>
                          </div>
                          <ProfileActiveBadge isActive={profile.is_active} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                              Type
                            </p>
                            <SalaryTypeBadge type={profile.salary_type} />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                              Rate
                            </p>
                            <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                              {rateText(profile)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                              Effective
                            </p>
                            <p className="text-subTextColor dark:text-darkTextSecondary">
                              {tryFormatDate(profile.effective_from)} →{" "}
                              {tryFormatDate(profile.effective_to)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline2"
                            size="sm"
                            onClick={() => handleOpenEdit(profile)}
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                type="button"
                                variant="outline2"
                                size="sm"
                                className={
                                  profile.is_active
                                    ? "text-destructive hover:text-destructive"
                                    : "text-emerald-600 hover:text-emerald-600"
                                }
                              >
                                {profile.is_active ? (
                                  <>
                                    <PowerOff className="size-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="size-4" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            }
                            title={
                              profile.is_active
                                ? "Deactivate this payroll profile?"
                                : "Activate this payroll profile?"
                            }
                            description={
                              profile.is_active
                                ? "The profile will stop driving payroll calculations until it is activated again."
                                : "This profile will resume driving payroll calculations for this employee."
                            }
                            confirmText={
                              profile.is_active ? "Deactivate" : "Activate"
                            }
                            cancelText="Cancel"
                            confirmClassName={
                              profile.is_active
                                ? undefined
                                : "bg-emerald-600 hover:bg-emerald-600/90"
                            }
                            onConfirm={() => handleToggleActive(profile)}
                          />
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/payroll/settings/${profile.user_id}`}>
                              History
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <PayrollEmptyState
                text={
                  initialSearch
                    ? `No profiles matched "${initialSearch}".`
                    : "No payroll profiles yet. Add the first one to get started."
                }
              />
            )}
          </div>
        </div>

        {activeTab === "not-configured"
          ? eligibleMeta?.total > eligibleMeta?.limit && (
              <AppPagination
                total={eligibleMeta.total}
                currentPage={eligibleMeta.page}
                limit={eligibleMeta.limit}
              />
            )
          : meta?.total > meta?.limit && (
              <AppPagination
                total={meta.total}
                currentPage={meta.page}
                limit={meta.limit}
              />
            )}
      </div>
    </>
  );
};

export default PayrollSettingsBoard;
