/**
 * Organization-name suggestions for the first onboarding step.
 *
 * The signed-up person's name is the only seed we have at this point: the
 * company does not exist yet, and `POST /company` is the call that creates it.
 * `verify-otp` already returns `name` alongside `email`, so the wizard can
 * offer three ready-made names the moment the step paints.
 *
 * Two properties matter more than cleverness here:
 *
 * - **Deterministic.** The step renders inside a dialog that is server-rendered
 *   on first paint, so anything random (`Math.random`, a shuffled pool, a
 *   date-seeded pick) would produce different markup on the server and the
 *   client and trip a hydration mismatch. The same seed must always give the
 *   same three names.
 * - **Always submittable.** Every suggestion is clamped to the same 2–50 bound
 *   `createOrganizationSchema` enforces, so clicking a chip can never leave the
 *   field in a state the resolver rejects. A candidate that cannot be clamped
 *   into range is dropped rather than truncated mid-word.
 */

/** Mirrors `createOrganizationSchema.name` — keep the two in step. */
const MIN_LENGTH = 2;
const MAX_LENGTH = 50;

/**
 * Ordered, not shuffled: the first three that survive validation win, so the
 * list doubles as the priority order — and `[0]` is what pre-fills the field.
 */
const SUFFIXES = ["Workspace", "Organization", "Solutions"] as const;

/**
 * "Naim" → "Naim's". Always `'s`, including after a trailing s ("James's"):
 * the bare-apostrophe form is a style choice English does not agree on, and
 * picking one consistently beats a rule that surprises half the users.
 */
const possessive = (base: string): string => `${base}'s`;

/**
 * Words that are someone's title or handle rather than part of their name.
 * Dropping them keeps "Dr. Rakhiul Islam" from becoming "Dr Solutions".
 */
const HONORIFICS = new Set([
  "mr",
  "mrs",
  "ms",
  "miss",
  "dr",
  "prof",
  "sir",
  "md",
  "mohammad",
  "mohammed",
  "muhammad",
]);

/**
 * Mailbox names that belong to a role rather than a person. "info@acme.co"
 * says nothing about who signed up, but the DOMAIN does — so these hand the
 * seed over to the domain label instead of proposing "Info Solutions".
 */
const ROLE_MAILBOXES = new Set([
  "info",
  "admin",
  "hello",
  "hi",
  "contact",
  "support",
  "team",
  "sales",
  "office",
  "billing",
  "accounts",
  "help",
  "enquiries",
  "inquiries",
  "no-reply",
  "noreply",
]);

/**
 * Strips the decoration a typed name or an email local-part tends to carry and
 * title-cases what is left. Returns [] when nothing usable survives.
 *
 * `splitHyphens` is the difference between the two sources, and it matters:
 * an email separates words with a hyphen ("jean-luc@…" is two words), but in a
 * NAME the hyphen is part of the word — splitting "Jean-Luc" produces the
 * seed "Jean" and the suggestion "Jean Luc", which is simply the wrong name.
 */
const toWords = (raw: string, splitHyphens: boolean): string[] =>
  raw
    .replace(splitHyphens ? /[._+-]+/g : /[._+]+/g, " ")
    // A trailing "92" in "rakhiul92" is noise, never part of a brand name.
    .replace(/\d+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !HONORIFICS.has(word.toLowerCase()))
    // "uxdesign" style handles are one token; leave them whole and title-case.
    // Hyphenated names keep their internal capital: "Jean-Luc", not "Jean-luc".
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-"),
    );

const clampToBounds = (candidate: string): string | null => {
  const trimmed = candidate.trim().replace(/\s+/g, " ");
  if (trimmed.length < MIN_LENGTH) return null;
  if (trimmed.length > MAX_LENGTH) return null;
  return trimmed;
};

/**
 * Three organization-name suggestions seeded from the user's name, falling
 * back to the email local-part when no name reached this step (the
 * pending-user sign-in entry point into the same dialog).
 *
 * Returns fewer than three — or none at all — rather than padding with
 * placeholders: a chip the user did not ask for is worse than a missing row,
 * and the caller hides the whole block on an empty array.
 */
export const buildOrgNameSuggestions = (
  name?: string | null,
  email?: string | null,
): string[] => {
  const fromName = toWords(name ?? "", false);

  // Only fall back to the address when the name gave us nothing — an email
  // local-part is a much weaker seed and often just repeats the name.
  let words = fromName;
  if (!words.length && email) {
    const [local = "", domain = ""] = email.split("@");
    // A role mailbox describes a function, not a person: "info@acme.co" should
    // suggest "Acme …", never "Info …". The domain's own label is the better
    // seed there, minus the public-suffix tail.
    const seed = ROLE_MAILBOXES.has(local.trim().toLowerCase())
      ? (domain.split(".")[0] ?? "")
      : local;
    words = toWords(seed, true);
  }

  if (!words.length) return [];

  // "Naim Uddin" → base "Naim". The first name reads better in a workspace
  // name than the full one, and a single-word seed uses itself.
  const owner = possessive(words[0]);

  const candidates: string[] = [];
  for (const suffix of SUFFIXES) {
    // A very long name can push "…'s Organization" past the schema's 50-char
    // bound. Dropping that one candidate is right — a truncated org name is
    // worse than one fewer suggestion.
    const clamped = clampToBounds(`${owner} ${suffix}`);
    if (clamped) candidates.push(clamped);
  }

  return Array.from(new Set(candidates)).slice(0, 3);
};
