import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";
import { ISearchParamsProps } from "@/types/type";
import PayrollGenerateFormClient from "./PayrollGenerateFormClient";

/** A lone query value as a whole number within [min, max], else undefined. */
const parsePeriodPart = (value: unknown, min: number, max: number) => {
  if (typeof value !== "string" || !/^\d{1,4}$/.test(value)) return undefined;
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? parsed : undefined;
};

/**
 * The generate form, with the viewer's today read once, here on the server,
 * for its default period (the month before) and its year list. Read in the
 * client form, the server render and the hydration each took their own clock:
 * whenever those fell in different months (a browser clock a few minutes fast
 * at the end of a month, or a request crossing the viewer's midnight on the
 * 1st), the HTML named one period and the browser another (#418).
 *
 * `?month=&year=` opens the form on that period instead: a run's "Regenerate"
 * links here with its own. Unread, the form opened on last month whatever run
 * was being regenerated, one click from generating that month. Both must be
 * valid (the form schema's ranges), or the default period stands.
 */
const PayrollGenerateForm = async ({ searchParams }: ISearchParamsProps) => {
  const [params, timeZone] = await Promise.all([
    searchParams,
    getViewerTimeZone(),
  ]);
  const month = parsePeriodPart(params.month, 1, 12);
  const year = parsePeriodPart(params.year, 2000, 2100);
  const period = month && year ? { month, year } : undefined;

  return (
    <PayrollGenerateFormClient
      // The form reads its period once, on mount. The page stays mounted when
      // only the query changes, so another period needs another form.
      key={period ? `${period.year}-${period.month}` : "default"}
      today={todayIn(timeZone)}
      period={period}
    />
  );
};

export default PayrollGenerateForm;
