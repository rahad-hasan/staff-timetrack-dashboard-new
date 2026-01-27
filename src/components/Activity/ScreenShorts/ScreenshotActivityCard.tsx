import { TrendingDown, TrendingUp } from "lucide-react";

interface IScreenshotActivityCardProps {
  icon: React.ElementType;
  level: string;
  value: string;
  chart: React.ElementType;
  is_improved: boolean;
  improved_value: string;
}

function ScreenshotActivityCard({
  icon: Icon,
  level,
  value,
  chart: Chart,
  is_improved,
  improved_value,
}: IScreenshotActivityCardProps) {
  return (
    <div className="rounded-2xl w-full  transition-all hover:shadow duration-200 relative h-38 shadow-sm dark:shadow-slate-100">
      <div className="border-x-2 border-t-2 border-borderColor/40 dark:border-darkBorder/25 flex items-center justify-between px-4 py-6 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
        <div className=" flex items-center gap-3">
          <Icon size={36} />
          <div>
            <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
              {value}
            </h2>
            <h3 className=" uppercase text-subTextColor dark:text-darkTextSecondary">
              {level}
            </h3>
          </div>
        </div>
        <div className={is_improved ? "text-[#12cd69]" : "text-red-600"}>
          <Chart color={is_improved ? "#3BC1A8" : "#FF0000"}></Chart>
        </div>
      </div>
      <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
        {is_improved ? (
          <TrendingUp size={20} className={"text-[#12cd69]"} />
        ) : (
          <TrendingDown size={20} className={"text-red-500"} />
        )}

        <p className={is_improved ? "text-[#12cd69]" : "text-red-500"}>
          {improved_value}
        </p>
        <p
          className={`text-md text-muted-foreground dark:text-darkTextSecondary`}
        >
          from yesterday
        </p>
      </div>
    </div>
  );
}

export default ScreenshotActivityCard;
