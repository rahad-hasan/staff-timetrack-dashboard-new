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