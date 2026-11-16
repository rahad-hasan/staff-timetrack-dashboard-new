import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import ScreenshotActivityCard from "./ScreenshotActivityCard";

/** The day's totals, as GET /activities reports them. */
export interface ScreenshotDayTotals {
  score: number;
  mouse_activity: number;
  keyboard_activity: number;
  work_time: string;
  delete_time: string;
}

/** The four cards above the 10-minute view. */
const ScreenshotsSummary = ({ totals }: { totals: ScreenshotDayTotals }) => (
  <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
    <ScreenshotActivityCard
      icon={WeeklyActivityColoredIcon}
      value={totals.score + "%"}
      level="AVG ACTIVITY"
      chart={FirstChart}
      is_improved={true}
      //   improved_value={"+1.5%"}
    />
    <ScreenshotActivityCard
      icon={WeeklyWorkColoredIcon}
      value={totals.work_time}
      level="WORKED TIME"
      chart={SecondChart}
      is_improved={true}
      deleted_time={totals.delete_time}
      //   improved_value={"+30m"}
    />
    <ScreenshotActivityCard
      icon={TotalProjectColoredIcon}
      value={totals.mouse_activity + "%"}
      level="MOUSE ACTIVITY"
      chart={FirstChart}
      is_improved={false}
      //   improved_value={"-2.5%"}
    />
    <ScreenshotActivityCard
      icon={TeamMemberColoredIcon}
      value={totals.keyboard_activity + "%"}
      level="KEYBOARD ACTIVITY"
      chart={SecondChart}
      is_improved={true}
      //   improved_value={"+3.5%"}
    />
  </div>
);

export default ScreenshotsSummary;
