import { unstable_rethrow } from "next/navigation";

/**
 * What a `catch` around a server-action call shows: the error's own message,
 * or `fallback` when it carries none.
 *
 * Next's control-flow errors are rethrown first. A `redirect()` inside the
 * action — baseApi's /session-expired on a 401, or /settings/billing?blocked=…
 * for a management role's 402 — reaches the caller as a rejection whose
 * message is "NEXT_REDIRECT". By then the router has already moved to the
 * target. A catch that kept the rejection showed "NEXT_REDIRECT" as a red
 * toast on the page the user landed on. Rethrown, it goes to Next's own
 * handler, which expects it. Catches with fixed wording of their own call
 * `unstable_rethrow(error)` before showing it, for the same reason.
 */
export function actionErrorMessage(error: unknown, fallback: string): string {
  unstable_rethrow(error);
  const message = (error as { message?: unknown } | null | undefined)?.message;
  return typeof message === "string" && message ? message : fallback;
}
