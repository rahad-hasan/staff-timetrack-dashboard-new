export const popularTimeZoneList = Intl.supportedValuesOf("timeZone")
  .map((tz) => {
    const now = new Date();

    // Get offset like GMT+06:00
    const offsetString =
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value || "GMT+0";

    // Extract numeric offset
    const offsetMatch = offsetString.match(/GMT([+-]\d+)(?::(\d+))?/);

    let offset = "+0";

    if (offsetMatch) {
      const hours = offsetMatch[1];
      const minutes = offsetMatch[2];

      offset = minutes && minutes !== "00" ? `${hours}:${minutes}` : hours;
    }

    // Get only city name (last part)
    const city = tz.split("/").pop()?.replace(/_/g, " ") || tz;

    return {
      label: `${offset} ${city}`,
      value: tz,
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));
