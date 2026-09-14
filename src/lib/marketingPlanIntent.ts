import { isFreePlan } from "@/lib/billing";
import {
  BILLING_CYCLES,
  type BillingCycle,
  type IBillingPlan,
} from "@/types/billing";

/**
 * The plan a visitor already chose on the marketing site, as it travels through
 * signup.
 *
 * The marketing pricing page links straight into
 * `/auth/verify-otp?email=…&plan=2&trail=false`, which means the choice is made
 * BEFORE the account, the company or any session exists. Signup then walks two
 * more hops (`/auth/create-organization` → `/onboarding/choose-plan`) and the
 * choice has to survive both of them, because showing the plan grid to someone
 * who already clicked a plan is asking the same question twice.
 *
 * Everything here is deliberately pure — no React, no `next/navigation` — for
 * two reasons: the same parse has to run in a client component (`useSearchParams`)
 * and in a server page (`await searchParams`), and a parser for untrusted URL
 * input is only worth anything if it is trivial to test in isolation.
 *
 * **Nothing in the URL is trusted.** These params are *intent*, never
 * authorisation: anyone can type `?plan=99`. The parse below only establishes
 * SHAPE; `describeMarketingPlanIntent` (and `resolveMarketingPlanIntent`, its
 * yes/no view) is what decides a plan is real, sold, and sold on the requested
 * cycle, and every failure falls back to the ordinary plan picker rather than
 * to a dead end or a checkout that cannot succeed.
 */

/**
 * `trail` is the marketing site's typo for `trial`. Both spellings are accepted
 * and normalised to one boolean here so the typo never leaks past this module;
 * the marketing site should migrate to `trial`, after which the legacy key can
 * be deleted from this list and nothing else has to change.
 */
const TRIAL_KEYS = ["trial", "trail"] as const;

const PLAN_KEY = "plan";
const CYCLE_KEY = "cycle";

/** The key the serialiser writes for the trial flag — the correct spelling. */
const CANONICAL_TRIAL_KEY = "trial";

/**
 * Spellings of "yes", compared after trimming and lowercasing. Anything
 * unrecognised ("maybe", "1.0") is NOT a trial — see `parseMarketingPlanIntent`
 * for why that is the safe side to fail to.
 *
 * `""` is deliberately NOT in here. A valueless flag is ambiguous — it is
 * either a hand-typed `?trial` or a marketing template that rendered nothing —
 * so it cannot be decided by the value alone; `parseTrialFlag` decides it
 * against the `plan` param instead.
 */
const TRUTHY = new Set(["true", "1", "yes", "y", "on"]);

/**
 * Both shapes a Next.js route hands out query params in: `URLSearchParams`
 * (client, via `useSearchParams`) and the awaited `searchParams` record
 * (server pages, where a repeated key arrives as an array).
 */
export type MarketingPlanIntentSource =
  URLSearchParams | Record<string, string | string[] | undefined>;

/** A parsed, normalised marketing intent. Shape-valid only — not resolved. */
export interface MarketingPlanIntent {
  /** Positive integer plan id, or null when absent/unparseable. */
  planId: number | null;
  /** One of the three real cycles, or null when the site sent none. */
  cycle: BillingCycle | null;
  /** `trial`/`trail` normalised. True = the visitor asked for the trial. */
  isTrial: boolean;
}

/** No plan, no flag — an ordinary signup. */
export const EMPTY_MARKETING_PLAN_INTENT: MarketingPlanIntent = {
  planId: null,
  cycle: null,
  isTrial: false,
};

