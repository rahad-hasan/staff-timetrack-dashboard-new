import { formatInTimeZone } from "date-fns-tz";
import { isValidTimeZone } from "@/lib/timezone";

/*
 * The one billing helper that needs a date library, kept apart from
 * ./billing so that importing a billing constant or predicate does not bundle
 * date-fns-tz with it (see the note in that file).
 */

/**
 * Billing dates are calendar dates ("Feb 1, 2027") of an instant, read in an
 * explicit zone: the viewer's (`useViewerTimeZone()` in client components).
 *
 * The zone is required on purpose. These used to be formatted in the
 * runtime's own zone: the Node process's on the server, the browser's after
 * hydration. Once the layout began server-rendering the trial banner, a trial
 * ending at 20:00 UTC printed "Nov 20" in the HTML and "Nov 21" in a Dhaka
 * browser, and React re-rendered the whole document on every load.
 */
export const formatBillingDate = (
  iso: string | null | undefined,
  timeZone: string,
): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return formatInTimeZone(
    d,
    isValidTimeZone(timeZone) ? timeZone : "UTC",
    "MMM d, yyyy",
  );
};
