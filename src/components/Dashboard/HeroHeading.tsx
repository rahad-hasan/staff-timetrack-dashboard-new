import { ISearchParamsProps } from "@/types/type";
import HeadingComponent from '../Common/HeadingComponent';
import DayWeekMonthSelection from '../Common/DayWeekMonthSelection';

const HeroHeading = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "daily" | "weekly" | "monthly";
    const activeTab = (params?.tab as Tab) ?? "daily";

    const getDailyDate = () => {
        return new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    };

    const getWeeklyDate = () => {
        const startOfWeek = new Date();
        const endOfWeek = new Date();

        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startDate = startOfWeek.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "2-digit",
            year: "numeric",
        });

        const endDate = endOfWeek.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "2-digit",
            year: "numeric",
        });

        return `${startDate} - ${endDate}`;
    };

    const getMonthlyDate = () => {
        return new Date().toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });
    };

    const date =
        activeTab === "daily"
            ? getDailyDate()
            : activeTab === "weekly"
                ? getWeeklyDate()
                : activeTab === "monthly"
                    ? getMonthlyDate()
                    : "";
    return (

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
            <HeadingComponent heading="Dashboard" subHeading={date}></HeadingComponent>
            <DayWeekMonthSelection></DayWeekMonthSelection>
        </div>

    );
};

export default HeroHeading;