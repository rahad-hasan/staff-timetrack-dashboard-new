type TaskStatus = "todo" | "pending" | "in_progress" | "completed";
type TaskPriority = "Urgent" | "Low" | "Medium" | "High";

export interface ITask {
    id: string;
    taskName: string;
    project: string;
    image: string;
    assignee: string;
    timeWorked: string;
    priority: TaskPriority;
    status: TaskStatus;
    checklist: number;
}

export interface IClients {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface IAttendance {
    image: string;
    name: string;
    date: string;
    status: "Active" | "Inactive";
    appVersion: string;
    checkIn: string;
    checkOut: string;
}

export interface ITimeActivity {
    image: string,
    name: string,
    project: string,
    duration: string,
    activity: number,
}
export interface ITeamMembers {
    image: string,
    name: string,
    memberSince: string,
    status: string,
    role: string,
    project: number,
    weeklyLimit: string,
    tracking: boolean,
    dailyLimit: string,
}

export interface ILeave {
    image: string,
    name: string,
    totalLeave: number,
    casualLeave: number,
    sickLeave: number,
    earnedLeave: number,
    availableLeave: number
}

export type ILeaveRequest = {
    image: string;
    name: string;
    from: string;
    to: string;
    days: number;
    reason: string;
    availableLeave: number;
}