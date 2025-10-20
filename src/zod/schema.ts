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
    projectType: z.string().min(1, "Project Type is required"),
    rate: z.coerce.number().min(1, "Rate is required"),
    budgetType: z.string().optional(),
    budgetBasis: z.string().optional(),
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
    deadline: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Deadline is required",
    }),
    details: z.string().min(1, "Task details is required"),
})

export const newClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    email: z.string().min(1, "Email is required"),
    phone: z.coerce.number().min(1, "Phone number is required"),
})

export const newTeamSchema = z.object({
    teamName: z.string().min(1, "Team name is required"),
    project: z.string().min(1, "Project is required"),
    members: z.array(z.string().min(1, "Member name is required")).min(1, "At least one member is required"),
})

export const addNewMemberSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required"),
    role: z.string().min(1, "Role is required"),
    password: z.string().min(1, "Password is required"),
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


export const leaveRequestSchema = z.object({
    leaveType: z.string().min(1, "Leave type is required"),
    startDate: z.date().refine(date => !isNaN(date.getTime()), {
        message: "Start date is required",
    }),
    endDate: z.date().refine(date => !isNaN(date.getTime()), {
        message: "End date is required",
    }),
    details: z.string().min(1, "Details is required"),
})

export const leaveRejectRequestSchema = z.object({
    project: z.string().min(1, "Project is required"),
    details: z.string().min(1, "Details is required"),
})

export const userBasicInfoSchema = z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    email: z.string().min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})