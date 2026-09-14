"use client";

interface OrgNameSuggestionsProps {
  /** Already clamped to the schema's 2–50 bound by `buildOrgNameSuggestions`. */
  suggestions: string[];
  onPick: (name: string) => void;
  disabled?: boolean;
}

/**
 * "Need inspiration?" chips under the organization-name field.
 *
 * The seed is the signed-up person's name (or, failing that, their email
 * local-part), so there is nothing to offer for a user who reached the wizard
 * with neither. That is the common case for the login-page entry point, and an
 * empty row with a dangling prompt reads as a broken component — so the whole
 * block disappears rather than shrinking.
 *
 * Real `<button type="button">`s, not spans: they sit inside the wizard's
 * single shared `<form>`, where a bare `<button>` would default to `submit`
 * and advance the step instead of filling the field.
 */
const OrgNameSuggestions = ({
  suggestions,
  onPick,
  disabled,
}: OrgNameSuggestionsProps) => {
  if (!suggestions.length) return null;

  return (
    <div className="pt-1.5">
      <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
        Need inspiration? Try one of these
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            // The visible label is the name alone, which on its own says
            // nothing about what clicking does — spell that out for screen
            // readers.
            aria-label={`Use suggested name ${suggestion}`}
            // Keep focus in the name input instead of taking it.
            //
            // The form validates `onTouched`, and the name field is
            // autofocused — so a plain click BLURRED it while it was still
            // empty, which fired the resolver and flashed "Organization name
            // must be at least 2 characters long" a frame before the click
            // handler filled it in. Suppressing the default mousedown focus
            // shift removes that blur entirely, and leaves the caret in the
            // field so the picked name can be edited straight away.
            //
            // Keyboard users are unaffected: Tab still moves focus here, and
            // an empty required field complaining when you tab off it is
            // correct — Enter then fills it and clears the message.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(suggestion)}
            className="cursor-pointer rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors outline-none hover:bg-primary/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-primary/20 dark:hover:bg-primary/30"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrgNameSuggestions;
