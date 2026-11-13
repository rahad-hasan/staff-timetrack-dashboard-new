import { checkBeforeRefresh } from "@/hooks/useLiveRefresh";
import { APP_UPDATED_MESSAGE } from "@/lib/appUpdated";
import { BILLING_URL, isPaymentRequired } from "@/lib/billing";
import type {
    IntegrationImportPayload,
    IntegrationImportResult,
    IResponse,
} from "@/types/type";

export type IntegrationRunResponse = IResponse<IntegrationImportResult>;

/**
 * Runs an import or a sync through its route handler
 * (`POST /api/integrations/:provider/{import,sync}`, see
 * lib/server/integrationRun.ts).
 *
 * A `fetch()`, not a server action: a run takes minutes, and Next runs a
 * tab's server actions one at a time, so everything else the user did in the
 * tab used to wait behind it. Aborting `signal` stops the wait; the run
 * itself finishes on the API either way.
 *
 * Resolves with the API envelope, or null when nobody needs the answer any
 * more: `signal` aborted, or the browser is leaving for /session-expired (as
 * the server actions redirected on a dead session) or /settings/billing.
 * `beforeLeave` runs right before that navigation, so a "Leave site?" guard
 * can stand down: the app is leaving, not the user, and a "Stay" there would
 * strand them on a dead page. Rejects when no answer from the route arrived
 * — offline, or a proxy in front of the dashboard gave up — and the run may
 * still be going on the server. A server whose build has no such route
 * resolves with APP_UPDATED_MESSAGE instead: that request ran nothing.
 */
export async function runIntegration(
    provider: string,
    run: "import" | "sync",
    {
        payload,
        signal,
        beforeLeave,
    }: {
        payload?: IntegrationImportPayload;
        signal?: AbortSignal;
        beforeLeave?: () => void;
    } = {},
): Promise<IntegrationRunResponse | null> {
    let response: Response;
    let body: unknown;
    try {
        response = await fetch(
            `/api/integrations/${encodeURIComponent(provider)}/${run}`,
            {
                method: "POST",
                ...(payload
                    ? {
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                      }
                    : {}),
                signal,
                cache: "no-store",
            },
        );
        if (
            response.status === 404 &&
            !response.headers.get("content-type")?.includes("application/json")
        ) {
            // Next's not-found page: the route answers its own 404s in JSON
            return {
                success: false,
                statusCode: 404,
                message: APP_UPDATED_MESSAGE,
            } as IntegrationRunResponse;
        }
        // a proxy's HTML error page fails here, like a dropped connection
        body = await response.json();
    } catch (error) {
        if (signal?.aborted) return null;
        throw error;
    }
    if (typeof body !== "object" || body === null) {
        throw new Error(`Unexpected ${response.status} response`);
    }

    const leave = (url: string) => {
        beforeLeave?.();
        window.location.assign(url);
        return null;
    };
    if (response.status === 401) {
        // The session is gone (a provider's 401 arrives as a 424). A full page
        // load, as billingStore does: that page is what clears the session.
        return leave("/session-expired");
    }
    const envelope = body as IntegrationRunResponse;
    if (isPaymentRequired(envelope)) {
        // As baseApi does for an admin's write (only admins can import or
        // sync): the billing page, with the API's message.
        return leave(
            `${BILLING_URL}${envelope.message ? `?blocked=${encodeURIComponent(envelope.message)}` : ""}`,
        );
    }
    return envelope;
}

/** After an unanswered server check: quick for a blip, then patient (as live refresh retries). */
const REFRESH_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000];

/** The post-run refresh still waiting for the server; a newer run's replaces it. */
let pendingRefresh: AbortController | null = null;

/**
 * Re-renders the current route after a successful run. Imported boards and
 * lists are ordinary projects and tasks, and a route handler cannot re-render
 * the route the way a revalidating server action did. The refresh also drops
 * the router cache, so a projects or tasks page restored with Back is re-read
 * instead of shown without them.
 *
 * Only after `checkBeforeRefresh`: a refresh that cannot land (offline, a
 * restarting server) or meets a newer build makes Next reload the page,
 * result dialog and all. An unanswered check is asked again with backoff
 * instead of dropping the refresh; a newer build ends it (the user was asked
 * to reload). Not tied to the view that ran it: the cache it drops belongs to
 * the whole tab, and every route already re-renders under any revalidating
 * write.
 */
export function refreshAfterRun(router: { refresh: () => void }): void {
    pendingRefresh?.abort();
    const controller = new AbortController();
    pendingRefresh = controller;
    const { signal } = controller;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    signal.addEventListener("abort", () => clearTimeout(retryTimer));

    const attempt = async (retries: number) => {
        const verdict = await checkBeforeRefresh(signal);
        if (signal.aborted) return;
        if (verdict === "retry" && retries < REFRESH_RETRY_DELAYS_MS.length) {
            retryTimer = setTimeout(
                () => void attempt(retries + 1),
                REFRESH_RETRY_DELAYS_MS[retries],
            );
        } else if (verdict === "refresh") {
            router.refresh();
        }
    };
    void attempt(0);
}
