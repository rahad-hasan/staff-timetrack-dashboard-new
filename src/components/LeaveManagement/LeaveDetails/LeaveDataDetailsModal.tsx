"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IUserLeaveData } from "@/types/type";

type TLeaveCategory = {
    allowed: number;
    taken: number;
    remaining: number;
};

const LeaveDataDetailsModal = ({ data }: { data: IUserLeaveData }) => {


    const LeaveCard = ({
        title,
        stats,
        color,

    }: {
        title: string;
        stats: TLeaveCategory;
        color: string;

    }) => {
        const percentage = Math.min((stats?.taken / stats?.allowed) * 100, 100);

        return (
            
            <div className=" relative overflow-hidden rounded-2xl border border-gray-100 dark:border-darkBorder bg-white dark:bg-[#00000007] p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`h-2 w-2 rounded-full ${color} shadow-[0_0_3px] shadow-current`} />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {title}
                    </h4>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.remaining}
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-200">Days Left</span>
                </div>
                <div className="relative mt-3 h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#ffffff1e]">
                    <div
                        className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="mt-3 flex justify-between items-center text-[11px] font-medium">
                    <span className="text-gray-400 dark:text-gray-200 uppercase ">Used: {stats?.taken}</span>
                    <span className="text-gray-400 dark:text-gray-200 uppercase">Quota: {stats?.allowed}</span>
                </div>
            </div>
        );
    };

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="border-none bg-gray-50 dark:bg-darkSecondaryBg p-0 sm:max-w-[550px] overflow-hidden shadow-2xl max-h-[95vh] overflow-y-auto"
        >
            <div className="bg-white dark:bg-darkPrimaryBg px-6 pt-8 pb-6 border-b dark:border-darkBorder">
                <DialogHeader className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Avatar className=" size-12">
                            <AvatarImage src={data?.user?.image ? data?.user?.image : ""} alt="@shadcn" />
                            <AvatarFallback>{data?.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl text-start font-bold dark:text-white">
                                {data?.user?.name}
                            </DialogTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{data?.user.email}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl bg-gray-50 dark:bg-darkSecondaryBg p-5">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Allowed</p>
                        {/* <p className="text-2xl font-black text-gray-900 dark:text-white">{data?.total_allowed}</p> */}
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{data?.total_allowed}</p>
                    </div>
                    <div className="space-y-1 border-x border-gray-200 dark:border-white/10 px-4">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Taken</p>
                        <p className="text-3xl font-black ">{data?.total_taken}</p>
                    </div>
                    <div className="space-y-1 pl-2">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Balance</p>
                        <p className="text-3xl font-black text-emerald-500">{data?.total_remaining}</p>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-400">Leave Breakdown</h3>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-primary/10 text-primary dark:text-primary">Year {data?.year}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <LeaveCard title="Casual" stats={data?.casual} color="bg-amber-500" />
                    <LeaveCard title="Sick" stats={data?.sick} color="bg-rose-500" />
                    <LeaveCard title="Maternity" stats={data?.maternity} color="bg-violet-500" />
                    <LeaveCard title="Paid" stats={data?.paid} color="bg-emerald-500" />
                </div>
            </div>

        </DialogContent>
    );
};

export default LeaveDataDetailsModal;