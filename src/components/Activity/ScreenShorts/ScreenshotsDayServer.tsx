import { getScreenshots10Min } from "@/actions/screenshots/action";
import { ISearchParams } from "@/types/type";
import ScreenshotsDay from "./ScreenshotsDay";
import { getCompanyInfo } from "@/actions/settings/action";
import { resolveViewFilters } from "@/components/TimeSheets/viewFilters";
import { requireDataOrRefusal } from "@/lib/server/liveData";

/*
 * The one read behind both views of the screenshots page.
 *
 * GET /activities returns the day as hours of 10-minute slots, and every slot
 * carries its screenshots: "Every 10 min" draws the slots, "All Screenshots"
 * the same screenshots in a flat list. There used to be a second read
 * (/activities/all-screenshots) and a server round trip on every tab change
 * for pictures the browser already held; now the client switches views on
 * what this component hands it (see ScreenshotsDay).
 */
export const readScreenshotsDay = async (params: Awaited<ISearchParams>) => {
  const filters = await resolveViewFilters(params);
  const { user } = filters;

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

  return { filters, result, company };
};

export type ScreenshotsDayRead = Awaited<ReturnType<typeof readScreenshotsDay>>;

/**
 * Draws a day that has been read. Synchronous on purpose: rendered directly
 * (ScreenShotsServer does, for a read that was fast) it is part of the same
 * piece of the response as the boundary around it, so the browser never has
 * the boundary without its content and never draws the skeleton.
 */
export const ScreenshotsDayView = ({ read }: { read: ScreenshotsDayRead }) => {
  const { filters, result, company } = read;
  const { user, userId: targetUserId } = filters;
  const userId = user?.id;

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

  // Plain data only, and nothing rendered here: React splits a large piece
  // of the response at the elements in it, and anything split off reaches
  // the browser after the Suspense boundary, which then draws its skeleton
  // over a grid that is already on its way (see ScreenshotsSkeleton). The
  // cards above the 10-minute view are drawn by the client from `totals`.
  return (
    <ScreenshotsDay
      totals={{
        score: day.score,
        mouse_activity: day.mouse_activity,
        keyboard_activity: day.keyboard_activity,
        work_time: day.work_time,
        delete_time: day.delete_time,
      }}
      canDelete={canDeleteScreenshot}
      message={result?.success === false ? result.message : undefined}
      hours={day.interval_rows}
    />
  );
};

/**
 * Waits for the read under the Suspense boundary, for one that did not make
 * ScreenShotsServer's deadline: the skeleton shows until it has.
 */
const ScreenshotsDayServer = async ({
  day,
}: {
  day: Promise<ScreenshotsDayRead>;
}) => <ScreenshotsDayView read={await day} />;

export default ScreenshotsDayServer;
