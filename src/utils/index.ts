import { useLogInUserStore } from "@/store/logInUserStore";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * The zone the helpers below format in when the caller passes none: the
 * signed-in user's, from the client store — in the BROWSER only.
 *
 * On the server that store is one object shared by every request the process
 * serves. It holds nobody (the persisted copy lives in localStorage), so the
 * default was silently UTC for every tenant, and anything ever written to it
 * would leak one user's zone into everyone's render. Server components must
 * pass the zone explicitly (`getViewerTimeZone()`); without one they get UTC,
 * as before, now said out loud.
 */
const getUserTimeZone = (): string => {
  if (typeof window === "undefined") return "UTC";
  const zone = useLogInUserStore.getState().logInUserData?.timezone;
  // date-fns-tz formats an empty zone as UTC as well.
  return typeof zone === "string" && zone ? zone : "UTC";
};

export const convertDecimalHoursToHMS = (decimalHours: number | null | undefined) => {
  // If duration is negative then return
  if (decimalHours === null || decimalHours === undefined || decimalHours <= 0) {
    return `00:00:00`;
  }
  // Convert decimal hours to total seconds
  const totalSeconds = Math.round(decimalHours * 3600);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format the result as "hh:mm:ss"
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
};


export const formatTZDate = (
  date: Date | string,
  timeZone = getUserTimeZone()
) => {
  return formatInTimeZone(new Date(date), timeZone, "yyyy-MM-dd");
};

export const formatTZTime = (
  date: Date | string,
  timeZone = getUserTimeZone()
) => {
  return formatInTimeZone(new Date(date), timeZone, "hh:mm a");
};

export const formatTZTimeHM = (
  date: Date | string,
  timeZone = getUserTimeZone()
) => {
  return formatInTimeZone(new Date(date), timeZone, "HH:mm");
};

export const getTZDecimalHour = (
  date: Date | string,
  timeZone = getUserTimeZone()
) => {
  const d = new Date(date);
  // Using 'H' for 24-hour format and 'm' for minutes
  const hours = parseInt(formatInTimeZone(d, timeZone, "H"));
  const minutes = parseInt(formatInTimeZone(d, timeZone, "m"));

  return hours + minutes / 60;
};

export const formatTZDayMonthYear = (
  date: string | Date | number,
  timeZone = getUserTimeZone()
): string => {
  const d = new Date(date);
  return formatInTimeZone(d, timeZone, "EEE, MMM d, yyyy");
};

export const formatTZDayMonthHourMin = (
  date: string | Date | number,
  timeZone = getUserTimeZone()
): string => {
  const d = new Date(date);
  return formatInTimeZone(d, timeZone, "EEE, MMM d, hh:mm a");
};

export const formatTZDateDMY = (
  date: Date | string,
  timeZone = getUserTimeZone()
) => {
  return formatInTimeZone(new Date(date), timeZone, "dd/MM/yyyy");
};

export const formatTZFullDate = (
  date: string | Date | number,
  timeZone = getUserTimeZone()
): string => {
  const d = new Date(date);
  return formatInTimeZone(d, timeZone, "EEEE, MMMM d, yyyy");
};


export const convertTo24Hour = (timeStr: string | undefined) => {
  if (!timeStr) return "00:00:00";

  const parts = timeStr.split(' ');
  if (parts.length !== 2) return "00:00:00";

  const [time, modifier] = parts;
  const [hoursStr, minutes] = time.split(':');

  let hours = parseInt(hoursStr, 10);
  const isPM = modifier.toLowerCase() === 'pm';
  const isAM = modifier.toLowerCase() === 'am';

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:00`;
};

export const getDuration = (start?: string, end?: string, breakInMin = 0, tz = getUserTimeZone()) => {
  if (!start || !end) return "0h";

  const startUtc = fromZonedTime(start, tz);
  const endUtc = fromZonedTime(end, tz);

  // Get total diff in ms
  let diffMs = endUtc.getTime() - startUtc.getTime();

  // Subtract break duration (convert minutes to ms: min * 60s * 1000ms)
  if (breakInMin > 0) {
    diffMs -= (breakInMin * 60 * 1000);
  }

  // Ensure we don't return negative hours if break is longer than total time
  const finalDiffMs = Math.max(0, diffMs);

  const hours = finalDiffMs / (1000 * 60 * 60);

  return `${hours.toFixed(1)} Hours`;
};