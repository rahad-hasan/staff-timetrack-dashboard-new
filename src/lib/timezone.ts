import { format, isValid, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * A calendar date — `yyyy-MM-dd`, or a @db.Date the API serialized as UTC
 * midnight ("2026-09-14T00:00:00.000Z") — as LOCAL midnight of that day, read
 * from the date part only; null when there is none. Never `new Date(value)` or
 * `parseISO(value)` on the timestamp form: that instant is the previous day
 * west of UTC.
 */
export function calendarDateToLocal(value: string | null | undefined): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * A calendar date for display, from its date part only, so every zone and both
 * render passes (the server's and the browser's hydration) print the same day.
 * Formatting it as an instant printed the day before west of UTC and broke
 * hydration (#418). `fallback` when the value is empty or has no date part.
 */
export function formatCalendarDate(
  value: string | null | undefined,
  pattern = "MMM d, yyyy",
  fallback = "—",
): string {
  const date = calendarDateToLocal(value);
  return date ? format(date, pattern) : fallback;
}

/**
 * A Date whose local accessors read and write its UTC fields: date-fns then
 * formats a wall clock built as UTC milliseconds exactly, whatever the
 * runtime's zone. date-fns-tz formats through a real local Date, which cannot
 * hold a wall time that the runtime's own daylight-saving jump skips — an
 * event at 02:30 in Dhaka read "03:30" in a Los Angeles browser on its
 * spring-forward day, and the server's "02:30" failed hydration (#418).
 */
class WallClock extends Date {
  getFullYear() { return this.getUTCFullYear(); }
  getMonth() { return this.getUTCMonth(); }
  getDate() { return this.getUTCDate(); }
  getDay() { return this.getUTCDay(); }
  getHours() { return this.getUTCHours(); }
  getMinutes() { return this.getUTCMinutes(); }
  getSeconds() { return this.getUTCSeconds(); }
  getMilliseconds() { return this.getUTCMilliseconds(); }
  getTimezoneOffset() { return 0; }
  setFullYear(...args: Parameters<Date["setFullYear"]>) { return this.setUTCFullYear(...args); }
  setMonth(...args: Parameters<Date["setMonth"]>) { return this.setUTCMonth(...args); }
  setDate(...args: Parameters<Date["setDate"]>) { return this.setUTCDate(...args); }
  setHours(...args: Parameters<Date["setHours"]>) { return this.setUTCHours(...args); }
  setMinutes(...args: Parameters<Date["setMinutes"]>) { return this.setUTCMinutes(...args); }
  setSeconds(...args: Parameters<Date["setSeconds"]>) { return this.setUTCSeconds(...args); }
  setMilliseconds(...args: Parameters<Date["setMilliseconds"]>) { return this.setUTCMilliseconds(...args); }
}

/**
 * An INSTANT (ISO timestamp, epoch ms or Date) for display in `zone` — the
 * viewer's, `useViewerTimeZone()` in client components. The twin of
 * formatCalendarDate for timestamps: formatting one in the runtime's own zone
 * printed the server's day in the HTML and the browser's after hydration
 * (#418 whenever they differ), and neither is the viewer's. Exact in every
 * runtime zone (see WallClock), so the server and the browser print the same;
 * `pattern` cannot name the zone (z/x/O tokens would read UTC). `fallback`
 * when the value is empty or not a date; an unknown zone falls back to UTC.
 */
export function formatInstant(
  value: string | number | Date | null | undefined,
  zone: string,
  pattern = "MMM d, yyyy",
  fallback = "—",
): string {
  if (value === null || value === undefined || value === "") return fallback;
  const instant = new Date(value).getTime();
  if (Number.isNaN(instant)) return fallback;
  return format(new WallClock(instant + zoneOffset(instant, knownZone(zone))), pattern);
}

/**
 * A `yyyy-MM-dd` URL/query value as LOCAL midnight of that calendar day, or
 * `fallback` when it is missing or not a real date.
 *
 * Never `new Date("yyyy-MM-dd")`: date-only strings are parsed as UTC
 * midnight, which in any browser west of UTC is the PREVIOUS local day — a
 * month picker on "2026-11-01" would label October and its "next" arrow would
 * recompute the same month forever. date-fns `parseISO` reads a date-only
 * string as local time (and a full ISO timestamp as its exact instant).
 */
export function parseDateParam(value: string | null | undefined): Date | null;
export function parseDateParam(value: string | null | undefined, fallback: Date): Date;
export function parseDateParam(
  value: string | null | undefined,
  fallback: Date | null = null,
): Date | null {
  if (!value) return fallback;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : fallback;
}

/**
 * The most zones each cache below holds; a full cache starts over. A zone
 * can come from `?timezone` or a cookie, so any string, and Intl accepts
 * every upper/lower-case spelling of a name: neither cache may grow with
 * what requests send (a formatter per spelling grew the server by ~33 KB
 * each: 670 MB for 20,000 spellings).
 */
const MAX_CACHED_ZONES = 1000;

function remember<T>(cache: Map<string, T>, zone: string, value: T): T {
  if (cache.size >= MAX_CACHED_ZONES) cache.clear();
  cache.set(zone, value);
  return value;
}

/** Each spelling seen → the zone Intl resolves it to, null for none. */
const zoneNames = new Map<string, string | null>();

/**
 * The one name Intl resolves `zone` to, whatever its letter case or alias
 * ("asia/dhaka" → "Asia/Dhaka"), or null when it is not a time zone. Checking
 * builds an Intl.DateTimeFormat (~0.1 ms), and every formatted date asks.
 */
function canonicalZone(zone: string): string | null {
  if (!zone) return null; // Intl would read a missing zone as the runtime's
  let name = zoneNames.get(zone);
  if (name === undefined) {
    try {
      name = new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
    } catch {
      name = null;
    }
    remember(zoneNames, zone, name);
  }
  return name;
}

/** True for any IANA zone this runtime can format in (e.g. "Asia/Dhaka"). */
export function isValidTimeZone(zone: string): boolean {
  return canonicalZone(zone) !== null;
}

/** The zone to compute in: `zone`'s canonical name, UTC for an unknown one. */
function knownZone(zone: string): string {
  return canonicalZone(zone) ?? "UTC";
}

/**
 * The current calendar date in `zone` (default pattern `yyyy-MM-dd`, the
 * format every date query parameter uses). An unknown zone falls back to UTC
 * rather than throwing.
 */
export function todayIn(zone: string, pattern = "yyyy-MM-dd"): string {
  return formatInstant(Date.now(), zone, pattern);
}

const DAY_MS = 86_400_000;
/** The last instant a Date can hold. */
const MAX_TIME = 8.64e15;

/** A zone's wall-clock formatter, and one UTC day it holds a single offset across. */
interface ZoneClock {
  format: Intl.DateTimeFormat;
  /** start of that UTC day; NaN until one is found */
  dayStart: number;
  offset: number;
}

/** By canonical zone name. */
const zoneClocks = new Map<string, ZoneClock>();

/** The zone's offset at `instant`, read from Intl. */
function readOffset(clock: ZoneClock, instant: number): number {
  const part: Record<string, number> = {};
  for (const { type, value } of clock.format.formatToParts(instant)) {
    part[type] = Number(value);
  }
  const wholeSecond = instant - (((instant % 1000) + 1000) % 1000);
  return (
    Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second) -
    wholeSecond
  );
}

/**
 * How far `zone`'s clocks are ahead of UTC at `instant`, in ms, read from
 * Intl itself. date-fns-tz goes through a LOCAL Date instead, and a local
 * Date cannot hold a wall time that the browser's own daylight-saving jump
 * skips. `zone` must be a knownZone().
 *
 * A read costs ~20 µs and a long support thread asks once per row, so each
 * zone keeps the last UTC day whose two ends read the same offset: the whole
 * day has it, as no zone changes its offset twice within a day (the closest
 * two changes in the tz database are four days apart). A thread then costs
 * about two reads per day it spans.
 */
function zoneOffset(instant: number, zone: string): number {
  const clock =
    zoneClocks.get(zone) ??
    remember(zoneClocks, zone, {
      format: new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }),
      dayStart: Number.NaN,
      offset: 0,
    });
  if (instant >= clock.dayStart && instant < clock.dayStart + DAY_MS) return clock.offset;
  const dayStart = instant - (((instant % DAY_MS) + DAY_MS) % DAY_MS);
  const offset = readOffset(clock, dayStart);
  if (dayStart + DAY_MS <= MAX_TIME && readOffset(clock, dayStart + DAY_MS) === offset) {
    clock.dayStart = dayStart;
    clock.offset = offset;
    return offset;
  }
  return readOffset(clock, instant); // the day its clocks change
}

