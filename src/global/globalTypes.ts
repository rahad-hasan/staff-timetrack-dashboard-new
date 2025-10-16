

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