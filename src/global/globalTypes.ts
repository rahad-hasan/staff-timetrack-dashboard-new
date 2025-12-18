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
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    company_id: number;
    is_active: boolean;
    updated_at: string;
    created_at: string;
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
    id: number,
    company_id: number,
    name: string,
    email: string,
    role: "admin" | "manager" | "hr" | "project_manager" | "employee",
    phone: string | null,
    image: string | null,
    pay_rate_hourly: number,
    time_zone: string,
    is_active: boolean,
    is_deleted: boolean,
    is_tracking: boolean,
    url_tracking: boolean,
    multi_factor_auth: boolean,
    created_at: string,
    updated_at: string,
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

export interface IMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


// project types
export type ProjectStatus = "pending" | "active" | "completed" | "archived";

export interface User {
    id: number;
    name: string;
    email: string;
    image: string | null;
}

export interface ProjectAssign {
    user: User;
    assignedBy: {
        id: number;
        name: string;
    };
    assigned_at: string;
}

export interface ProjectManagerAssign {
    user: User;
}

export interface ProjectSummary {
    spend: string;
    is_over_budget: boolean;
    duration: string;
}

export interface IProject {
    id: number;
    company_id: number;
    name: string;
    client_id: number | null;
    status: ProjectStatus;
    description: string | null;
    start_date: string;
    deadline: string | null;
    is_idle_time: boolean;
    budget: number | null;
    client: null;
    projectAssigns: ProjectAssign[];
    projectManagerAssigns: ProjectManagerAssign[];
    summary: ProjectSummary;
}
