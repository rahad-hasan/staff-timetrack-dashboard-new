import { z } from "zod";
import parsePhoneNumberFromString from "libphonenumber-js";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const createNewPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm passwords do not match",
    path: ["confirmPassword"],
  });

export const addManualTimeSchema = z.object({
  // project: z.string().min(1, "Project is required"),
  // task: z.string().min(1, "Task is required"),
  project: z
    .any()
    .refine((val) => val !== undefined && val !== null && val !== "", {
      message: "Project is required",
    }),
  task: z
    .any()
    .refine((val) => val !== undefined && val !== null && val !== "", {
      message: "Task is required",
    })
    .optional(),
  date: z
    .date()
    .nullable()
    .refine((date) => date !== null && !isNaN(date.getTime()), {
      message: "Date is required",
    }),
  timeFrom: z.string().min(1, "Start time is required"),
  timeTo: z.string().min(1, "End time is required"),
  message: z.string().min(5, "Message must be at least 5 characters long."),
});

// project create step
// Step 1: General Info Schema
export const generalInfoSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  client: z.number().min(1, "Client is required"),
  members: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    )
    .min(1, "At least one member is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z
    .date()
    .nullable()
    .refine((date) => date !== null && !isNaN(date.getTime()), {
      message: "Start date is required",
    }),
  deadline: z
    .date()
    .nullable()
    .refine((date) => date !== null && !isNaN(date.getTime()), {
      message: "Deadline is required",
    }),
  phone: z.string().optional(),
});

export const addProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  client: z.string().min(1, "Client is required"),

  members: z.array(z.string().min(1)).min(1, "At least one member is required"),

  description: z.string().min(1, "Description is required"),

  startDate: z
    .date()
    .nullable()
    .refine((d) => d !== null, { message: "Start date is required" }),

  deadline: z
    .date()
    .nullable()
    .refine((d) => d !== null, { message: "Deadline is required" }),

  manager: z
    .array(z.string().min(1))
    .min(1, "At least one manager is required"),

  budgetType: z.enum(["Hourly Rate", "Fixed Budget"]).optional(),

  rate: z.coerce
    .number()
    .optional()
    .refine((v) => v === undefined || v > 0, { message: "Rate must not be 0" }),

  basedOn: z.string().optional(),
});

export type FormValues = z.infer<typeof addProjectSchema>;

// Step 2: Add Members Schema
export const addMemberSchema = z.object({
  manager: z.array(z.number()).min(1, "At least one manager is required"),
});

// Step 3: Add Budget & Hours Schema
export const addBudgetAndHoursSchema = z.object({
  // budgetType: z.string().min(1, "Business Type is required"),
  rate: z.coerce.number().min(1, "Rate is required"),
  // basedOn: z.string().optional(),
});

// Step 4: Add Tasks Schema
export const addTasksSchema = z.object({
  tasks: z.string().min(1, "Task is required"),
  description: z.string().min(1, "Description is required"),
});

export const newTaskCreationSchema = z.object({
  assignee: z.string().min(1, "Assignee is required"),
  project: z.string().min(1, "Project is required"),
  taskName: z.string().min(1, "Task name is required"),
  deadline: z
    .date()
    .nullable()
    .refine((date) => date !== null && !isNaN(date.getTime()), {
      message: "Deadline is required",
    }),
  priority: z.string().min(1, "Priority is required"),
  details: z.string().optional(),
});

export const newClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (val) => {
      const parsed = parsePhoneNumberFromString(val);
      return parsed?.isValid();
    },
    {
      message: "Phone number must be a valid international format",
    },
  ),
});

export const newTeamSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  project: z.string().min(1, "Project is required"),
  members: z
    .array(z.string().min(1, "Member name is required"))
    .min(1, "At least one member is required"),
});

export const addNewMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .refine(
      (val) => {
        const parsed = parsePhoneNumberFromString(val);
        return parsed?.isValid();
      },
      {
        message: "Phone number must be a valid international format",
      },
    )
    .optional(),
  role: z.string().min(1, "Role is required"),
  gender: z.string().min(1, "Gender is required"),
  birth_day: z
    .string({ message: "Birth day must be a string" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Birth day must be in the format YYYY-MM-DD.',
    })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Birth day must be a valid calendar date.',
    })
    .optional(),
  time_zone: z.string().min(1, "Time Zone is required"),
  project: z.string().min(1, "Project is required"),
  schedule: z.string().min(1, "Schedule is required").optional(),
  pay_rate_hourly: z
    .number({ message: "Pay rate must be a number" })
    .int()
    .min(1, { message: "Pay rate must be 1 or greater" })
    .max(10000, { message: "Pay rate must be 10000 or less" })
    .optional(),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
});

export const editMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .trim(),
  role: z.string().min(1, "Role is required"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character")
    .optional(),
});

export const addNewEventSchema = z
  .object({
    eventName: z
      .string()
      .trim()
      .min(2, "Event name must be at least 2 characters")
      .max(30, "Event name must be 30 characters or less"),
    date: z.date().refine((date) => !isNaN(date.getTime()), {
      message: "Date is required",
    }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    members: z
      .array(z.union([z.number(), z.string()]))
      .min(1, "At least one member is required"),
    description: z
      .string()
      .trim()
      .min(5, "Description must be at least 5 characters"),
    conference_provider: z.enum(["none", "google", "microsoft"]).default("none"),
  })
  .superRefine((values, ctx) => {
    if (values.start_time && values.end_time) {
      if (values.end_time <= values.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_time"],
          message: "End time must be after start time",
        });
      }
    }
  });