const readParam = (
  source: MarketingPlanIntentSource | null | undefined,
  key: string,
): string | null => {
  if (!source) return null;

  if (typeof (source as URLSearchParams).get === "function") {
    return (source as URLSearchParams).get(key);
  }

  // Server `searchParams`: a repeated key (`?plan=2&plan=3`) arrives as an
  // array. First one wins — the same rule the checkout page already applies.
  const raw = (source as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
};

/**
 * Plan ids are database keys, so only a plain run of digits can be one. The
 * shape is tested before the conversion because `Number` is far too generous
 * for URL input: `""`, `"2.5"`, `"2e3"`, `"0x2"`, `"+2"` and `"Infinity"` all
 * become numbers, and `2e3`/`0x2`/`+2` are integers too — so an
 * `Number.isInteger` guard alone still hands nonsense ids to a catalog lookup
 * that can only answer "not found" three screens later. Once the digits are
 * confirmed, the conversion only has to decide magnitude.
 */
const parsePlanId = (raw: string | null): number | null => {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const value = Number(trimmed);
  if (value <= 0 || value > Number.MAX_SAFE_INTEGER) return null;
  return value;
};

/**
 * A cycle is only honoured when it is one of the three the product actually
 * bills on. An unknown cadence is dropped rather than coerced to monthly: the
 * plan's own default is a better guess than a value we failed to understand.
 */
const parseCycle = (raw: string | null): BillingCycle | null => {
  if (raw === null) return null;
  const value = raw.trim().toLowerCase() as BillingCycle;
  return BILLING_CYCLES.includes(value) ? value : null;
};

/**
 * The trial flag's raw value, whichever spelling carried it.
 *
 * An EXPLICIT value wins over a blank one regardless of key order, so
 * `?trial=&trail=true` is a trial: the two spellings are one logical flag that
 * this module merges, and a template that rendered one of them and not the
 * other has still told us what the visitor clicked. Among explicit values the
 * first spelling in `TRIAL_KEYS` wins, and a blank is only returned when every
 * spelling present is blank (which is still information — see
 * `parseMarketingPlanIntent`).
 *
 * A REPEATED key (`?trial=&trial=true`) is a different animal and keeps
 * `readParam`'s first-one-wins rule: that is a duplicate of one key, and its
 * tie-break is shared with `plan`, `cycle` and the checkout page.
 */
const readTrialParam = (
  source: MarketingPlanIntentSource | null | undefined,
): string | null => {
  let blank: string | null = null;

  for (const key of TRIAL_KEYS) {
    const raw = readParam(source, key);
    if (raw === null) continue;
    if (raw.trim() !== "") return raw;
    blank ??= raw;
  }

  return blank;
};

/**
 * `trial`/`trail` → boolean.
 *
 * `planRaw` is the RAW `plan` param rather than the parsed id, because what
 * decides the empty case is whether the URL asked for a plan at all, not
 * whether the id it asked for happened to be well formed.
 */
const parseTrialFlag = (
  raw: string | null,
  planRaw: string | null,
): boolean => {
  if (raw === null) return false;

  const value = raw.trim().toLowerCase();

  // A valueless flag counts as "on" only when nothing is being bought. See
  // `parseMarketingPlanIntent` for the whole argument.
  if (value === "") return planRaw === null;

  return TRUTHY.has(value);
};

/**
 * Parse the marketing params out of a URL.
 *
 * The trial flag is the one judgement call, and it has two halves.
 *
 * A MISSING flag alongside a plan id means "not a trial": the visitor clicked a
 * priced card, and the paid path is recoverable at every step (the seat dialog
 * is dismissible, the grid is right behind it) whereas silently swallowing a
 * paid intent is not. An unrecognised value is treated the same way, for the
 * same reason.
 *
 * A VALUELESS flag — `?trial`, `?trial=` and `?trial=%20` are all the same
 * empty string by the time any query parser is done with them — reads as "on"
 * ONLY when the URL names no plan. On its own it is the ordinary web
 * convention for a switch that is on, and being wrong in that direction just
 * means an already-running trial is not asked to pay. Alongside `plan=2` it is
 * almost never a person: it is a marketing template emitting
 * `?plan=2&trail={{trial}}` with the variable unset, and honouring it there
 * would route EVERY paid click to `/dashboard` — no picker, no seat dialog, the
 * purchase intent gone, which is the one direction nothing downstream can
 * recover from. So an explicit plan id outranks a blank flag.
 *
 * `?plan=&trial=` (the same template with neither variable rendered) names no
 * plan, so there is no purchase to protect — but it is no evidence of a trial
 * click either, and it reaches here through a `plan` key that was meant to hold
 * something. It falls back to the ordinary picker, which costs a click, rather
 * than skipping to the dashboard, which costs the question.
 */
export const parseMarketingPlanIntent = (
  source: MarketingPlanIntentSource | null | undefined,
): MarketingPlanIntent => {
  const planRaw = readParam(source, PLAN_KEY);

  return {
    planId: parsePlanId(planRaw),
    cycle: parseCycle(readParam(source, CYCLE_KEY)),
    isTrial: parseTrialFlag(readTrialParam(source), planRaw),
  };
};

/** True when there is anything worth carrying to the next hop. */
export const hasMarketingPlanIntent = (intent: MarketingPlanIntent): boolean =>
  intent.planId !== null || intent.isTrial;

/**
 * The visitor asked for the trial. A plan id alongside the flag changes no
 * ROUTING — the reverse trial is granted inside the `POST /company` transaction,
 * so there is no trial page to send anyone to — but it is not thrown away
 * either: `useCreateOrganizationForm` sends it with that same create call as
 * the plan to trial, and the backend validates it (`is_active && allow_trial`)
 * and falls back to the default trial plan when it does not hold up.
 */
export const isTrialIntent = (intent: MarketingPlanIntent): boolean =>
  intent.isTrial;

/**
 * Shape-level "they clicked a paid plan". Says nothing about whether the plan
 * exists — callers that hold the live catalog must use
 * `resolveMarketingPlanIntent` instead.
 */
export const hasPurchaseIntentShape = (intent: MarketingPlanIntent): boolean =>
  !intent.isTrial && intent.planId !== null;

/**
 * The intent as a query string, with ONLY the params that are actually
 * present — an ordinary signup URL must come out of this funnel byte-identical
 * to how it goes in today.
 *
 * `trial` is written only when true (a missing flag already means "not a
 * trial"), always in the canonical spelling, and `cycle` only alongside a plan:
 * a cadence with nothing to buy is noise on the URL, and the destination
 * derives its default cycle from the plan anyway.
 */
export const marketingPlanIntentQuery = (
  intent: MarketingPlanIntent,
): string => {
  const params = new URLSearchParams();

  if (intent.planId !== null) {
    params.set(PLAN_KEY, String(intent.planId));
    if (intent.cycle) params.set(CYCLE_KEY, intent.cycle);
  }
  if (intent.isTrial) params.set(CANONICAL_TRIAL_KEY, "true");

  return params.toString();
};

/** `appendMarketingPlanIntent("/x?email=a", intent)` → `/x?email=a&plan=2`. */
export const appendMarketingPlanIntent = (
  path: string,
  intent: MarketingPlanIntent,
): string => {
  const query = marketingPlanIntentQuery(intent);
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
};

/** A marketing intent checked against the live catalog — safe to charge for. */
export interface ResolvedMarketingPlanIntent {
  plan: IBillingPlan;
  /** Always a cycle this plan is actually sold on. */
  cycle: BillingCycle;
}

/**
 * Why a shape-valid intent did not become a purchase.
 *
 *   - `"none"` — nothing to resolve: no plan id, a trial intent, or no catalog
 *     to check against. Indistinguishable from an ordinary signup, and must be
 *     treated as one.
 *   - `"unknown-plan"` — the id names no plan in the catalog: a typo, a stale
 *     marketing link, or a plan retired since the page was cached.
 *   - `"not-sellable"` — the plan exists but is never sold: the Free/default
 *     plan (applied by downgrade), or a plan with no cycles at all.
 *   - `"cycle-not-sold"` — the plan is real AND sellable; only the requested
 *     cadence is wrong. The one refusal that still knows which plan the
 *     visitor meant, and the only one carrying `availableCycles`.
 */
export type MarketingPlanIntentRefusal =
  | "none"
  | "unknown-plan"
  | "not-sellable"
  | "cycle-not-sold";

/**
 * The full verdict on an intent: the purchase, or the reason there is none.
 *
 * `resolveMarketingPlanIntent` is the yes/no view of exactly this value, so the
 * two can never disagree about whether a plan is sellable.
 */
export type MarketingPlanIntentOutcome =
  | ({ status: "resolved" } & ResolvedMarketingPlanIntent)
  | {
      status: "refused";
      refusal: MarketingPlanIntentRefusal;
      /**
       * The plan the id named, when it named a real one — so `null` for
       * `"none"` and `"unknown-plan"`, populated for the other two. A refusal
       * still standing is NOT permission to charge for this plan; it is only
       * enough to show it.
       */
      plan: IBillingPlan | null;
      /**
       * The cycles `plan` IS sold on, in catalog order. Non-empty for
       * `"cycle-not-sold"` and empty for every other refusal — so a caller
       * that wants to land a grid on a cadence where the requested plan is at
       * least rendered can read `availableCycles[0]` (intersected with
       * whatever cycles its own toggle supports) without re-deriving any of
       * this from `plan.available_cycles`.
       */
      availableCycles: BillingCycle[];
      /** The cycle the URL asked for, if it asked for one. */
      requestedCycle: BillingCycle | null;
    };

/**
 * Resolve an intent against the live catalog and say WHY when it does not
 * resolve. The single place that decides a plan is real, sold, and sold on the
 * requested cycle — `resolveMarketingPlanIntent` below is a thin view over it,
 * not a second implementation.
 *
 * Every refusal still ends on the ordinary plan picker rather than on a broken
 * checkout; the reason only lets a caller pick a BETTER picker. In particular
 * an explicitly requested cycle the plan is not sold on stays a refusal rather
 * than a fallback: quietly billing monthly for an advertised yearly price is a
 * bait-and-switch, so nothing here may auto-open a checkout at a price the
 * visitor did not see. What `"cycle-not-sold"` buys the caller is the plan and
 * its real cadences — enough to land the grid where that plan is on screen with
 * its actual prices, instead of on a cycle that filters the card out entirely
 * and leaves the user staring at a grid that seems to have lost their plan.
 */
export const describeMarketingPlanIntent = (
  intent: MarketingPlanIntent,
  plans: IBillingPlan[] | null | undefined,
): MarketingPlanIntentOutcome => {
  const refuse = (
    refusal: MarketingPlanIntentRefusal,
    plan: IBillingPlan | null = null,
    availableCycles: BillingCycle[] = [],
  ): MarketingPlanIntentOutcome => ({
    status: "refused",
    refusal,
    plan,
    availableCycles,
    requestedCycle: intent.cycle,
  });

  if (intent.isTrial || intent.planId === null || !plans?.length) {
    return refuse("none");
  }

  const plan = plans.find((candidate) => candidate.id === intent.planId);
  if (!plan) return refuse("unknown-plan");
  if (isFreePlan(plan)) return refuse("not-sellable", plan);

  const available = plan.available_cycles ?? [];
  if (available.length === 0) return refuse("not-sellable", plan);

  if (intent.cycle) {
    return available.includes(intent.cycle)
      ? { status: "resolved", plan, cycle: intent.cycle }
      : refuse("cycle-not-sold", plan, available);
  }

  // No cadence was asked for: monthly is the product's default (and the
  // checkout page's), falling back to whatever this plan does sell.
  const cycle = available.includes("monthly") ? "monthly" : available[0];
  return { status: "resolved", plan, cycle };
};

/**
 * Turn a shape-valid intent into a real purchase, or into nothing — the
 * yes/no view of `describeMarketingPlanIntent`, which documents every way this
 * returns `null`. Use it wherever the reason for a refusal changes nothing;
 * reach for `describeMarketingPlanIntent` when it does.
 */
export const resolveMarketingPlanIntent = (
  intent: MarketingPlanIntent,
  plans: IBillingPlan[] | null | undefined,
): ResolvedMarketingPlanIntent | null => {
  const outcome = describeMarketingPlanIntent(intent, plans);
  return outcome.status === "resolved"
    ? { plan: outcome.plan, cycle: outcome.cycle }
    : null;
};
