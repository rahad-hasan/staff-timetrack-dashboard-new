import { z } from "zod"
import parsePhoneNumberFromString from 'libphonenumber-js';


export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /[!@#$%^&*(),.?":{}|<>]/,
            "Password must contain at least one special character"
        ),
});

export const forgetPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
})

export const createNewPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters")
        .regex(
            /[!@#$%^&*(),.?":{}|<>]/,
            "Password must contain at least one special character"
        ),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters")
        .regex(
            /[!@#$%^&*(),.?":{}|<>]/,
            "Password must contain at least one special character"
        ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Confirm passwords do not match",
    path: ["confirmPassword"],
})

export const addManualTimeSchema = z.object({
    // project: z.string().min(1, "Project is required"),
    // task: z.string().min(1, "Task is required"),
    project: z.any().refine((val) => val !== undefined && val !== null && val !== "", {
        message: "Project is required",
    }),
    task: z.any().refine((val) => val !== undefined && val !== null && val !== "", {
        message: "Task is required",
    }),
    date: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "Date is required",
    }),
    timeFrom: z.string().min(1, "Start time is required"),
    timeTo: z.string().min(1, "End time is required"),
    message: z.string().optional(),
});

// project create step
// Step 1: General Info Schema
export const generalInfoSchema = z.object({
    projectName: z.string().min(1, "Project name is required"),
    client: z
        .number()
        .min(1, "Client is required"),
    members: z
        .array(
            z.object({
                id: z.number(),
                name: z.string(),
            })
        )
        .min(1, "At least one member is required"),
    description: z.string().min(1, "Description is required"),
    startDate: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "Start date is required",
    }),
    deadline: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
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

    manager: z.array(z.string().min(1)).min(1, "At least one manager is required"),

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
    manager: z
        .array(
            z.number()
        )
        .min(1, "At least one manager is required"),
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
    deadline: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "Deadline is required",
    }),
    priority: z.string().min(1, "Priority is required"),
    details: z.string().min(1, "Task details is required"),
})

export const newClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    email: z.string().email("Invalid email address"),
    phone: z
        .string()
        .refine(
            (val) => {
                const parsed = parsePhoneNumberFromString(val);
                return parsed?.isValid();
            },
            {
                message: 'Phone number must be a valid international format',
            }
        )
});

export const newTeamSchema = z.object({
    teamName: z.string().min(1, "Team name is required"),
    project: z.string().min(1, "Project is required"),
    members: z.array(z.string().min(1, "Member name is required")).min(1, "At least one member is required"),
})

export const addNewMemberSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.string().min(1, "Role is required"),
    password: z.string()
        .min(8, "Minimum 8 characters")
        .regex(/[a-z]/, "At least one lowercase letter")
        .regex(/[A-Z]/, "At least one uppercase letter")
        .regex(/\d/, "At least one number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
})

export const editMemberSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
        .trim(),
    role: z.string().min(1, "Role is required"),
    password: z.string()
        .min(8, "Minimum 8 characters")
        .regex(/[a-z]/, "At least one lowercase letter")
        .regex(/[A-Z]/, "At least one uppercase letter")
        .regex(/\d/, "At least one number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character").optional(),
})

export const addNewEventSchema = z.object({
    eventName: z.string().min(1, "Event name is required"),
    date: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Date is required",
    }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    project: z.string().optional(),
    meetingLink: z
        .string()
        .optional()
        .or(z.literal(''))
        .refine((value) => {
            if (!value || value === "") return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, { message: 'Meeting link must be a valid HTTP/HTTPS URL' })
        .refine((value) => {
            if (!value || value === "") return true;
            return /^https?:\/\/[a-z0-9.-]*(meet|teams)[a-z0-9.-]*\/\S+/i.test(value);
        }, {
            message: 'Meeting link must be a valid Meet or Teams URL',
        }),
    members: z
        .array(z.union([z.number(), z.string()]))
        .min(1, "At least one member is required"),
    description: z.string().min(5, "Event description must be at least 5 characters long"),
})

export const editEventSchema = z.object({
    date: z
        .date()
        .nullable()
        .refine((date) => date !== null, {
            message: "Date is required",
        }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
});

export const leaveRequestSchema = z.object({
    leaveType: z.string().min(1, "Leave type is required"),
    startDate: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "Start date is required",
    }),
    endDate: z.date().nullable().refine((date) => date !== null && !isNaN(date.getTime()), {
        message: "End date is required",
    }),
    reason: z.string().min(1, "Reason is required"),
})

export const leaveRejectRequestSchema = z.object({
    reason: z.string().min(1, "Reason is required"),
})

export const userBasicInfoSchema = z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    phone: z
        .string()
        .refine(
            (val) => {
                const parsed = parsePhoneNumberFromString(val);
                return parsed?.isValid();
            },
            {
                message: 'Phone number must be a valid international format',
            }
        )
})

export const screenDeleteReasonSchema = z.object({
    reason: z.string().min(1, "Reason is required"),
})

export const leaveSettingsSchema = z.object({
    paid_leave: z.number().min(1, "Paid Leave is required"),
    casual_leave: z.number().min(1, "Casual Leave is required"),
    sick_leave: z.number().min(1, "Sick Leave is required"),
    maternity_leave: z.number().min(1, "Maternity Leave is required"),
    address: z.string()
        .min(1, "Address is required")
        .max(255, "Address is too long"),

    time_zone: z.string()
        .min(1, "Time Zone is required"),

    idle_minutes_limit: z.number()
        .min(1, "Idle limit must be at least 1 minute")
        .max(60, "Limit cannot exceed 1 hours"),

    week_start: z.string().min(1, "Please select a starting day of the week"),
});


export const changePasswordSchema = z.object({
    oldPassword: z.string().min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

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
                message: 'Phone number must be a valid international format',
            }
        ),
    pay_rate_hourly: z.number().min(0),
    role: z.string().min(2, "role is required"),
})

