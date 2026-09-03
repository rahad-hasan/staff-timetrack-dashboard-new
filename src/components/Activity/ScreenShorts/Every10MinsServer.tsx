import { getScreenshots10Min } from "@/actions/screenshots/action";
import { ISearchParamsProps } from "@/types/type";
import Every10Mins from "./Every10Mins";
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";
import { format } from "date-fns";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import ScreenshotActivityCard from "./ScreenshotActivityCard";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { cookies } from "next/headers";
import { getCompanyInfo } from "@/actions/settings/action";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const Every10MinsServer = async ({ searchParams }: ISearchParamsProps) => {
  const user = await getDecodedUser();
  const userId = user?.id;
  const params = await searchParams;
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const cookieStore = await cookies();
  const cookieTimeZone = cookieStore.get("timeZone")?.value;
  const targetUserId = params.user_id ?? userId;

  const [result, company] = await Promise.all([
    getScreenshots10Min({
      date: params.date ?? currentDate,
      user_id: targetUserId,
      project_id: params?.project_id,
      timezone: params?.timezone ?? cookieTimeZone,
    }),
    getCompanyInfo(),
  ]);

  // Admin / HR / manager always may. The two roles the backend newly admits
  // only once the company turns `screenshot_delete_enabled` on — an employee
  // for their own day, a project manager for anyone in their member list
  // (which is already scoped to the projects they manage, the same rule the
  // backend re-checks). A failed company fetch has no `data`, so the fallback
  // is today's role-only rule; never default the flag to true.
  const canDeleteScreenshot =
    ["admin", "hr", "manager"].includes(user?.role ?? "") ||
    (company?.data?.screenshot_delete_enabled === true &&
      (user?.role === "project_manager" ||
        (user?.role === "employee" &&
          userId != null &&
          String(targetUserId) === String(userId))));

  return (
    <div className="min-h-[80vh] xl:h-auto">
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <ScreenshotActivityCard
          icon={WeeklyActivityColoredIcon}
          value={result?.data?.score + "%"}
          level="AVG ACTIVITY"
          chart={FirstChart}
          is_improved={true}
          //   improved_value={"+1.5%"}
        />
        <ScreenshotActivityCard
          icon={WeeklyWorkColoredIcon}
          value={result?.data?.work_time}
          level="WORKED TIME"
          chart={SecondChart}
          is_improved={true}
          deleted_time={result?.data?.delete_time}
          //   improved_value={"+30m"}
        />
        <ScreenshotActivityCard
          icon={TotalProjectColoredIcon}
          value={result?.data?.mouse_activity + "%"}
          level="MOUSE ACTIVITY"
          chart={FirstChart}
          is_improved={false}
          //   improved_value={"-2.5%"}
        />
        <ScreenshotActivityCard
          icon={TeamMemberColoredIcon}
          value={result?.data?.keyboard_activity + "%"}
          level="KEYBOARD ACTIVITY"
          chart={SecondChart}
          is_improved={true}
          //   improved_value={"+3.5%"}
        />
      </div>
      {
        <Every10Mins
          data={result?.data?.interval_rows}
          canDelete={canDeleteScreenshot}
        />
      }
    </div>
  );
};

export default Every10MinsServer;
