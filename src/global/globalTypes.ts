
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
    is_online: boolean;
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

export interface IMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


