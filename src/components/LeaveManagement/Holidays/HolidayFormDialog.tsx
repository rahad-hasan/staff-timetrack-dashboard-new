"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import z from "zod";
import { CalendarDays, Clock3, FileText, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { createLeaveHoliday, updateLeaveHoliday } from "@/actions/leaves/action";
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LeaveHoliday } from "@/types/type";
import { leaveHolidayFormSchema } from "@/zod/schema";

type HolidayFormDialogProps = {
  mode: "create" | "edit";
  initialData?: LeaveHoliday | null;
  selectedYear: string;
  onClose: () => void;
  onSuccess: () => void;
};

const getDefaultValues = (
  initialData?: LeaveHoliday | null,
): z.infer<typeof leaveHolidayFormSchema> => ({
  name: initialData?.name ?? "",
  date: initialData?.date ?? "",
  duration: initialData?.duration ?? 1,
  description: initialData?.description ?? "",
  source: initialData?.source ?? "",
});

const HolidayFormDialog = ({
  mode,
  initialData,
  selectedYear,
  onClose,
  onSuccess,
}: HolidayFormDialogProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof leaveHolidayFormSchema>>({
    resolver: zodResolver(leaveHolidayFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    form.reset(getDefaultValues(initialData));
  }, [form, initialData, mode]);

  const values = form.watch();

  const formattedDate = useMemo(() => {
    if (!values.date) {
      return `Select a date in ${selectedYear}`;
    }

    const parsed = parseISO(values.date);
    return isValid(parsed) ? format(parsed, "EEEE, MMMM d, yyyy") : values.date;
  }, [selectedYear, values.date]);

  const handleSubmit = async (payload: z.infer<typeof leaveHolidayFormSchema>) => {
    if (payload.date.slice(0, 4) !== selectedYear) {
      form.setError("date", {
        type: "manual",
        message: `Holiday date must be within ${selectedYear}.`,
      });
      return;
    }

    setLoading(true);

    const holidayPayload = {
      name: payload.name.trim(),
      date: payload.date,
      duration: payload.duration,
      description: payload.description?.trim() ?? "",
      source: payload.source.trim(),
    };

    const response =
      mode === "create"
        ? await createLeaveHoliday(holidayPayload)
        : initialData?.id
          ? await updateLeaveHoliday(initialData.id, holidayPayload)
          : {
              success: false,
              message: "This holiday cannot be updated because its record id is missing.",
            };

    if (response?.success) {
      toast.success(
        response.message ||
          (mode === "create"
            ? "Holiday created successfully."
            : "Holiday updated successfully."),
      );
      form.reset(getDefaultValues(initialData));
      onSuccess();
      onClose();
      setLoading(false);
      return;
    }

    toast.error(
      response?.message ||
        (mode === "create" ? "Failed to create holiday." : "Failed to update holiday."),
      {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      },
    );
    setLoading(false);
  };

  return (
    <DialogContent
      onInteractOutside={(event) => {
        if (loading) {
          event.preventDefault();
        }
      }}
      onEscapeKeyDown={(event) => {
        if (loading) {
          event.preventDefault();
        }
      }}
      className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto border-borderColor p-0 sm:max-w-[920px] dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-borderColor p-4 dark:border-darkBorder sm:p-6 lg:border-r lg:border-b-0">
          <DialogHeader>
            <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
              {mode === "create" ? "Add holiday manually" : "Update holiday"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? `Create a company or public holiday entry for ${selectedYear}. This form submits directly to the holiday API and refreshes the holiday calendar after save.`
                : `Refine the holiday record for ${selectedYear}. Changes are saved to the same holiday API and refresh the leave calendar immediately.`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Holiday name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Eid-ul-Fitr"
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The selected date must fall inside the active year filter.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? 1 : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>Number of leave days.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Source</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. government, company, regional"
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Add context for employees and approvers."
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      This text appears alongside the holiday in management views.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-5 dark:border-darkBorder sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline2"
                  onClick={onClose}
                  disabled={loading}
                  className="dark:bg-darkPrimaryBg"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {mode === "create" ? "Saving holiday" : "Updating holiday"}
                    </>
                  ) : (
                    (mode === "create" ? "Create holiday" : "Update holiday")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,1)_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(33,39,51,1)_0%,rgba(50,57,71,1)_100%)] sm:p-6">
          <div className="rounded-[28px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/15">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-subTextColor">
                  Preview
                </p>
                <h3 className="mt-1 text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  {values.name.trim() || "Untitled holiday"}
                </h3>
                <p className="mt-2 text-sm text-subTextColor">{formattedDate}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-borderColor/70 bg-bgSecondary/70 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
                <div className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                  <Clock3 className="size-4 text-primary" />
                  Duration
                </div>
                <p className="mt-2 text-2xl font-semibold text-primary">
                  {values.duration || 1}
                </p>
                <p className="text-xs text-subTextColor">
                  day{values.duration === 1 ? "" : "s"} of leave coverage
                </p>
              </div>

              <div className="rounded-[22px] border border-borderColor/70 bg-bgSecondary/70 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
                <div className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                  <ShieldCheck className="size-4 text-primary" />
                  Source
                </div>
                <p className="mt-2 text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  {values.source.trim() || "Waiting for input"}
                </p>
                <p className="text-xs text-subTextColor">
                  Keep the source label consistent for reporting.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-borderColor/70 bg-bgSecondary/70 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
              <div className="flex items-center gap-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                <FileText className="size-4 text-primary" />
                Description preview
              </div>
              <p className="mt-2 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                {values.description?.trim() || "No description added yet."}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-borderColor bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
            <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Submission rules
            </p>
            <div className="mt-4 space-y-3 text-sm text-subTextColor">
              <div className="rounded-2xl bg-primary/6 px-4 py-3 dark:bg-primary/10 dark:text-darkTextSecondary">
                The holiday date must stay inside the active year: {selectedYear}.
              </div>
              <div className="rounded-2xl bg-primary/6 px-4 py-3 dark:bg-primary/10 dark:text-darkTextSecondary">
                Holiday changes revalidate the holiday, calendar, and employee leave views.
              </div>
              <div className="rounded-2xl bg-primary/6 px-4 py-3 dark:bg-primary/10 dark:text-darkTextSecondary">
                Use a short, stable source label such as <code>government</code> or{" "}
                <code>company</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default HolidayFormDialog;
