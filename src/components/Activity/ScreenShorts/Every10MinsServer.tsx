import { getScreenshots10Min } from "@/actions/screenshots/action";
import { ISearchParamsProps } from "@/types/type";
import Every10Mins from "./Every10Mins";
import FirstChart from "@/components/Icons/HeadingChartIcon/FirstChart";
import SecondChart from "@/components/Icons/HeadingChartIcon/SecondChart";
import WeeklyActivityColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon";
import WeeklyWorkColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon";
import TotalProjectColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon";
import TeamMemberColoredIcon from "@/components/ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon";
import ScreenshotActivityCard from "./ScreenshotActivityCard";
import { getCompanyInfo } from "@/actions/settings/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const Every10MinsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  const filters = await resolveViewFilters(params);
  const { user, userId: targetUserId } = filters;
  const userId = user?.id;

  // Only a project manager's or an employee's delete permission depends on
  // the company setting (see canDeleteScreenshot below), so only they pay for
  // the company read: alongside the screenshots read, never before it.
  const needsCompany =
    user?.role === "project_manager" || user?.role === "employee";
  const [result, company] = await Promise.all([
    getScreenshots10Min({
      date: filters.date,
      user_id: filters.userId,
      project_id: params?.project_id,
      // Without ?timezone this view always named a zone (it used to be the
      // login-time cookie); the resolved zone is the viewer's live one.
      timezone: params?.timezone ?? filters.zone,
    }),
    needsCompany ? getCompanyInfo() : null,
  ]);
  // A refusal (no access to the member, no such member, a plan that no longer
  // admits the read) keeps the empty day; any other failure throws rather
  // than showing a day without activity.
  requireDataOrRefusal(result, "the screenshot timeline");
  // A refused read has no `data`: the empty day is zeroed cards and the empty
  // state with the API's reason, not "undefined%" over a blank grid.
  const day = result?.data ?? {
    interval_rows: [],
    score: 0,
    mouse_activity: 0,
    keyboard_activity: 0,
    work_time: "00:00:00",
    delete_time: "00:00:00",
  };

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
          value={day.score + "%"}
          level="AVG ACTIVITY"
          chart={FirstChart}
          is_improved={true}
          //   improved_value={"+1.5%"}
        />
        <ScreenshotActivityCard
          icon={WeeklyWorkColoredIcon}
          value={day.work_time}
          level="WORKED TIME"
          chart={SecondChart}
          is_improved={true}
          deleted_time={day.delete_time}
          //   improved_value={"+30m"}
        />
        <ScreenshotActivityCard
          icon={TotalProjectColoredIcon}
          value={day.mouse_activity + "%"}
          level="MOUSE ACTIVITY"
          chart={FirstChart}
          is_improved={false}
          //   improved_value={"-2.5%"}
        />
        <ScreenshotActivityCard
          icon={TeamMemberColoredIcon}
          value={day.keyboard_activity + "%"}
          level="KEYBOARD ACTIVITY"
          chart={SecondChart}
          is_improved={true}
          //   improved_value={"+3.5%"}
        />
      </div>
      {
        <Every10Mins
          data={day.interval_rows}
          canDelete={canDeleteScreenshot}
          message={result?.success === false ? result.message : undefined}
        />
      }
    </div>
  );
};

export default Every10MinsServer;
