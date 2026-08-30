"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import parsePhoneNumberFromString, {
  type CountryCode,
} from "libphonenumber-js";
import { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  countryDialCodes,
  DEFAULT_PHONE_COUNTRY,
  findCountryByDialCode,
  findCountryByIso2,
  type CountryDialCode,
} from "@/utils/CountryCodeList";
import { countryFromTimeZone } from "@/utils/TimeZoneCountries";

const fallbackCountry =
  findCountryByIso2(DEFAULT_PHONE_COUNTRY) ?? countryDialCodes[0];

/**
 * Where the browser thinks this person is, for pre-selecting an empty field.
 *
 * The time zone comes first because it reflects the machine's actual location;
 * `navigator.language` is the backstop, and it is only a hint — plenty of
 * people outside the US run an "en-US" browser.
 */
const detectCountry = (): CountryDialCode | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const fromTimeZone = findCountryByIso2(
      countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    );

    if (fromTimeZone) {
      return fromTimeZone;
    }

    const locales = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];

    for (const locale of locales) {
      const fromLocale = findCountryByIso2(
        new Intl.Locale(locale).maximize().region,
      );

      if (fromLocale) {
        return fromLocale;
      }
    }
  } catch {
    // A browser without full Intl data just gets the fallback country.
  }

  return undefined;
};

/**
 * Which country a stored number belongs to.
 *
 * Only an international number identifies a country, so anything without a
 * leading "+" is left undecided and the caller keeps whatever is selected. The
 * dial-code prefix match is the fallback for a half-typed number that
 * `parsePhoneNumberFromString` cannot resolve yet.
 */
const countryFromValue = (value: string): CountryDialCode | undefined => {
  const trimmed = value.trim();

  if (!trimmed.startsWith("+")) {
    return undefined;
  }

  return (
    findCountryByIso2(parsePhoneNumberFromString(trimmed)?.country) ??
    findCountryByDialCode(trimmed)
  );
};

/** The stored number minus its dialling code — what the text input shows. */
const toNationalDigits = (value: string, country: CountryDialCode) => {
  const digits = value.replace(/\D/g, "");

  return digits.startsWith(country.dialCode)
    ? digits.slice(country.dialCode.length)
    : digits;
};

/**
 * Dialling code + national digits, which is what the API stores and what
 * `requiredPhone`/`optionalPhone` validate against.
 *
 * An empty national part collapses to "" rather than a bare "+880": on an
 * optional field a lone dialling code would fail the format check even though
 * the user never entered a number, and on a required one it would report the
 * format error instead of "Phone number is required".
 */
const toStoredValue = (country: CountryDialCode, digits: string) =>
  digits ? `+${country.dialCode}${digits}` : "";

