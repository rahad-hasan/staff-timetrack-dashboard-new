"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import {
  ArrowLeft,
  Plus,
} from "lucide-react";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLogInUserStore } from "@/store/logInUserStore";
import { canViewTeamLeave } from "@/lib/leave";
import {
  LeaveRecord,
  LeaveRequestTypeDropdownRecord,
  UserLeaveSummary,
} from "@/types/type";
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { DialogChunkPlaceholder } from "@/components/Common/DialogChunkPlaceholder";
import LeaveHistoryTable from "./LeaveHistoryTable";
import LeaveBalances from "./LeaveBalances";
import LeaveOverview from "./LeaveOverview";
import MyLeaveDetailsSheet from "./MyLeaveDetailsSheet";

// The request form (zod, react-hook-form, the calendar, Radix Select) is its
// own chunk, fetched when the dialog first opens instead of with every visit
// to the leave page. Hovering or focusing "New request" starts the download;
// the placeholder covers a click that beats it.
const importLeaveRequestModal = () => import("./LeaveRequestModal");
const loadLeaveRequestModal = loadOrReload(importLeaveRequestModal);
const LeaveRequestModal = dynamic(loadLeaveRequestModal, {
  ssr: false,
  loading: () => (
    <DialogChunkPlaceholder
      title="Request leave"
      titleClassName="text-headingTextColor dark:text-darkTextPrimary"
      className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto border-borderColor p-4 sm:max-w-[640px] sm:p-6 dark:border-darkBorder dark:bg-darkSecondaryBg"
    />
  ),
});

// The raw import, never the loader above: a warm-up must not reload the page.
const warmLeaveRequestModal = () => {
  importLeaveRequestModal().catch(() => {});
};

type MyLeavesDashboardProps = {
  data: UserLeaveSummary;
  leaveTypes: LeaveRequestTypeDropdownRecord[];
  currentUserId?: number;
  canManageUsers?: boolean;
  canManageLeaves?: boolean;
  users?: { id: string; label: string; avatar: string }[];
  allowRequestLeave?: boolean;
  headingTitle?: string;
  headingSubtitle?: string;
  showUserSelector?: boolean;
  backHref?: string;
  backLabel?: string;
};

const MyLeavesDashboard = ({
  data,
  leaveTypes,
  currentUserId,
  canManageUsers = false,
  canManageLeaves = false,
  users = [],
  allowRequestLeave,
  headingTitle,
  headingSubtitle,
  showUserSelector = true,
  backHref,
  backLabel = "Back",
}: MyLeavesDashboardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();
  const logInUserRole = useLogInUserStore((state) => state.logInUserData?.role);
  const resolvedCanManageUsers =
    canManageUsers || canViewTeamLeave(logInUserRole);

  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setSelectedLeave(null);
  }, [data]);

  const isSelfView = currentUserId === data.user.id;
  const canRequestLeave = allowRequestLeave ?? isSelfView;
  const selectedYear = searchParams.get("year") || String(data.year);

  const headerHeading =
    headingTitle ??
    (isSelfView ? "My Leaves" : `${data.user.name} Leave History`);

  const headerSubheading =
    headingSubtitle ??
    (isSelfView
      ? `Track your leave balances, policy rules, and request history for ${data.year}.`
      : `Review ${data.user.name}'s leave balances, policy coverage, and request history for ${data.year}.`);

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    params.delete("page");
    loader.start();
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const handleOpenRequest = (leaveTypeId?: number) => {
    if (!canRequestLeave) return;
    setSelectedLeaveTypeId(leaveTypeId ?? null);
    setRequestOpen(true);
  };

  return (
    <div className="space-y-6">
      <MyLeaveDetailsSheet
        leave={selectedLeave}
        user={data?.user}
        open={Boolean(selectedLeave)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeave(null);
          }
        }}
        canManageLeaves={canManageLeaves}
      />
      {/* No refresh after a request is filed or changed: leave writes
          revalidate, so the action's own response re-renders this page. */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        {requestOpen && canRequestLeave ? (
          <LeaveRequestModal
            leaveTypes={leaveTypes}
            defaultLeaveTypeId={selectedLeaveTypeId}
            onClose={() => setRequestOpen(false)}
          />
        ) : null}
      </Dialog>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          {backHref ? (
            <Button
              asChild
              variant="outline2"
              className="w-fit dark:bg-darkPrimaryBg"
            >
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
          <HeadingComponent
            heading={headerHeading}
            subHeading={headerSubheading}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <YearPicker
            value={selectedYear}
            onYearChange={handleYearChange}
            startYear={new Date().getFullYear() - 1}
            endYear={new Date().getFullYear() + 1}
          />
          {resolvedCanManageUsers && showUserSelector ? (
            <SelectUserDropDown users={users} defaultSelect={false} />
          ) : null}
          {canRequestLeave ? (
            <Button
              onClick={() => handleOpenRequest()}
              onPointerEnter={warmLeaveRequestModal}
              onFocus={warmLeaveRequestModal}
            >
              <Plus className="size-4" />
              New request
            </Button>
          ) : null}
        </div>
      </div>

      <LeaveOverview
        data={data}
        headingSubtitle={headingSubtitle}
        currentUserId={currentUserId}
      ></LeaveOverview>

      <LeaveBalances
        leaveTypes={data?.summary?.leave_types}
        handleOpenRequest={handleOpenRequest}
        canRequestLeave={canRequestLeave}
      >
      </LeaveBalances>

      <LeaveHistoryTable
        data={data}
        canManageUsers={canManageUsers}
        currentUserId={currentUserId}
        allowRequestLeave={allowRequestLeave}
        setSelectedLeave={setSelectedLeave}
      ></LeaveHistoryTable>

    </div>
  );
};

export default MyLeavesDashboard;