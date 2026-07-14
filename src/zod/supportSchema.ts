import { z } from "zod";
import {
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
} from "@/types/support";

const attachmentUrlSchema = z
  .string()
  .trim()
  .url("Attachment must be a valid URL");

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  category: z.enum(TICKET_CATEGORY_VALUES as [string, ...string[]]),
  priority: z.enum(TICKET_PRIORITY_VALUES as [string, ...string[]]),
  affected_project: z
    .string()
    .trim()
    .max(200, "Affected project is too long")
    .optional()
    .or(z.literal("")),
  affected_time_entry_id: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  attachments: z
    .array(attachmentUrlSchema)
    .max(10, "Up to 10 attachments allowed")
    .optional(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const replySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message must be at most 5000 characters"),
  attachments: z
    .array(attachmentUrlSchema)
    .max(10, "Up to 10 attachments allowed")
    .optional(),
});

export type ReplyFormValues = z.infer<typeof replySchema>;

export const feedbackSchema = z.object({
  rating: z
    .number({ message: "Please select a rating" })
    .int()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
