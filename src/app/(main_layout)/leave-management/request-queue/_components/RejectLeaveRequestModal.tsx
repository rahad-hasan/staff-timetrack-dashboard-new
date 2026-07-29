"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";

import { approveRejectLeave } from "@/actions/leaves/action";
import { LeaveRecord } from "@/types/type";
import { leaveRequestSchema } from "@/zod/schema";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";

const RejectLeaveRequestModal = ({
  data,
  onClose,
  onSuccess,
}: {
  data: LeaveRecord;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof leaveRequestSchema>>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof leaveRequestSchema>) {
    setLoading(true);

    const response = await approveRejectLeave({
      data: {
        leave_id: data.id,
        approved: false,
        reject_reason: values.reason,
      },
    });

    if (response?.success) {
      toast.success(response.message || "Leave request rejected");
      onSuccess();
      onClose();
      setLoading(false);
      return;
    }

    toast.error(response?.message || "Failed to reject leave request", {
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
      },
    });
    setLoading(false);
  }

  return (
    <DialogContent className="sm:max-w-[560px] dark:bg-darkSecondaryBg">
      <DialogHeader>
        <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
          Reject leave request
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-2xl border border-borderColor bg-bgSecondary/70 p-4 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg">
            <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
              {data.user?.name}
            </p>
            <p className="mt-1">
              {data.leaveType?.title} from {data.start_date} to {data.end_date}
            </p>
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Reject reason</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[120px] dark:border-darkBorder dark:bg-darkPrimaryBg"
                    placeholder="Explain why this request is being rejected"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline2" type="button" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-500 hover:bg-red-500"
            >
              {loading ? "Rejecting..." : "Reject request"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default RejectLeaveRequestModal;
