import { z } from "zod";

/*
 * The schema of the "Generate payroll" form, which is on screen as its page
 * loads. Kept out of ./schema for the reason given in ./authSchemas: importing
 * anything from that module builds every schema in it.
 */

export const generatePayrollSchema = z.object({
  month: z
    .number({ message: "Month is required" })
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number({ message: "Year is required" })
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
});
