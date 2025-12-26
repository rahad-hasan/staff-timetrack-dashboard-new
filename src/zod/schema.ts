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
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
})

export const addNewEventSchema = z.object({
    eventName: z.string().min(1, "Event name is required"),
    date: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Date is required",
    }),
    project: z.string().optional(),
    members: z.array(z.string().min(1, "Member name is required")).min(1, "At least one member is required"),
    description: z.string().min(1, "Description is required"),
})

export const editEventSchema = z.object({
    date: z
        .date()
        .nullable()
        .refine((date) => date !== null, {
            message: "Date is required",
        }),
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
})

export const screenDeleteReasonSchema = z.object({
    reason: z.string().min(1, "Reason is required"),
})

export const leaveSettingsSchema = z.object({
    paid_leave: z.number().min(1, "Paid Leave is required"),
    casual_leave: z.number().min(1, "Casual Leave is required"),
    sick_leave: z.number().min(1, "Sick Leave is required"),
    maternity_leave: z.number().min(1, "Maternity Leave is required"),
});