/**
 * The instant at which `zone`'s clocks show `wallClock` (that wall time as
 * Date.UTC milliseconds). A time skipped by a daylight-saving jump comes out
 * past the jump, as in a JS local Date (02:30 → 03:30): date-fns-tz moved it
 * back instead, which for a zone that jumps at midnight (Chile, Cuba, the
 * Azores) was the PREVIOUS day. A repeated time is its first occurrence, as
 * in a local Date, so for a browser in `zone` this is exactly the local
 * Date's own instant.
 */
function wallClockToInstant(wallClock: number, zone: string): Date {
  if (!Number.isFinite(wallClock)) return new Date(Number.NaN);
  // Read with the offsets in force a day before and a day after: the only
  // candidates when a daylight-saving change is near, one and the same
  // otherwise.
  const before = wallClock - zoneOffset(wallClock - DAY_MS, zone);
  const after = wallClock - zoneOffset(wallClock + DAY_MS, zone);
  if (before + zoneOffset(before, zone) === wallClock) return new Date(before);
  if (after + zoneOffset(after, zone) === wallClock) return new Date(after);
  return new Date(before); // skipped: read with the earlier offset, it lands past the jump
}

/** A Date's local fields (what a date picker shows) as Date.UTC milliseconds. */
const localWallClock = (date: Date): number =>
  Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );

