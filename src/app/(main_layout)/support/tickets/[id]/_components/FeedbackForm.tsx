"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { submitTicketFeedback } from "@/actions/support/action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { hasErrorCode } from "@/lib/support";
import {
  SubmitFeedbackPayload,
  TicketFeedback,
} from "@/types/support";
import { FeedbackFormValues, feedbackSchema } from "@/zod/supportSchema";
import StarRating from "./StarRating";

interface FeedbackFormProps {
  ticketId: number;
  onSubmitted: (feedback: TicketFeedback) => void;
}

const FeedbackForm = ({ ticketId, onSubmitted }: FeedbackFormProps) => {
  const [saving, setSaving] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  async function onSubmit(values: FeedbackFormValues) {
    setSaving(true);
    const payload: SubmitFeedbackPayload = {
      rating: values.rating as 1 | 2 | 3 | 4 | 5,
    };
    const trimmed = values.comment?.trim();
    if (trimmed) payload.comment = trimmed;

    const response = await submitTicketFeedback(ticketId, payload);

    if (response?.success && response.data) {
      toast.success("Thanks for the feedback!");
      onSubmitted(response.data);
      return;
    }

    setSaving(false);
    if (hasErrorCode(response, "FEEDBACK_EXISTS")) {
      toast.info("You've already submitted feedback for this ticket.");
    } else if (hasErrorCode(response, "INVALID_STATE")) {
      toast.error("Feedback is only available on resolved or closed tickets.");
    } else {
      toast.error(response?.message || "Could not submit feedback.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-3 rounded-md bg-primary/5 p-3 dark:bg-primary/10">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-headingTextColor dark:text-darkTextPrimary">
            How did we do? Your rating helps us improve support.
          </p>
        </div>

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Your rating</FormLabel>
              <FormControl>
                <StarRating
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Rate the support you received"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Tell us what worked well or what we could do better."
                  className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || form.watch("rating") < 1}>
            {saving ? "Submitting…" : "Submit feedback"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FeedbackForm;
