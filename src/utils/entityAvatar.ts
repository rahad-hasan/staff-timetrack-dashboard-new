/**
 * Deterministic initials and chip colour for anything we have no artwork for —
 * a tracked app with no bundled logo, a site whose favicon does not exist.
 *
 * The colour is derived from the label itself, so an entry keeps the same chip
 * on every render, for every viewer, in every table; seeding it from the row
 * index instead would reshuffle every colour on sort.
 */

// Spelled out in full because Tailwind only detects complete class strings.
const PALETTE = [
  "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
  "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200",
  "bg-fuchsia-500/10 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
  "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
];

/** FNV-1a: cheap, stable across runtimes, and spreads short labels well. */
const hash = (value: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

export const getAvatarPalette = (label?: string | null) =>
  PALETTE[hash((label ?? "").trim().toLowerCase()) % PALETTE.length];

/** "Task Manager" -> TM, "Firefox" -> FI, "" -> ? */
export const getInitials = (label?: string | null) => {
  const [first, second] = (label ?? "").match(/[a-z0-9]+/gi) ?? [];
  if (!first) return "?";

  const initials = second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2);
  return initials.toUpperCase();
};

const tokenize = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [];

const containsSequence = (tokens: string[], needle: string[]) =>
  tokens.some((_, start) => needle.every((word, i) => tokens[start + i] === word));

/**
 * Looks a label up in a keyword table by whole words rather than raw substrings
 * — "Wordpad" is not Word and "Discourse" is not Discord — and lets the most
 * specific key win, so "Android Studio" beats a bare "studio" however the table
 * happens to be ordered.
 */
export const matchByWords = <T,>(
  label: string,
  table: Record<string, T>,
): T | null => {
  const tokens = tokenize(label);
  let match: T | null = null;
  let matchedWords = 0;

  for (const [key, value] of Object.entries(table)) {
    const needle = tokenize(key);
    if (!needle.length || needle.length <= matchedWords) continue;

    if (containsSequence(tokens, needle)) {
      match = value;
      matchedWords = needle.length;
    }
  }

  return match;
};
