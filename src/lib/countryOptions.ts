import { countryDialCodes } from "@/utils/CountryCodeList";
import { countryFromTimeZone } from "@/utils/TimeZoneCountries";
import type { ComboboxOption } from "@/components/Common/ComboboxField";

/**
 * Country options for the checkout "Select Country" field.
 *
 * The list is reused from the phone field's dialling table rather than adding a
 * second country list to drift out of sync — but that table is keyed on what
 * `libphonenumber-js` can parse, which is not quite ISO 3166-1. Three of its
 * entries are dialling regions Stripe rejects as a billing country, and sending
 * one produces an opaque `parameter_invalid` on confirm rather than a field
 * error the user can act on, so they are filtered out here instead.
 */
const NON_ISO_3166_REGIONS = new Set(["AC", "TA"]);

export const countryOptions: readonly ComboboxOption[] = countryDialCodes
  .filter((country) => !NON_ISO_3166_REGIONS.has(country.iso2))
  .map((country) => ({ value: country.iso2, label: country.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const SUPPORTED_ISO2 = new Set(countryOptions.map((option) => option.value));

/**
 * Best guess at the user's billing country, from the browser's time zone.
 *
 * MUST be called from a post-mount effect, never during render: the server has
 * no time zone to resolve and would emit a different default than the browser,
 * which is exactly the hydration mismatch `PhoneNumberField` already works
 * around the same way.
 */
export const detectBillingCountry = (): string => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const iso2 = countryFromTimeZone(zone);
    return iso2 && SUPPORTED_ISO2.has(iso2) ? iso2 : "";
  } catch {
    return "";
  }
};

export const countryNameFromIso2 = (iso2: string | null | undefined): string =>
  countryOptions.find((option) => option.value === iso2)?.label ?? "";