/**
 * The calendar day (`yyyy-MM-dd`) an instant falls on in `zone`, the
 * viewer's: exact in every zone, and cheap enough for each row of a long
 * list (see zoneOffset). `""` when it is not a date; an unknown zone falls
 * back to UTC.
 */
export function instantDay(value: string | number | Date, zone: string): string {
  const instant = new Date(value).getTime();
  if (Number.isNaN(instant)) return "";
  return new Date(instant + zoneOffset(instant, knownZone(zone))).toISOString().slice(0, 10);
}

/**
 * An API instant (a task deadline, a project or event start) as a date
 * picker's value: a Date whose LOCAL fields are the instant's wall clock in
 * `zone`, the viewer's. react-day-picker and a `toLocaleDateString()` label
 * work in local fields, so they then show the day every table shows for it.
 * `new Date(value)` showed the BROWSER's day instead, a day off whenever the
 * two zones put the instant on different dates. `undefined` when the value is
 * empty or not a date. The day is always exact; the time of day is an hour
 * off inside an hour that a daylight-saving change repeats, or that the
 * browser's zone skips (a local Date cannot hold it), so send the value back
 * through pickerDateToInstant with its `original`.
 */
export function instantToPickerDate(
  value: string | Date | null | undefined,
  zone: string,
): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : toZonedTime(date, knownZone(zone));
}

/**
 * The instant a date picker's value means on `zone`'s clock, the viewer's:
 * its local fields read as that wall time. A newly picked day (local
 * midnight) becomes that day's start for the viewer, so every table shows the
 * day that was picked; `toISOString()` sent the browser's midnight, the
 * previous day for a viewer west of the browser. Exactly the old
 * `toISOString()` whenever the browser is in the viewer's zone.
 *
 * `original` is the API instant the picker was prefilled from: while the
 * picker still shows its day, it goes back unchanged, so a date the user
 * leaves alone is saved exactly as it came (see instantToPickerDate).
 */
export function pickerDateToInstant(
  date: Date,
  zone: string,
  original?: string | Date | null,
): Date {
  const wallClock = localWallClock(date);
  if (
    original &&
    Number.isFinite(wallClock) &&
    instantDay(original, zone) === new Date(wallClock).toISOString().slice(0, 10)
  ) {
    return new Date(original);
  }
  return wallClockToInstant(wallClock, knownZone(zone));
}

/**
 * The instant of a picked day at a typed `time` ("HH:mm" or "HH:mm:ss") on
 * `zone`'s clock, the viewer's: an event's start or end. Built from the day
 * and the text, never with setHours() on the browser-local picker date, which
 * moved a time inside the BROWSER's daylight-saving gap an hour on.
 * `original` (the instant the dialog was prefilled from) goes back unchanged
 * while the day and time are still the ones the dialog showed for it, in
 * `formatInstant(original, zone, "HH:mm:ss")`.
 */
export function pickerDateTimeToInstant(
  date: Date,
  time: string,
  zone: string,
  original?: string | Date | null,
): Date {
  const [hours, minutes, seconds = 0] = time.split(":").map(Number);
  const wallClock = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
  );
  if (!Number.isFinite(wallClock)) return new Date(Number.NaN);
  const typed = new Date(wallClock).toISOString().slice(0, 19).replace("T", " ");
  if (original && formatInstant(original, zone, "yyyy-MM-dd HH:mm:ss", "") === typed) {
    return new Date(original);
  }
  return wallClockToInstant(wallClock, knownZone(zone));
}

/**
 * The last instant of a picked day on `zone`'s clock, the viewer's: a
 * deadline that runs to the end of the day. One millisecond before the next
 * day starts there, not 23:59:59.999 read as a wall time: a zone whose clocks
 * jump forward at 23:00 (Greenland) skips that time, which then landed in the
 * NEXT day, and one that falls back at midnight (Chile) shows it twice.
 */
export function pickerDayEndToInstant(date: Date, zone: string): Date {
  const nextDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return new Date(wallClockToInstant(nextDay, knownZone(zone)).getTime() - 1);
}