interface PhoneNumberInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "onBlur" | "className" | "ref" | "type"
  > {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** Pins the country for an empty field instead of detecting the browser's. */
  defaultCountry?: CountryCode;
  invalid?: boolean;
  /** Extra classes for the bordered group wrapping select + input. */
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Country picker glued to a phone input, sharing one border.
 *
 * The pair reads and writes a single E.164 string, so every form keeps one
 * `phone` field and the country code always travels with the number to the
 * backend. The selected country is state rather than a pure derivation, so it
 * survives an empty input; it re-syncs when the form value is replaced from
 * outside (a `form.reset` once a record loads).
 *
 * An empty field starts on the browser's own country, and an existing number
 * always wins over that guess.
 */
export const PhoneNumberInput = ({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "Enter Phone Number",
  defaultCountry,
  invalid,
  className,
  inputRef,
  // `FormControl` clones its child with `id` / `aria-describedby` /
  // `aria-invalid`; those belong on the text input, not on the wrapper.
  ...inputProps
}: PhoneNumberInputProps) => {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<CountryDialCode>(
    () =>
      countryFromValue(value) ??
      findCountryByIso2(defaultCountry) ??
      fallbackCountry,
  );

  // Detect after mount rather than during render: the server has no browser to
  // ask, so choosing there would paint one flag on the server and another on
  // hydration. Runs once — a later pick by the user must not be second-guessed.
  const detected = useRef(false);

  useEffect(() => {
    if (detected.current) {
      return;
    }

    detected.current = true;

    if (defaultCountry || value) {
      return;
    }

    const guess = detectCountry();

    if (guess) {
      setCountry(guess);
    }
  }, [defaultCountry, value]);

  // Compare dialling codes, not ISO codes: +1 covers the US and Canada (as +7
  // does Russia and Kazakhstan), and parsing "+1…" answers "US", which would
  // otherwise snap a Canadian pick straight back on the next keystroke.
  useEffect(() => {
    const parsed = countryFromValue(value);

    if (parsed && parsed.dialCode !== country.dialCode) {
      setCountry(parsed);
    }
  }, [value, country.dialCode]);

  const nationalDigits = toNationalDigits(value, country);

  const handleCountrySelect = (next: CountryDialCode) => {
    setCountry(next);
    setOpen(false);
    onChange(toStoredValue(next, nationalDigits));
  };

  const handleInputChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");

    // A pasted "+880 17…" is a whole international number, not a national one:
    // prefixing the selected dialling code again would double it. Let the
    // number choose its own country instead.
    if (raw.trim().startsWith("+")) {
      const pasted = digits ? `+${digits}` : "";
      const picked = countryFromValue(pasted);

      if (picked) {
        setCountry(picked);
      }

      onChange(pasted);
      return;
    }

    onChange(toStoredValue(country, digits));
  };

  /**
   * Tidy the number once the user is done with it, never mid-keystroke.
   *
   * Two habits need fixing and both would be hostile to correct while typing:
   * the local trunk prefix ("01712345678" for Bangladesh, which E.164 drops but
   * Italy keeps — so `libphonenumber-js` decides, not a hand-rolled rule), and
   * a full international number pasted without its "+".
   */
  const handleBlur = () => {
    if (nationalDigits) {
      const national = parsePhoneNumberFromString(nationalDigits, country.iso2);
      const parsed = national?.isValid()
        ? national
        : parsePhoneNumberFromString(`+${nationalDigits}`);

      if (parsed?.isValid()) {
        const picked = findCountryByIso2(parsed.country);

        if (picked && picked.dialCode !== country.dialCode) {
          setCountry(picked);
        }

        if (parsed.number !== value) {
          onChange(parsed.number);
        }
      }
    }

    onBlur?.();
  };

  return (
    <div
      className={cn(
        "border-input dark:border-darkBorder dark:bg-darkPrimaryBg flex min-h-10 items-stretch rounded-lg border bg-transparent",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        invalid &&
          "border-destructive ring-destructive/20 dark:ring-destructive/40",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Select country calling code"
            disabled={disabled}
            className="border-input dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l-lg border-r px-3 text-sm outline-none disabled:cursor-not-allowed"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="tabular-nums">+{country.dialCode}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="dark:bg-darkSecondaryBg dark:border-darkBorder w-[min(20rem,var(--radix-popover-content-available-width))] p-0"
        >
          <Command className="dark:bg-darkSecondaryBg">
            <CommandInput placeholder="Search country or code..." />
            <CommandList className="no-scrollbar max-h-60 overflow-y-auto scroll-smooth">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryDialCodes.map((option) => (
                  <CommandItem
                    // Name, ISO code and dialling code all live in the search
                    // value so "Bangladesh", "BD" and "+880" all find the row.
                    key={option.iso2}
                    value={`${option.name} ${option.iso2} +${option.dialCode}`}
                    onSelect={() => handleCountrySelect(option)}
                    className="hover:dark:bg-darkPrimaryBg cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        option.iso2 === country.iso2
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className="mr-2 text-base leading-none">
                      {option.flag}
                    </span>
                    <span className="truncate">{option.name}</span>
                    <span className="text-subTextColor dark:text-darkTextSecondary ml-auto shrink-0 tabular-nums">
                      +{option.dialCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        {...inputProps}
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        placeholder={placeholder}
        value={nationalDigits}
        onBlur={handleBlur}
        onChange={(event) => handleInputChange(event.target.value)}
        className="placeholder:text-muted-foreground dark:text-darkTextPrimary w-full min-w-0 self-stretch rounded-r-lg bg-transparent px-3 py-1 text-base outline-none disabled:cursor-not-allowed md:text-sm"
      />
    </div>
  );
};

interface PhoneNumberFieldProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultCountry?: CountryCode;
  /** Classes for the `FormItem`, e.g. grid spans. */
  className?: string;
  /** Classes for the bordered select + input group. */
  inputClassName?: string;
}

/**
 * `PhoneNumberInput` bound to a react-hook-form field. Drop-in replacement for
 * the plain `<Input name="phone" />` the forms used to render.
 */
const PhoneNumberField = <TValues extends FieldValues>({
  control,
  name,
  label = "Phone Number",
  required = false,
  disabled,
  placeholder,
  defaultCountry,
  className,
  inputClassName,
}: PhoneNumberFieldProps<TValues>) => (
  <FormField
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <FormItem className={className}>
        {label ? <FormLabel required={required}>{label}</FormLabel> : null}
        <FormControl>
          <PhoneNumberInput
            name={field.name}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            disabled={disabled ?? field.disabled}
            placeholder={placeholder}
            defaultCountry={defaultCountry}
            invalid={Boolean(fieldState.error)}
            className={inputClassName}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default PhoneNumberField;
