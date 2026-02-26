import { getSingleSchedule } from "@/actions/schedule/action";
import { Badge } from "@/components/ui/badge";
import {
    Clock, Users, ArrowLeft, Settings,
    Calendar,
} from "lucide-react";
import Link from "next/link";
import { getDuration } from "@/utils";
import SingleScheduleMemberTable from "@/components/Schedule/SingleScheduleMemberTable";
import AssignMemberModal from "@/components/Schedule/AssignMemberModal";

const SingleSchedulePage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const result = await getSingleSchedule({ id });
    const schedule = result?.data;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-darkSecondaryBg/20 pb-5 rounded-b-lg">
            <div className=" bg-white/80 dark:bg-darkPrimaryBg/80 backdrop-blur-md border-b border-borderColor dark:border-darkBorder">
                <div className="px-4 pb-5 pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/schedule" className="">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-6 w-[1px] bg-gray-300 dark:bg-darkBorder" />
                        <h1 className="font-semibold text-lg">{schedule.name}</h1>
                        <Badge variant="outline" className="flex text-xs sm:text-md border-blue-200 text-blue-600 bg-blue-50 dark:bg-darkSecondaryBg dark:border-darkBorder dark:text-blue-400">
                            Active Shift
                        </Badge>
                    </div>
                </div>
            </div>

            <main className=" px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-8 items-stretch">
                    <div className="lg:col-span-4 space-y-5 ">
                        <section className="p-6 h-full rounded-2xl bg-white dark:bg-darkPrimaryBg border border-borderColor dark:border-darkBorder">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Schedule Rules
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-darkTextSecondary">Overtime</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${schedule.allow_overtime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {schedule.allow_overtime ? "ENABLED" : "DISABLED"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-darkTextSecondary">Grace In Period</span>
                                    <span className="font-mono font-medium">{schedule.grace_in_min} Minutes</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-darkTextSecondary">Grace Out Period</span>
                                    <span className="font-mono font-medium">{schedule.grace_out_min} Minutes</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-darkTextSecondary">Break In Period</span>
                                    <span className="font-mono font-medium">{schedule.break_in_min} Minutes</span>
                                </div>
                            </div>
                            <AssignMemberModal schedule={schedule}></AssignMemberModal>

                        </section>
                    </div>

                    <div className="lg:col-span-8 h-full space-y-4 xl:space-y-8 flex flex-col">
                        <div className="bg-white sm:h-full dark:bg-darkPrimaryBg rounded-3xl p-8 border border-borderColor dark:border-darkBorder overflow-hidden relative">
                            <div className=" z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-8 ">
                                <div>
                                    <p className="text-sm font-medium text-gray-400 mb-2">Shift Schedule</p>
                                    <div className="flex items-end gap-2">
                                        <h2 className=" text-2xl sm:text-4xl xl:text-5xl font-black tracking-tighter text-headingTextColor dark:text-darkTextPrimary">
                                            {schedule.start_time_local?.split(' ')[0]}
                                        </h2>
                                        <h2 className="text-sm sm:text-xl font-bold mb-1 text-gray-500">
                                            {schedule.start_time_local?.split(' ')[1]}
                                        </h2>
                                        <div className="mx-4 h-8 w-[2px] bg-gray-200 hidden md:block" />
                                        <h2 className=" text-2xl sm:text-4xl xl:text-5xl font-black tracking-tighter text-gray-400">
                                            {schedule.end_time_local?.split(' ')[0]}
                                        </h2>
                                        <h2 className="text-sm sm:text-xl font-bold mb-1 text-gray-300 uppercase">
                                            {schedule.end_time_local?.split(' ')[1]}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="bg-blue-50 dark:bg-darkSecondaryBg rounded-xl flex justify-center py-3">
                                            <Clock className="w-6 h-6 text-headingTextColor dark:text-darkTextPrimary" />
                                        </div>
                                        <p className="text-[10px] mt-1 font-bold uppercase text-gray-400 tracking-widest">Duration</p>
                                        <p className="text-sm font-semibold">{getDuration(schedule.start_time, schedule.end_time)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 sm:h-full rounded-2xl bg-blue-50 dark:bg-darkSecondaryBg text-white overflow-hidden relative">
                            <Calendar className="absolute -right-3 -bottom-4 w-32 h-32 text-headingTextColor/30 dark:text-darkTextSecondary opacity-10" />
                            <h4 className="text-headingTextColor dark:text-darkTextPrimary text-sm">Total Assigned</h4>
                            <p className="text-headingTextColor dark:text-darkTextPrimary text-4xl font-bold mt-1">{schedule.scheduleAssigns?.length || 0}</p>
                            <p className="text-headingTextColor dark:text-darkTextPrimary text-xs mt-2">Staff time track members follow this shift</p>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between my-4 px-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-headingTextColor dark:text-darkTextPrimary" />
                            Active Personnel
                        </h3>
                    </div>
                    <SingleScheduleMemberTable id={schedule.id} data={schedule.scheduleAssigns}></SingleScheduleMemberTable>
                </div>
            </main>
        </div>
    );
};

export default SingleSchedulePage;