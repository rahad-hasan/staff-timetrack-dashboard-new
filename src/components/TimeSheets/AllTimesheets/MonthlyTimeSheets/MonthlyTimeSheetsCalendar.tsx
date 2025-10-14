const MonthlyTimeSheetsCalendar = () => {
    const mockCalendarData = [
        { day: 1, time: "8h 56m" }, { day: 2, time: "8h 23m" }, { day: 3, time: "8h 4m" }, { day: 4, time: "9h 11m" }, { day: 5, time: "8h 2m" }, { day: 6, time: "" }, { day: 7, time: "" },
        { day: 8, time: "8h 28m" }, { day: 9, time: "10h 30m" }, { day: 10, time: "8h 19m" }, { day: 11, time: "8h 8m" }, { day: 12, time: "6h 54m" }, { day: 13, time: "" }, { day: 14, time: "0h 4m" },
        { day: 15, time: "9h 23m" }, { day: 16, time: "8h 20m" }, { day: 17, time: "8h 37m" }, { day: 18, time: "8h 36m" }, { day: 19, time: "8h 15m" }, { day: 20, time: "0h 23m" }, { day: 21, time: "3h 51m" },
        { day: 22, time: "8h 2m" }, { day: 23, time: "8h 23m" }, { day: 24, time: "3h 14m" }, { day: 25, time: "8h 16m" }, { day: 26, time: "6h 11m" }, { day: 27, time: "1h 9m" }, { day: 28, time: "" }, { day: 29, time: "" },
        { day: 30, time: "3h 30m" }, { day: 31, time: "3h 14m" },
    ];

    const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    const DateCell = ({ day, time }: { day: number, time: string }) => (
        <div
            className={`p-3 h-28 md:h-24 flex flex-col justify-center items-center text-gray-800 bg-white border border-gray-200`}
        >
            <span className="font-semibold text-lg mb-1">{day}</span>
            {time && (
                <div className="px-2 py-1 text-sm font-medium rounded-lg bg-[#e9f8f0] text-primary shadow-sm">
                    {time}
                </div>
            )}
        </div>
    );

    const DayHeader = ({ day, className }: { day: string; className?: string }) => (
        <div
            className={`p-3 flex items-center justify-center font-bold text-sm h-14 text-black bg-gray-100 border-gray-300 ${className}`}
        >
            {day}
        </div>
    );
    return (
        <div className=" overflow-auto ">
            <div className="grid grid-cols-7 gap-2 min-w-[750px]">
                {dayHeaders.map((day, index) => {
                    let extraClass = "";
                    if (index === 0) extraClass = "rounded-tl-lg";
                    if (index === dayHeaders.length - 1) extraClass = "rounded-tr-lg";

                    return (
                        <div key={day}>
                            <DayHeader day={day} className={extraClass} />
                        </div>
                    );
                })}

                {mockCalendarData.map((data) => (
                    <div key={data.day} >
                        <DateCell day={data.day} time={data.time} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonthlyTimeSheetsCalendar;
