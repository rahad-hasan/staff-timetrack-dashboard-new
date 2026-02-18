import { useLogInUserStore } from "@/store/logInUserStore";
import { formatInTimeZone } from "date-fns-tz";

const getUserTimeZone = () => {
  const logInUserData = useLogInUserStore.getState().logInUserData;
  return logInUserData?.timezone;
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