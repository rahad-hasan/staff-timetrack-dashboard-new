import { z } from "zod"

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

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
    project: z.string().min(1, "Project is required"),
    task: z.string().min(1, "Task is required"),
    date: z.date().refine(date => !isNaN(date.getTime()), {
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
    client: z.string().min(1, "Client is required"),
    manager: z.string().min(1, "Manager is required"),
    description: z.string().min(1, "Description is required"),
    startDate: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Start date is required",
    }),
    deadline: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Deadline is required",
    }),
    phone: z.string().min(1, "Dead line is required"),
});

// Step 2: Add Members Schema
export const addMemberSchema = z.object({
    members: z.array(z.string().min(1, "Member name is required")).min(1, "At least one member is required"),
});

// Step 3: Add Budget & Hours Schema
export const addBudgetAndHoursSchema = z.object({
    budget: z.number().min(1, "Budget is required"),
    hours: z.number().min(1, "Hours are required"),
});

// Step 4: Add Tasks Schema
export const addTasksSchema = z.object({
    tasks: z.string().min(1, "Task is required"),
    description: z.string().min(1, "Description is required"),
});
