"use client"
import { getSingleTask } from "@/actions/task/action";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ISingleTask } from "@/types/type";
import { useEffect, useState } from "react";
import { Calendar, Clock, Folder, Mail, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { formatTZDayMonthYear } from "@/utils";

const SingleTaskModal = ({ taskId }: { taskId?: number }) => {
    // console.log("renderrrrrrrrr", taskId);
    const [task, setTask] = useState<ISingleTask | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!taskId) return;
        const fetchTask = async () => {
            setLoading(true);
            try {
                const res = await getSingleTask(taskId);
                if (res?.success) {
                    setTask(res.data);
                }
            } catch (err) {
                console.error("Fetch task error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId]);

    const getStatusStyles = (status: string = "") => {
        switch (status.toLowerCase()) {
            case "processing":
                return "bg-[#fff5db] dark:bg-transparent border border-[#efaf07] dark:border-[#efaf07] text-[#efaf07]";
            case "cancelled":
                return "bg-[#fee6eb] dark:bg-transparent border border-[#fcc2cf] dark:border-[#f40139] text-[#f40139]";
            case "pending":
                return "bg-[#eff7fe] dark:bg-transparent border border-[#cde7fb] dark:border-[#5db0f1] text-[#5db0f1]";
            default:
                return "bg-[#e9f8f0] dark:bg-transparent border border-[#bcebd1] dark:border-[#26bd6c] text-[#26bd6c]";
        }
    };


    if (loading) {
        return (
            <DialogContent className="sm:max-w-[550px] h-[300px] flex flex-col items-center justify-center">
                <VisuallyHidden.Root>
                    <DialogTitle>Loading Task Details</DialogTitle>
                </VisuallyHidden.Root>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </DialogContent>
        );
    }

    if (!task) return null;
    const statusClass = getStatusStyles(task.status);

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="border-none bg-white dark:bg-darkSecondaryBg p-0 sm:max-w-[550px] overflow-hidden shadow-2xl rounded-xl"
        >
            <div className={`h-2 w-full ${task.status === 'processing' ? 'bg-[#efaf07]' : task.status === 'cancelled' ? 'bg-[#f40139]' : task.status === 'pending' ? 'bg-[#5db0f1]' : "bg-[#26bd6c]"}`} />

            <div className="p-6">
                <DialogHeader className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Task Details</p>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-darkTextPrimary capitalize">
                                {task.name}
                            </DialogTitle>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusClass}`}>
                            {task.status}
                        </span>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-5">

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-darkPrimaryBg rounded-lg text-blue-600">
                                <Folder size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Project</p>
                                <p className="text-sm font-medium">{task.project_name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-darkPrimaryBg rounded-lg text-purple-600">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Time Worked</p>
                                <p className="text-sm font-medium">{task.duration || "00:00:00"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 dark:bg-darkPrimaryBg rounded-lg text-red-600">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">Deadline</p>
                                <p className="text-sm font-medium">{task.deadline ? formatTZDayMonthYear(task.deadline) : "No deadline set"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 bg-gray-50 dark:bg-darkPrimaryBg p-4 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase">Assigned To</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-darkBorder shadow-sm">
                                <AvatarImage src={task.image || ""} />
                                <AvatarFallback className="bg-primary text-white">
                                    {task.assigned_user_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold">{task.user_name}</p>
                                <div className="flex items-center gap-1 text-subTextColor dark:text-darkTextSecondary">
                                    <Mail size={18} />
                                    <span className="">{task.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Description</p>
                    <div className="text-sm text-subTextColor dark:text-darkTextPrimary leading-relaxed bg-gray-50 dark:bg-darkPrimaryBg p-4 rounded-lg min-h-[80px]">
                        {task.description || "No description provided for this task."}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};

export default SingleTaskModal;