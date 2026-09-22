"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  BriefcaseBusiness,
  ChevronDownIcon,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getLeaveTypes, updateLeaveRequest } from "@/actions/leaves/action";
import {
  LeaveRecord,
  LeaveType,
  LeaveTypeRecord,
  UpdateLeaveRequestPayload,
} from "@/types/type";
import { LeaveEditFormValues, leaveRequestEditSchema } from "@/zod/schema";
import {
  formatApplicableFor,
  formatApplicableGender,
  formatNoticeDays,
  getLeaveTypeTheme,
  isoDateToLocalDate,
} from "@/lib/leave";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

type LeaveEditDialogProps = {
  leave: LeaveRecord;
  ownerGender?: string;
  ownerName: string;
  onClose: () => void;
  onSuccess: () => void;
};

type LeaveTypesState = "idle" | "loading" | "ready" | "error";

const ERROR_TOAST_STYLE = {
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
};

const LeaveEditDialog = ({
  leave,
  ownerGender,
  ownerName,
  onClose,
  onSuccess,
}: LeaveEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [typesState, setTypesState] = useState<LeaveTypesState>("idle");
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRecord[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const form = useForm<LeaveEditFormValues>({
    resolver: zodResolver(leaveRequestEditSchema),
    defaultValues: {
      leaveTypeId: String(leave.leave_type_id),
      startDate: isoDateToLocalDate(leave.start_date),
      endDate: isoDateToLocalDate(leave.end_date),
      reason: leave.reason ?? "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    setTypesState("loading");

    const load = async () => {
      try {
        const response = await getLeaveTypes({ is_active: true });
        if (cancelled) return;

        if (response?.success && Array.isArray(response.data)) {
          setLeaveTypes(response.data);
          setTypesState("ready");
          return;
        }

        throw new Error(response?.message || "Could not load leave types");
      } catch (error) {
        if (cancelled) return;

        setTypesState("error");
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : "Could not load leave types",
          { style: ERROR_TOAST_STYLE },
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const selectedLeaveTypeId = form.watch("leaveTypeId");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // The current type is always selectable, even when the active-types list
  // has not loaded, failed, or no longer contains it (retired type).
  const typeOptions = useMemo<LeaveType[]>(() => {
    const options: LeaveType[] = leaveTypes ?? [];
    const currentType = leave.leaveType;

    if (!currentType) return options;
    if (options.some((leaveType) => leaveType.id === currentType.id)) {
      return options;
    }

    const current: LeaveType =
      leaveTypes === null ? currentType : { ...currentType, is_active: false };

    return [current, ...options];
  }, [leaveTypes, leave.leaveType]);

  const selectedLeaveType = useMemo(
    () =>
      typeOptions.find(
        (leaveType) => String(leaveType.id) === String(selectedLeaveTypeId),
      ),
    [typeOptions, selectedLeaveTypeId],
  );

  const isApplicable = (leaveType: LeaveType) =>
    !ownerGender ||
    leaveType.applicable_gender === "all" ||
    leaveType.applicable_gender === ownerGender;

  const docBlocked = Boolean(
    selectedLeaveType &&
      selectedLeaveType.id !== leave.leave_type_id &&
      selectedLeaveType.requires_document &&
      !leave.document,
  );

  const isEndDateDisabled = useMemo(() => {
    if (!startDate) return undefined;
    const bound = startOfDay(startDate);
    return (date: Date) => date < bound;
  }, [startDate]);

  async function onSubmit(values: LeaveEditFormValues) {
    if (loading) return;

    const payload: UpdateLeaveRequestPayload = {};
    const nextLeaveTypeId = Number(values.leaveTypeId);
    const nextStartDate = format(values.startDate!, "yyyy-MM-dd");
    const nextEndDate = format(values.endDate!, "yyyy-MM-dd");
    const nextReason = values.reason.trim();

    if (nextLeaveTypeId !== leave.leave_type_id) {
      payload.leave_type_id = nextLeaveTypeId;
    }
    if (nextStartDate !== leave.start_date.slice(0, 10)) {
      payload.start_date = nextStartDate;
    }
    if (nextEndDate !== leave.end_date.slice(0, 10)) {
      payload.end_date = nextEndDate;
    }
    if (nextReason !== (leave.reason ?? "").trim()) {
      payload.reason = nextReason;
    }

    if (!Object.keys(payload).length) {
      toast.info("No changes to save");
      onClose();
      return;
    }

    setLoading(true);

    const response = await updateLeaveRequest(leave.id, payload);

    if (response?.success) {
      toast.success(response.message || "Leave request updated");
      onSuccess();
      onClose();
      return;
    }

    toast.error(response?.message || "Failed to update leave request", {
      style: ERROR_TOAST_STYLE,
    });
    setLoading(false);
  }

  const theme = getLeaveTypeTheme(selectedLeaveType?.color_code);

  return (
    <DialogContent
      onInteractOutside={(event) => event.preventDefault()}
      className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto border-borderColor p-4 sm:max-w-[640px] sm:p-6 dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <DialogHeader>
        <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
          Edit leave request
        </DialogTitle>
        <DialogDescription className="dark:text-darkTextSecondary">
          Correct the leave type, dates, or reason for {ownerName}. Balance and
          overlap checks run again on save.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-5"
        >
          <FormField
            control={form.control}
            name="leaveTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Leave type</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={typesState === "loading"}
                  >
                    <SelectTrigger className="w-full dark:bg-darkPrimaryBg">
                      <SelectValue placeholder="Choose a leave type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-darkSecondaryBg">
                      {typeOptions.map((leaveType) => {
                        const itemTheme = getLeaveTypeTheme(
                          leaveType.color_code,
                        );
                        // The current type must stay selectable even if its
                        // rules changed since the leave was filed.
                        const applicable =
                          leaveType.id === leave.leave_type_id ||
                          isApplicable(leaveType);

                        return (
                          <SelectItem
                            key={leaveType.id}
                            value={String(leaveType.id)}
                            disabled={!applicable}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: itemTheme.color }}
                              />
                              <span>{leaveType.title}</span>
                              {!leaveType.is_active ? (
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                  (inactive)
                                </span>
                              ) : null}
                              {!applicable ? (
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                  Not applicable for {ownerGender}
                                </span>
                              ) : null}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
                {typesState === "loading" ? (
                  <FormDescription className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading leave types...
                  </FormDescription>
                ) : null}
                {typesState === "error" ? (
                  <FormDescription className="flex flex-wrap items-center gap-1 text-subTextColor dark:text-darkTextSecondary">
                    Could not load leave types.
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-1"
                      onClick={() => setReloadKey((key) => key + 1)}
                    >
                      Retry
                    </Button>
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedLeaveType ? (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: theme.borderColor,
                backgroundColor: theme.backgroundColor,
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    {selectedLeaveType.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLeaveType.requires_document ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                      <FileText className="size-3.5" aria-hidden />
                      Requires document
                    </span>
                  ) : null}
                  {selectedLeaveType.applicable_gender !== "all" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      {formatApplicableGender(
                        selectedLeaveType.applicable_gender,
                      )}
                    </span>
                  ) : null}
                  {selectedLeaveType.applicable_for &&
                  selectedLeaveType.applicable_for !== "all" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                      <BriefcaseBusiness className="size-3.5" aria-hidden />
                      {formatApplicableFor(selectedLeaveType.applicable_for)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/80 px-4 py-3 dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                    Min notice
                  </p>
                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatNoticeDays(selectedLeaveType.min_notice_days)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-3 dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                    Back-dated requests
                  </p>
                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {selectedLeaveType.allow_past_dates ? "Allowed" : "Blocked"}
                  </p>
                </div>
              </div>

              {docBlocked ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                  This type requires a supporting document and this request has
                  none. Ask the employee to submit a new request with a
                  document.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel required>Start date</FormLabel>
                  <FormControl>
                    <Popover
                      open={openStartDate}
                      onOpenChange={setOpenStartDate}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline2"
                          className="w-full justify-between text-left font-normal dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                        >
                          {startDate
                            ? format(startDate, "dd MMM yyyy")
                            : "Pick a start date"}
                          <ChevronDownIcon aria-hidden />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={startDate ?? undefined}
                          defaultMonth={startDate ?? undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            // Re-clicking the selected day emits undefined
                            // (single-mode toggle); keep the current value.
                            if (date) field.onChange(date);
                            setOpenStartDate(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel required>End date</FormLabel>
                  <FormControl>
                    <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline2"
                          className="w-full justify-between text-left font-normal dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                        >
                          {endDate
                            ? format(endDate, "dd MMM yyyy")
                            : "Pick an end date"}
                          <ChevronDownIcon aria-hidden />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={endDate ?? undefined}
                          defaultMonth={endDate ?? startDate ?? undefined}
                          captionLayout="dropdown"
                          disabled={isEndDateDisabled}
                          onSelect={(date) => {
                            if (date) field.onChange(date);
                            setOpenEndDate(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Reason</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[110px] dark:border-darkBorder dark:bg-darkPrimaryBg"
                    placeholder="Explain the context for this leave request"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline2"
                className="w-full dark:bg-darkPrimaryBg dark:text-darkTextPrimary sm:w-auto"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading || !form.formState.isDirty || docBlocked}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default LeaveEditDialog;
