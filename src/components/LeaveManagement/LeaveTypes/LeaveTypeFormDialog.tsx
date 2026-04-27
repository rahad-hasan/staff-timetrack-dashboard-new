"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { CalendarClock, FileText, Palette, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { createLeaveType, updateLeaveType } from "@/actions/leaves/action";
import { getLeaveTypeTheme, normalizeHexColor } from "@/lib/leave";
import { CreateLeaveTypePayload, LeaveTypeRecord } from "@/types/type";
import { leaveTypeFormSchema } from "@/zod/schema";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type LeaveTypeFormDialogProps = {
  mode: "create" | "edit";
  initialData?: LeaveTypeRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

const applicableGenderOptions = [
  { value: "all", label: "All employees" },
  { value: "male", label: "Male only" },
  { value: "female", label: "Female only" },
  { value: "other", label: "Other only" },
] as const;

const getDefaultValues = (
  initialData?: LeaveTypeRecord | null,
): z.infer<typeof leaveTypeFormSchema> => ({
  title: initialData?.title ?? "",
  color_code: normalizeHexColor(initialData?.color_code ?? "#7c3aed"),
  days_allowed: initialData?.days_allowed ?? 0,
  requires_document: initialData?.requires_document ?? false,
  is_active: initialData?.is_active ?? true,
  applicable_gender: initialData?.applicable_gender ?? "all",
  min_notice_days: initialData?.min_notice_days ?? null,
  allow_past_dates: initialData?.allow_past_dates ?? false,
});

const LeaveTypeFormDialog = ({
  mode,
  initialData,
  onClose,
  onSuccess,
}: LeaveTypeFormDialogProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof leaveTypeFormSchema>>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    form.reset(getDefaultValues(initialData));
  }, [form, initialData, mode]);

  const values = form.watch();
  const previewTheme = useMemo(
    () => getLeaveTypeTheme(values.color_code),
    [values.color_code],
  );

  async function onSubmit(values: z.infer<typeof leaveTypeFormSchema>) {
    setLoading(true);

    const payload: CreateLeaveTypePayload = {
      title: values.title.trim(),
      color_code: normalizeHexColor(values.color_code),
      days_allowed: values.days_allowed,
      requires_document: values.requires_document,
      is_active: values.is_active,
      applicable_gender: values.applicable_gender,
      min_notice_days: values.min_notice_days,
      allow_past_dates: values.allow_past_dates,
    };

    const response =
      mode === "create"
        ? await createLeaveType(payload)
        : await updateLeaveType(initialData!.id, payload);

    if (response?.success) {
      toast.success(
        response.message ||
          (mode === "create"
            ? "Leave type created successfully"
            : "Leave type updated successfully"),
      );
      onSuccess();
      onClose();
      setLoading(false);
      return;
    }

    toast.error(response?.message || "Failed to save leave type", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
    setLoading(false);
  }

  return (
    <DialogContent
      onInteractOutside={(event) => event.preventDefault()}
      className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto border-borderColor p-0 sm:max-w-[920px] dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-borderColor p-4 dark:border-darkBorder sm:p-6 lg:border-r lg:border-b-0">
          <DialogHeader>
            <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
              {mode === "create" ? "Create leave type" : "Edit leave type"}
            </DialogTitle>
            <DialogDescription className=" dark:text-darkTextSecondary">
              Configure tenant-scoped leave rules without relying on fixed enum values.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Annual Leave"
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
                  name="color_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Color</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="#7C3AED"
                          className="uppercase dark:border-darkBorder dark:bg-darkPrimaryBg"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Picker</FormLabel>
                      <FormControl>
                        <Input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded-xl border border-borderColor px-2 dark:border-darkBorder dark:bg-darkPrimaryBg"
                          value={normalizeHexColor(field.value)}
                          onChange={(event) =>
                            field.onChange(normalizeHexColor(event.target.value).toUpperCase())
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="days_allowed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Annual limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? 0 : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_notice_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min notice days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Optional"
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="applicable_gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Applicable gender</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue placeholder="Select gender rule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-darkSecondaryBg">
                        {applicableGenderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="requires_document"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4 rounded-2xl border border-borderColor bg-bgSecondary/60 px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <FormLabel>Requires attachment</FormLabel>
                        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                          Require supporting documents during leave application.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_past_dates"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4 rounded-2xl border border-borderColor bg-bgSecondary/60 px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <FormLabel>Allow back-dated requests</FormLabel>
                        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                          Toggle whether users can request leave for past dates.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-4 rounded-2xl border border-borderColor bg-bgSecondary/60 px-4 py-4 dark:border-darkBorder dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                          Inactive leave types remain in history but disappear from employee request flows.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-4 dark:border-darkBorder sm:flex-row sm:items-center sm:justify-end">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline2"
                    className="w-full dark:bg-darkPrimaryBg dark:text-darkTextPrimary sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading
                    ? mode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : mode === "create"
                      ? "Create leave type"
                      : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="bg-bgSecondary/50 p-4 dark:bg-darkPrimaryBg sm:p-5">
          <div
            className="rounded-[12px] border p-5 mt-6 bg-white dark:bg-darkSecondaryBg "
            style={{
              borderColor: previewTheme.borderColor,
              boxShadow: `inset 0 1px 0 ${previewTheme.backgroundColor}`,
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: previewTheme.color }}
                  />
                  <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    {values.title || "Leave Type Preview"}
                  </h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: previewTheme.backgroundColor,
                      color: previewTheme.textColor,
                    }}
                  >
                    {values.days_allowed} days / year
                  </span>
                  <span className="rounded-full bg-bgSecondary px-2.5 py-1 text-xs font-medium text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                    {values.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div
                className="rounded-2xl p-3"
                style={{ backgroundColor: previewTheme.backgroundColor }}
              >
                <Palette
                  className="size-5"
                  style={{ color: previewTheme.textColor }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-col gap-2 rounded-[12px] bg-bgSecondary px-4 py-3 text-sm dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="text-subTextColor dark:text-darkTextSecondary">Applicable to</span>
                </div>
                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {
                    applicableGenderOptions.find(
                      (option) => option.value === values.applicable_gender,
                    )?.label
                  }
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-[12px] bg-bgSecondary px-4 py-3 text-sm dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" />
                  <span className="text-subTextColor dark:text-darkTextSecondary">Min notice</span>
                </div>
                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {values.min_notice_days === null
                    ? "No notice"
                    : `${values.min_notice_days} day(s)`}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-[12px] bg-bgSecondary px-4 py-3 text-sm dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span className="text-subTextColor dark:text-darkTextSecondary">Attachment</span>
                </div>
                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {values.requires_document ? "Required" : "Optional"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default LeaveTypeFormDialog;
