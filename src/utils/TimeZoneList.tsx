const generateTimeZones = () => {
  const now = new Date();

  return Intl.supportedValuesOf("timeZone")
    .map((tz) => {
      const offsetString =
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          timeZoneName: "shortOffset",
        })
          .formatToParts(now)
          .find((part) => part.type === "timeZoneName")?.value || "GMT+0";

      const offsetMatch = offsetString.match(/GMT([+-]\d+)(?::(\d+))?/);

      let offset = "+0";

      if (offsetMatch) {
        const hours = offsetMatch[1];
        const minutes = offsetMatch[2];
        offset = minutes && minutes !== "00" ? `${hours}:${minutes}` : hours;
      }

      const city = tz.split("/").pop()?.replace(/_/g, " ") || tz;

      return {
        label: `${offset} ${city}`,
        value: tz,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const popularTimeZoneList = generateTimeZones();
