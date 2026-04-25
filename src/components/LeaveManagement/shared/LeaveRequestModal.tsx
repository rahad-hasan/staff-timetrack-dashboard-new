"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { ChevronDownIcon, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { addLeave } from "@/actions/leaves/action";
import { LeaveRequestTypeDropdownRecord } from "@/types/type";
import { createLeaveRequestSchema, leaveRequestSchema } from "@/zod/schema";
import {
  getLeaveTypeTheme,
  formatApplicableGender,
  formatNoticeDays,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LeaveRequestModalProps = {
  leaveTypes: LeaveRequestTypeDropdownRecord[];
  defaultLeaveTypeId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

const LeaveRequestModal = ({
  leaveTypes,
  defaultLeaveTypeId,
  onClose,
  onSuccess,
}: LeaveRequestModalProps) => {
  const [loading, setLoading] = useState(false);
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);

  const requiredDocumentLeaveTypeIds = useMemo(
    () =>
      leaveTypes
        .filter((leaveType) => leaveType.requires_document)
        .map((leaveType) => String(leaveType.id)),
    [leaveTypes],
  );

  const defaultFormValues = useMemo<LeaveRequestFormValues>(
    () => ({
      leaveTypeId: defaultLeaveTypeId ? String(defaultLeaveTypeId) : "",
      supportingDocument: null,
      startDate: null,
      endDate: null,
      reason: "",
    }),
    [defaultLeaveTypeId],
  );

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(
      createLeaveRequestSchema(requiredDocumentLeaveTypeIds),
    ),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    form.reset(defaultFormValues);
  }, [defaultFormValues, form]);

  const selectedLeaveTypeId = form.watch("leaveTypeId");
  const supportingDocument = form.watch("supportingDocument");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const selectedLeaveType = useMemo(
    () =>
      leaveTypes.find(
        (leaveType) => String(leaveType.id) === String(selectedLeaveTypeId),
      ),
    [leaveTypes, selectedLeaveTypeId],
  );
  const isDocumentRequired = Boolean(selectedLeaveType?.requires_document);
  const isFormSubmitted = form.formState.isSubmitted;
  const hasDocumentError = Boolean(form.formState.errors.supportingDocument);

  useEffect(() => {
    if (isFormSubmitted || hasDocumentError) {
      void form.trigger("supportingDocument");
    }
  }, [selectedLeaveTypeId, hasDocumentError, isFormSubmitted, form]);

  async function onSubmit(values: LeaveRequestFormValues) {
    setLoading(true);

    console.log(values.supportingDocument);

    const response = await addLeave({
      leave_type_id: Number(values.leaveTypeId),
      start_date: format(new Date(values.startDate!), "yyyy-MM-dd"),
      end_date: format(new Date(values.endDate!), "yyyy-MM-dd"),
      reason: values.reason,
      document: values.supportingDocument,
    });

    if (response?.success) {
      toast.success(response.message || "Leave request submitted");
      form.reset(defaultFormValues);
      onSuccess?.();
      onClose();
      setLoading(false);
      return;
    }

    toast.error(response?.message || "Failed to request leave", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
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
          Request leave
        </DialogTitle>
        <DialogDescription className="dark:text-darkTextSecondary">
          Submit a leave request using the policies configured for your tenant.
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
                <FormLabel required>Select leave type</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full dark:bg-darkPrimaryBg">
                      <SelectValue placeholder="Choose a leave type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-darkSecondaryBg">
                      {leaveTypes.map((leaveType) => {
                        const itemTheme = getLeaveTypeTheme(
                          leaveType.color_code,
                        );

                        return (
                          <SelectItem
                            key={leaveType.id}
                            value={String(leaveType.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: itemTheme.color }}
                              />
                              <span>{leaveType.title}</span>
                              <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                {leaveType.left} left
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                        <FileText className="size-3.5" />
                        Requires document
                      </span>
                    ) : null}
                    {selectedLeaveType.applicable_gender !== "all" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                        <ShieldCheck className="size-3.5" />
                        {formatApplicableGender(
                          selectedLeaveType.applicable_gender,
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/80 px-4 py-3 text-left dark:bg-darkPrimaryBg sm:text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-subTextColor">
                    Remaining days
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: theme.textColor }}
                  >
                    {selectedLeaveType.left}
                  </p>
                  <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                    of {selectedLeaveType.days_allowed} annual
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/80 px-4 py-3 dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor">
                    Min notice
                  </p>
                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatNoticeDays(selectedLeaveType.min_notice_days)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 px-4 py-3 dark:bg-darkPrimaryBg">
                  <p className="text-xs uppercase tracking-[0.16em] text-subTextColor">
                    Back-dated requests
                  </p>
                  <p className="mt-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {selectedLeaveType.allow_past_dates ? "Allowed" : "Blocked"}
                  </p>
                </div>
              </div>
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
                          variant="outline2"
                          className="w-full justify-between text-left font-normal dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                        >
                          {startDate
                            ? format(startDate, "dd MMM yyyy")
                            : "Pick a start date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={startDate ?? undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.onChange(date);
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
                          variant="outline2"
                          className="w-full justify-between text-left font-normal dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                        >
                          {endDate
                            ? format(endDate, "dd MMM yyyy")
                            : "Pick an end date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={endDate ?? undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.onChange(date);
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
            name="supportingDocument"
            render={({ field }) => (
              <FormItem className="rounded-2xl border border-borderColor bg-bgSecondary/40 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <FormLabel
                      required={isDocumentRequired}
                      className="gap-1 text-headingTextColor dark:text-darkTextPrimary"
                    >
                      Supporting document
                    </FormLabel>
                    <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                      {isDocumentRequired
                        ? "Upload a file before submitting this leave request."
                        : "Optional for the selected leave type."}
                    </p>
                  </div>
                  {supportingDocument ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-headingTextColor dark:bg-darkSecondaryBg dark:text-darkTextPrimary">
                      <FileText className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {(supportingDocument as File).name}
                      </span>
                    </span>
                  ) : null}
                </div>

                <FormControl>
                  <Input
                    id="leave-supporting-document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    name={field.name}
                    className="mt-3 h-auto cursor-pointer py-2 dark:border-darkBorder dark:bg-darkSecondaryBg"
                    aria-required={isDocumentRequired}
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(event.target.files?.[0] ?? null)
                    }
                  />
                </FormControl>

                <p className="mt-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                  Attach a PDF, image, or document file when extra proof is
                  needed.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

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
              disabled={loading || !leaveTypes.length}
              className="w-full sm:w-auto"
            >
              {loading ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default LeaveRequestModal;
