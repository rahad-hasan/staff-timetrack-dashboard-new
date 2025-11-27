import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";


const ReportWeeklyTimeSheet = () => {
    console.log("ReportWeeklyTimeSheet");
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]
    // date picker
    const [centerDate, setCenterDate] = useState(new Date());

    // table data
    type DayMeta = { name: string };
    type Row = {
        times: Array<{ [key: string]: string }>;
        weekTotal: string;
    };

    const days: DayMeta[] = [
        { name: "Monday" },
        { name: "Tuesday" },
        { name: "Wednesday" },
        { name: "Thursday" },
        { name: "Friday" },
        { name: "Saturday" },
        { name: "Sunday" },
    ];
    const rows: Row =
    {
        times: [{ time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }, { time: "-" }, { time: "8h 0m" }, { time: "8h 0m" }, { time: "-" }],
        weekTotal: "7:00:00"
    }

    return (
        <div>
            <div className="mb-5 flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between">
                <div className=" flex gap-3">
                    <WeeklyDatePicker centerDate={centerDate} setCenterDate={setCenterDate} />
                    <Button className=" hidden sm:flex text-headingTextColor dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="text-headingTextColor dark:text-darkTextPrimary" /> Filters
                    </Button>
                </div>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <div className="overflow-x-auto w-full border rounded-lg dark:border-darkBorder">
                <table className="w-full border-collapse">
                    <thead className="">
                        <tr className="text-headingTextColor">
                            {days.map((d, i) => (
                                <th
                                    key={i}
                                    className={`z-10 px-4 py-5 text-center border-b border-gray-200 dark:border-darkBorder ${i < days.length - 1 ? 'border-r' : ''}`}
                                >
                                    <div className="text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">{d.name}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="">
                        <tr className="text-headingTextColor">
                            {rows?.times?.map((time, i) => (
                                <td
                                    key={i}
                                    className={`z-10 px-4 py-5 text-center ${i < rows.times.length - 1 ? 'border-r border-gray-200 dark:border-darkBorder' : ''}`}
                                >
                                    <h2 className=" text-lg text-primary font-medium">{time.time}</h2>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

        </div >
    );
};

export default ReportWeeklyTimeSheet;