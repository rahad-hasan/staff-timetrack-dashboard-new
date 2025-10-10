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