export const editEventSchema = z
  .object({
    date: z
      .date()
      .nullable()
      .refine((date) => date !== null, {
        message: "Date is required",
      }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .superRefine((values, ctx) => {
    if (values.start_time && values.end_time) {
      if (values.end_time <= values.start_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["end_time"],
          message: "End time must be after start time",
        });
      }
    }
  });

export const addEventMembersSchema = z.object({
  members: z
    .array(z.union([z.number(), z.string()]))
    .min(1, "At least one member is required"),
});

export const userBasicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  phone: z.string().refine(
    (val) => {
      const parsed = parsePhoneNumberFromString(val);
      return parsed?.isValid();
    },
    {
      message: "Phone number must be a valid international format",
    },
  ),
  time_zone: z.string().min(1, "Time Zone is required"),
});

export const screenDeleteReasonSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const leaveSettingsSchema = z.object({
  paid_leave: z.number().min(1, "Paid Leave is required"),
  casual_leave: z.number().min(1, "Casual Leave is required"),
  sick_leave: z.number().min(1, "Sick Leave is required"),
  maternity_leave: z.number().min(1, "Maternity Leave is required"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address is too long"),

  time_zone: z.string().min(1, "Time Zone is required"),

  idle_minutes_limit: z
    .number()
    .min(1, "Idle limit must be at least 1 minute")
    .max(60, "Limit cannot exceed 1 hours"),

  week_start: z.string().min(1, "Please select a starting day of the week"),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
  newPassword: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
});

export const singleMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .optional()
    .or(z.literal("")) // 👈 This allows the empty string from your input to pass
    .refine(
      (val) => {
        // If there's no value, it's valid (optional)
        if (!val || val.length === 0) return true;

        // If there IS a value, check if it's a valid international number
        const parsed = parsePhoneNumberFromString(val);
        return parsed?.isValid();
      },
      {
        message: "Phone number must be a valid international format",
      },
    ),
  pay_rate_hourly: z.number().min(0),
  role: z.string().min(2, "role is required"),
  time_zone: z.string().min(1, "Time Zone is required"),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),
  currency: z.string().min(1, "Currency is required"),
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

export const ScheduleShiftSchema = z.object({
  name: z
    .string({ message: "Schedule name is required" })
    .min(2, { message: "Schedule name must be at least 2 characters long" })
    .max(60, { message: "Schedule name must not exceed 60 characters" }),
  start_time: z.string().min(1, "Shift Start time is required"),
  end_time: z.string().min(1, "Shift End time is required"),
  grace_in_min: z
    .number({ message: "Grace in minutes must be a number" })
    .int()
    .min(0, { message: "Grace in minutes must be 0 or greater" })
    .max(1440, { message: "Grace in minutes must be 1440 or less" }),

  grace_out_min: z
    .number({ message: "Grace out minutes must be a number" })
    .int()
    .min(0, { message: "Grace out minutes must be 0 or greater" })
    .max(1440, { message: "Grace out minutes must be 1440 or less" }),

  break_in_min: z
    .number({ message: "Break in minutes must be a number" })
    .int()
    .min(0, { message: "Break in minutes must be 0 or greater" })
    .max(1440, { message: "Break in minutes must be 1440 or less" }),
});

export const scheduleAssignMemberSchema = z.object({
  project: z.string().min(1, "Project is required"),
  members: z
    .array(z.union([z.number(), z.string()]))
    .min(1, "At least one member is required"),
});

export const leaveTypeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(80, "Title must be 80 characters or less"),
  color_code: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a valid hex color"),
  days_allowed: z
    .number({ message: "Annual limit is required" })
    .int("Annual limit must be a whole number")
    .min(0, "Annual limit must be 0 or greater"),
  requires_document: z.boolean(),
  is_active: z.boolean(),
  applicable_gender: z.enum(["male", "female", "other", "all"]),
  min_notice_days: z
    .number({ message: "Min notice must be a number" })
    .int("Min notice must be a whole number")
    .min(0, "Min notice must be 0 or greater")
    .nullable(),
  allow_past_dates: z.boolean(),
});

export const leaveHolidayFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Holiday name must be at least 2 characters")
    .max(120, "Holiday name must be 120 characters or less"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
  duration: z
    .number({ message: "Duration is required" })
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day")
    .max(31, "Duration must be 31 days or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  source: z
    .string()
    .trim()
    .min(1, "Source is required")
    .max(60, "Source must be 60 characters or less"),
});

const leaveRequestBaseSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    // supportingDocument: z.unknown().nullable().optional(),
    supportingDocument: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine((file) => !file || file instanceof File, {
        message: "Document must be a valid file",
      }),
    startDate: z
      .date()
      .nullable()
      .refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "Start date is required",
      }),
    endDate: z
      .date()
      .nullable()
      .refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "End date is required",
      }),
    reason: z.string().min(1, "Reason is required"),
  })
  .superRefine((values, ctx) => {
    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be before the start date",
      });
    }
});

export const createLeaveRequestSchema = (
  requiredDocumentLeaveTypeIds: Iterable<string | number> = [],
) => {
  const requiredIds = new Set(
    Array.from(requiredDocumentLeaveTypeIds, (id) => String(id)),
  );

  return leaveRequestBaseSchema.superRefine((values, ctx) => {
    if (requiredIds.has(values.leaveTypeId) && !values.supportingDocument) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportingDocument"],
        message: "Supporting document is required for this leave type",
      });
    }
  });
};

export const leaveRequestSchema = createLeaveRequestSchema();