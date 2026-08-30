"use client";

import { Input } from "@/components/ui/input";

interface NumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value?: unknown;
  /** Receives `NaN` while the box is empty — never a substituted number. */
  onChange: (value: number) => void;
}

/**
 * `<Input type="number">` that can actually be emptied.
 *
 * Two habits made the old hand-rolled versions impossible to clear, and both
 * look identical to the user — the digit they just deleted reappears:
 *
 * - Reporting an empty box as `undefined`. react-hook-form's `get()` treats an
 *   `undefined` field as "not set" and answers with the value from
 *   `defaultValues`, so the field bounced straight back to 10 (or to whatever
 *   the record was loaded with) on the keystroke that emptied it.
 * - Reporting it as `0` / `1`, which is the same substitution done by hand.
 *
 * `NaN` is what an empty `<input type="number">` already reports through
 * `valueAsNumber`, it is not `undefined` so react-hook-form stores it as-is,
 * and Zod rejects it exactly like a missing number — so an empty box shows the
 * field's own "required" message instead of silently submitting a number the
 * user never typed.
 */
const NumberInput = ({ value, onChange, ...props }: NumberInputProps) => (
  <Input
    {...props}
    type="number"
    // NaN, undefined and null all mean "nothing to show"; passing them
    // straight to the DOM would make React drop the input to uncontrolled.
    value={typeof value === "number" && Number.isFinite(value) ? value : ""}
    onChange={(event) => onChange(event.target.valueAsNumber)}
  />
);

export default NumberInput;
