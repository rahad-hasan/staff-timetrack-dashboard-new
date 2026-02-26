import { getWorkReport } from "@/actions/report/action";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import CalendarIcon from "@/components/Icons/CalendarIcon";
import AllowOvertimeCheckbox from "@/components/Report/WorkReport/AllowOvertimeCheckbox";
import WorkReportTable from "@/components/Report/WorkReport/WorkReportTable";
import { ISearchParamsProps, IUserWorkReport } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { format, parseISO, startOfMonth } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";
import EmptyTableLogo from "@/assets/empty_table.svg";
import Image from "next/image";

const WorkReport = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const user = await getDecodedUser();
    const res = await getWorkReport({
        user_id: params.user_id ?? user?.id,
        allow_overtime: params?.allow_overtime,
    });

    const data: IUserWorkReport = res?.data;
    if (!data) return <div className="">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-3">
                <h1 className=" text-md sm:text-xl xl:text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary flex items-center gap-2">
                    <CalendarIcon className=" text-primary" size={25} />
                    Work Report:
                </h1>
            </div>
            <div className=" flex flex-col md:flex-row md:items-center gap-4">
                {/* <AllowOvertimeCheckbox /> */}
                <SelectUserWrapper />
            </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 h-[60vh] text-center">

            <Image src={EmptyTableLogo} alt="table empty" width={120} height={120} />
            {res?.message}

        </div>
    </div>;

    const reportDate = parseISO(data.from_date);
    const monthStart = startOfMonth(reportDate);
    // const calendarDays = eachDayOfInterval({
    //     start: startOfWeek(monthStart),
    //     end: endOfWeek(endOfMonth(monthStart)),
    // });

    return (
        <div className="space-y-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center gap-3">
                    <h1 className=" text-md sm:text-xl xl:text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary flex items-center gap-2">
                        <CalendarIcon className=" text-primary" size={25} />
                        Work Report: {format(monthStart, "MMMM yyyy")}
                    </h1>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-darkSecondaryBg rounded-full text-sm font-medium">
                        {data.time_zone}
                    </div>
                </div>
                <div className=" flex flex-col md:flex-row md:items-center gap-4">
                    <AllowOvertimeCheckbox overTime={data?.schedule?.allow_overtime} />
                    <SelectUserWrapper />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                <div className="bg-white dark:bg-darkSecondaryBg p-5 rounded-xl border border-borderColor dark:border-darkBorder">
                    <h3 className="text-sm font-semibold text-subTextColor dark:text-darkTextSecondary uppercase tracking-wider mb-3">Active Schedule</h3>
                    <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold text-headingTextColor dark:text-darkTextPrimary">{data.schedule.name}</span>
                        <div className="flex items-center gap-2 text-sm text-subTextColor dark:text-darkTextSecondary">
                            <Clock className="w-4 h-4" />
                            {format(parseISO(data.schedule.start_time), "hh:mm a")} - {format(parseISO(data.schedule.end_time), "hh:mm a")}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <span className="text-[14px] bg-slate-100 dark:bg-darkPrimaryBg/70 px-2 py-1 rounded">Grace In: {data.schedule.grace_in_min}m</span>
                            <span className="text-[14px] bg-slate-100 dark:bg-darkPrimaryBg/70 px-2 py-1 rounded">Grace Out: {data.schedule.grace_out_min}m</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-darkSecondaryBg p-5 rounded-xl border border-borderColor dark:border-darkBorder">
                    <h3 className="text-sm font-semibold text-subTextColor dark:text-darkTextSecondary uppercase tracking-wider mb-3">Total Worked</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl xl:text-3xl font-bold">{data.summary.total_worked_duration.split(':')[0]}h</span>
                        <span className="text-lg text-subTextColor dark:text-darkTextSecondary">{data.summary.total_worked_duration.split(':')[1]}m</span>
                    </div>
                    <p className="text-[14px] text-subTextColor dark:text-darkTextSecondary mt-2">Report Period: <span className=" font-semibold dark:text-darkTextPrimary/90">{data.from_date}</span> To <span className=" font-semibold dark:text-darkTextPrimary/90">{data.to_date}</span></p>
                </div>

                <div className="bg-white dark:bg-darkSecondaryBg p-5 rounded-xl border border-borderColor dark:border-darkBorder grid grid-cols-2 gap-4">
                    <div className=" space-y-2">
                        <h3 className=" text-[12px] xl:text-[14px] font-semibold text-red-500 uppercase">Late Arrivals</h3>
                        <div className="flex items-center gap-1">
                            <AlertCircle className=" w-5 xl:w-6 h-5 xl:h-6 text-red-500" />
                            <span className=" text-md xl:text-xl font-bold">{data.summary.late_days} Days</span>
                        </div>
                        <span className="text-[14px] xl:text-[16px] text-subTextColor dark:text-darkTextSecondary">Total: {data.summary.total_late_hm}</span>
                    </div>
                    <div className="border-l border-borderColor dark:border-darkBorder pl-4 space-y-2">
                        <h3 className=" text-[12px] xl:text-[14px] font-semibold text-amber-500 uppercase">Early Departures</h3>
                        <div className="flex items-center gap-1">
                            <AlertCircle className=" w-5 xl:w-6 h-5 xl:h-6 text-amber-500" />
                            <span className=" text-md xl:text-xl font-bold">{data.summary.early_days} Days</span>
                        </div>
                        <span className="text-[14px] xl:text-[16px] text-subTextColor dark:text-darkTextSecondary">Total: {data.summary.total_early_hm}</span>
                    </div>
                </div>
            </div>
            <WorkReportTable data={res?.data?.days}></WorkReportTable>

            {/* <div className=" overflow-x-scroll lg:overflow-auto">
                <div className=" dark:bg-darkSecondaryBg border border-borderColor dark:border-darkBorder rounded-xl overflow-hidden min-w-[900px]">
                    <div className="grid grid-cols-7 border-b border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkSecondaryBg text-center font-semibold text-subTextColor dark:text-darkTextSecondary text-sm">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d} className="py-3 border-r last:border-r-0 border-borderColor dark:border-darkBorder">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7" >
                        {calendarDays.map((day, idx) => {
                            const dateStr = format(day, "yyyy-MM-dd");
                            const dayData = data.days.find(d => d.date === dateStr);
                            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);

                            return (
                                <div key={idx} className={`min-h-[130px] p-2 border-b border-r border-borderColor dark:border-darkBorder hover:bg-slate-50  hover:dark:bg-darkPrimaryBg/40 ${!isCurrentMonth ? 'bg-slate-50/50 opacity-30' : ''}`}>
                                    <div className="text-right font-medium ">
                                        {format(day, "d")}
                                    </div>

                                    {dayData ? (
                                        <div className="mt-1 space-y-1 text-[14px]">
                                            <div className="bg-emerald-100 text-emerald-800 rounded px-1 font-medium">
                                                IN: {dayData.check_in_local}
                                            </div>
                                            <div className="bg-rose-100 text-rose-800 rounded px-1 font-medium">
                                                OUT: {dayData.check_out_local}
                                            </div>

                                            {dayData.late_minutes > 0 && (
                                                <div className="flex items-center gap-1 bg-red-100 text-red-800 rounded px-1 py-0.5 font-semibold">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Late: {dayData.late_hm}
                                                </div>
                                            )}

                                            {dayData.early_minutes > 0 && (
                                                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 rounded px-1 py-0.5 font-semibold">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Early: {dayData.early_hm}
                                                </div>
                                            )}

                                            <div className="bg-slate-100 text-slate-700 rounded px-1 py-0.5 border border-borderColor dark:border-darkBorder">
                                                Total: <span className="font-mono font-bold">{dayData.worked_duration}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        isCurrentMonth && <div className=""></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default WorkReport;