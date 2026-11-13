import { getTimezones } from "@/actions/dashboard/action";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";

/**
 * The timezone picker, with its options read on the server.
 *
 * A component of its own so a page can put it behind <Suspense>: the zone
 * list used to be awaited by the page itself, which held back the filter bar
 * and the data request below it for one more serial backend round trip.
 */
const TimezoneFilter = async () => {
  const timezones = await getTimezones();
  return <SelectTimezoneDropDown timezones={timezones} />;
};

/** Holds the picker's place (same height and width) while its options load. */
export const TimezoneFilterFallback = () => (
  <div
    aria-hidden
    className="h-10 w-[90px] shrink-0 rounded-[8px] border border-borderColor dark:border-darkBorder bg-[#f6f7f9] dark:bg-darkPrimaryBg animate-pulse"
  />
);

export default TimezoneFilter;
