import { z } from "zod";
import parsePhoneNumberFromString from "libphonenumber-js";
import { WEEK_START_DAYS } from "@/lib/organization";
import {
  SIGNUP_SOURCE_DETAIL_MAX_LENGTH,
  SIGNUP_SOURCE_VALUES,
} from "@/lib/signupSources";

/*
 * Every schema that validates a phone number lives here, apart from the rest
 * of src/zod/schema.ts, because libphonenumber-js (~30 KB gz of metadata) is
 * bundled into every route that imports this module. Keeping it separate means
 * only the forms that actually take a phone number pay for it — /auth/login,
 * the leave and payroll pages and the timesheet modals no longer do.
 * Do not re-export these from schema.ts: that would pull the library back
 * into all of its importers.
 */

/**
 * Phone number fields.
 *
 * `parsePhoneNumberFromString("")` returns undefined, so a `.refine()` chained
 * *before* `.optional()` still runs against the empty string an untouched input
 * submits — which is why an "optional" phone kept failing with the format
 * message. `optionalPhone` normalises "" to `undefined` first, so the format
 * check only sees a value the user actually typed and the API never receives an
 * empty phone (the server rejects that exactly the same way).
 */
const PHONE_FORMAT_MESSAGE =
  "Phone number must be a valid international format";

const isValidPhoneNumber = (value: string) =>
  Boolean(parsePhoneNumberFromString(value)?.isValid());

const requiredPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(isValidPhoneNumber, { message: PHONE_FORMAT_MESSAGE });

const optionalPhone = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .refine((value) => value === undefined || isValidPhoneNumber(value), {
    message: PHONE_FORMAT_MESSAGE,
  })
  .optional();

/**
 * Create-organization onboarding.
 *
 * Bounds mirror the API so the wizard never round-trips a payload the server
 * will reject: name/phone/address/time_zone come from
 * `CompanyValidation.createSchema`, and week_start / weekly_leave_count /
 * idle_minutes_limit / currency from its update schema. Leave allowances are
 * not here on purpose — they belong to the LeaveType model, not to Company.
 *
 * `signup_source` is required here but optional on the API: the wizard always
 * asks (with "Other" as the way out), while older clients that never send it
 * must keep signing up. The detail only means something next to "Other".
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters long")
    .max(50, "Organization name must not exceed 50 characters"),

  phone: requiredPhone,

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters long")
    .max(100, "Address must not exceed 100 characters"),

  time_zone: z.string().min(1, "Time zone is required"),

  week_start: z.enum(WEEK_START_DAYS, {
    message: "Select the first day of your work week",
  }),

  weekly_leave_count: z
    .number({ message: "Weekend length is required" })
    .int("Weekend length must be a whole number")
    .min(0, "Weekend length must be 0 or greater")
    .max(7, "Weekend length cannot exceed 7"),

  idle_minutes_limit: z
    .number({ message: "Idle limit is required" })
    .int("Idle limit must be a whole number")
    .min(1, "Idle limit must be at least 1 minute")
    .max(60, "Idle limit cannot exceed 60 minutes"),

  currency: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z]{3}$/,
      "Currency must be a 3-letter ISO 4217 code (e.g. USD, BDT, EUR)",
    )
    .transform((value) => value.toUpperCase()),

  signup_source: z.enum(SIGNUP_SOURCE_VALUES, {
    message: "Let us know how you heard about us",
  }),

  signup_source_detail: z
    .string()
    .trim()
    .max(
      SIGNUP_SOURCE_DETAIL_MAX_LENGTH,
      `Keep it under ${SIGNUP_SOURCE_DETAIL_MAX_LENGTH} characters`,
    )
    .optional(),
});

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;

export const newClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: optionalPhone,
});

export const addNewMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: optionalPhone,
  role: z.string().min(1, "Role is required"),
  gender: z.string().min(1, "Gender is required"),
  /**
   * Optional, and that has to mean the empty string too — the form seeds this
   * field with `""`, so a bare `.optional()` (which only admits `undefined`)
   * put the whole regex on an untouched field and blocked step 1 behind an
   * error the user could not clear. Same shape as `singleMemberSchema` below.
   *
   * `AddNewMemberModal` must then OMIT the key rather than send `""`: the
   * server's own `birth_day` is `.optional()` guarding the identical regex, so
   * an empty string 400s there for exactly the same reason.
   */
  birth_day: z
    .string({ message: "Birth day must be a string" })
    .refine(
      (value) =>
        value === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value))),
      { message: "Birth day must be a valid YYYY-MM-DD date." },
    )
    .optional(),
  time_zone: z.string().min(1, "Time Zone is required"),
  project: z.string().min(1, "Project is required"),
  schedule: z.string().min(1, "Schedule is required").optional(),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters long",
    })
    .max(100, {
      message: "Password cannot exceed 100 characters",
    }),
});

export const userBasicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters long",
    })
    .max(100, {
      message: "Password cannot exceed 100 characters",
    })
    .optional(),
  phone: requiredPhone,
  time_zone: z.string().min(1, "Time Zone is required"),
});

export const leaveSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must not exceed 50 characters"),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format"),

  phone: requiredPhone,

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters long")
    .max(100, "Address must not exceed 100 characters"),

  time_zone: z.string().min(1, "Time Zone is required"),

  currency: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z]{3}$/,
      "Currency must be a 3-letter ISO 4217 code (e.g. USD, BDT, EUR)",
    )
    .transform((v) => v.toUpperCase()),

  idle_minutes_limit: z
    .number()
    .min(1, "Idle limit must be at least 1 minute")
    .max(60, "Limit cannot exceed 1 hours"),

  week_start: z.string().min(1, "Please select a starting day of the week"),

  weekly_leave_count: z
    .number({ message: "Weekend length is required" })
    .int("Weekend length must be a whole number")
    .min(0, "Weekend length must be 0 or greater")
    .max(7, "Weekend length cannot exceed 7"),
});

export const singleMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: optionalPhone,
  role: z.string().min(2, "role is required"),
  status: z.enum(["probation", "permanent"]).optional(),
  time_zone: z.string().min(1, "Time Zone is required"),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),
  birth_day: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
        return !isNaN(Date.parse(val));
      },
      { message: "Birth day must be a valid YYYY-MM-DD date." },
    ),
});
