import "server-only";

import axios, { type AxiosResponse } from "axios";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { isProviderKey, providerConfig } from "@/actions/integrations/providers";
import { LOG_REQUESTS, logRequest, SERVER_NOT_ACTIVE } from "@/lib/server/apiClient";
import type { IntegrationImportPayload } from "@/types/type";

/**
 * Import and sync for the project-management integrations, answered to a
 * browser `fetch()` by `POST /api/integrations/:provider/{import,sync}`.
 *
 * They used to be server actions. A run legitimately takes minutes (§4.6),
 * and Next runs a tab's server actions one at a time, so while one ran every
 * other action in the tab — saving a form, marking a notification read, a
 * billing click — queued behind it and the app looked frozen. A fetch runs
 * alongside them, and the client aborts it when the view goes away.
 *
 * The API call goes through axios (plain node http, LONG_RUNNING_TIMEOUT_MS)
 * because server-side `fetch` (undici) gives up after 5 minutes without
 * response headers. A proxy between here and the API (nginx, Cloudflare) can
 * end the wait much sooner; that is the 504 case below.
 *
 * The body is the envelope the server actions returned, the provider's
 * result mapped to the neutral `IntegrationImportResult`. The HTTP status is
 * what the client branches on where the envelope cannot tell:
 * - 401: the dashboard session is gone. The actions redirected to
 *   /session-expired; a fetch cannot be redirected, so the client navigates.
 * - 424 with `statusCode: 401`: the PROVIDER rejected the company's token
 *   (the provider-401 rule, Trello's token-missing 400 included). Connection
 *   lost, not a logout.
 * - 504: the API took the request but no answer came in time. It is most
 *   likely still running it, and the message says so.
 * - anything else: the API's own status and envelope. The client sends a 402
 *   to /settings/billing, as baseApi does for an admin's write (only admins
 *   can import or sync).
 *
 * Each call that reaches for the API writes baseApi's request log line: the
 * API's status, or what ended the wait, then `→<status>` when the relay
 * answered with its own status and message instead of the API's. So
 * `504→502` is a gateway that never reached the API, `504→504` one that gave
 * up on a run still going, and `401→424` a lost provider token.
 */

type IntegrationRun = "import" | "sync";

const LONG_RUNNING_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * A gateway timeout (504, Cloudflare's 524) that took at least this long is
 * the proxy giving up on the API's ANSWER: the API has the request and keeps
 * running it. A sooner one is the proxy failing to CONNECT, so the API never
 * saw the request. Connect timeouts are seconds and read timeouts a minute or
 * more (the API's nginx: 5 s and 60 s), so this splits them with room on both
 * sides.
 */
const MIN_READ_TIMEOUT_MS = 20_000;

/** An import names at most 25 ids (the API's cap), far below this. */
const MAX_IMPORT_BODY_BYTES = 16 * 1024;

const respond = (status: number, body: object) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

const fail = (status: number, message: string) =>
  respond(status, { success: false, statusCode: status, message });

const stillRunning = (run: IntegrationRun) =>
  `The ${run} is taking longer than this request can wait. It is most likely still running on the server — refresh in a few minutes to see the result.`;

/** The hostname of an absolute URL; null when it is not one (the opaque origin "null"). */
const hostnameOf = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

/**
 * A cookie-authenticated write: refuse what the BROWSER labels as sent from
 * another site, as the support relays do. The session cookie is SameSite=Lax
 * on top, but that only stops other sites: a page on a sibling host of the
 * dashboard's own domain still posts with it.
 *
 * `Sec-Fetch-Site` is the engine's own verdict and decides wherever it is
 * sent. An engine without it (Safari before 16.4) used to pass unchecked; it
 * still sends `Origin` with a POST, so there the Origin must name the host
 * this request was addressed to (`Host`, which the proxy in front must
 * preserve, as middleware.ts already relies on). "null" names none: it is
 * what a form posted under a no-referrer policy carries. Hostnames only,
 * because nginx's `$host` drops the port and cookies ignore it anyway. A
 * request with neither header (curl, a server-side caller) is allowed.
 */
const isCrossSite = (request: NextRequest) => {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null) return site === "cross-site" || site === "same-site";

  const origin = request.headers.get("origin");
  const host = hostnameOf(`http://${request.headers.get("host") ?? ""}`);
  if (origin === null || host === null) return false;
  return hostnameOf(origin) !== host;
};

interface ApiEnvelope {
  success?: boolean;
  message?: unknown;
  data?: unknown;
  errorMessages?: { path: string; message: string }[];
}

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

/**
 * Why an import request is refused before a byte of its body is read, or null
 * when it may be read. The app's own client (runIntegration) posts a JSON
 * string with fetch, which always sends both headers checked here.
 *
 * - JSON only: an HTML form cannot send `application/json`, so a forged post
 *   from another page (`text/plain` is the closest a form gets) stops here.
 * - A declared length within the cap: the body used to be read whole before
 *   its size was checked, and a chunked one declares none, so 30 MB sent that
 *   way was held in memory to be answered 400. With a length, Node hands over
 *   no more than it says (it refuses a request that is also chunked).
 */
function refuseImportRequest(request: NextRequest): Response | null {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json\s*(;|$)/i.test(contentType)) {
    return fail(415, "Invalid import request");
  }
  const length = request.headers.get("content-length");
  if (length === null || !/^\d{1,12}$/.test(length.trim())) {
    return fail(411, "Invalid import request");
  }
  if (Number(length) > MAX_IMPORT_BODY_BYTES) {
    return fail(413, "Invalid import request");
  }
  return null;
}

/**
 * The neutral import body, or null when it is not one. Shape only: the API
 * validates the values. Call it after `refuseImportRequest`, which bounds
 * what is read here.
 */
async function readImportPayload(
  request: NextRequest,
): Promise<IntegrationImportPayload | null> {
  const text = await request.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const { ids, start_date, deadline } = parsed as Record<string, unknown>;
  if (
    !Array.isArray(ids) ||
    !ids.every((id): id is string => typeof id === "string") ||
    !isOptionalString(start_date) ||
    !isOptionalString(deadline)
  ) {
    return null;
  }
  return { ids, start_date, deadline };
}

export async function relayIntegrationRun(
  request: NextRequest,
  provider: string,
  run: IntegrationRun,
): Promise<Response> {
  if (!isProviderKey(provider)) return fail(404, "Not found");
  if (isCrossSite(request)) return fail(403, "Forbidden");

  const token = (await cookies()).get("accessToken")?.value;
  if (!token) {
    return fail(401, "Your session has expired. Please sign in again.");
  }

  const { base, authPrefix, idsField, toResult } = providerConfig(provider);

  let body: Record<string, unknown> = {};
  if (run === "import") {
    const refusal = refuseImportRequest(request);
    if (refusal) return refusal;
    const payload = await readImportPayload(request);
    if (!payload) return fail(400, "Invalid import request");
    body = { [idsField]: payload.ids };
    if (payload.start_date) body.start_date = payload.start_date;
    if (payload.deadline) body.deadline = payload.deadline;
  }

  const path = `${base}/${run}`;
  const startedAt = performance.now();
  const waitedMs = () => performance.now() - startedAt;
  /**
   * Logs the call as baseApi would (see the module comment) and returns
   * `response`. `apiOutcome` is given when the relay answers in place of the
   * API: what the API did, its status or what ended the wait.
   */
  const logged = (response: Response, apiOutcome?: number | string) => {
    if (LOG_REQUESTS) {
      const outcome =
        apiOutcome === undefined
          ? response.status
          : `${apiOutcome}→${response.status}`;
      logRequest("POST", path, outcome, startedAt);
    }
    return response;
  };

  let res: AxiosResponse;
  try {
    res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: LONG_RUNNING_TIMEOUT_MS,
        validateStatus: () => true,
        // The tab went away: stop waiting. The API finishes the run anyway.
        signal: request.signal,
      },
    );
  } catch (error) {
    if (request.signal.aborted) {
      return logged(fail(499, "Request cancelled"), "aborted");
    }
    // LONG_RUNNING_TIMEOUT_MS passed; the API has not given up on the run
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return logged(fail(504, stillRunning(run)), "timeout");
    }
    return logged(fail(503, SERVER_NOT_ACTIVE), "network-error");
  }

  // axios parses a JSON body; anything else (a proxy's error page) stays text
  const envelope: ApiEnvelope | null =
    typeof res.data === "object" && res.data !== null ? res.data : null;
  const message = typeof envelope?.message === "string" ? envelope.message : "";

  if (res.status >= 200 && res.status < 300) {
    if (!envelope) {
      return logged(fail(502, "Unexpected response from the server."), res.status);
    }
    return logged(
      respond(
        res.status,
        envelope.success
          ? { ...envelope, data: toResult(envelope.data as never) }
          : envelope,
      ),
    );
  }

  // The provider revoked the company's token; Trello reports an unreadable
  // stored token as a 400 that means the same thing (§6).
  if (
    message.startsWith(authPrefix) &&
    (res.status === 401 || message.includes("access token is missing"))
  ) {
    return logged(
      respond(424, {
        success: false,
        statusCode: 401,
        message,
        errorMessages: envelope?.errorMessages,
      }),
      res.status,
    );
  }
  if (res.status === 401) {
    return logged(
      fail(401, message || "Your session has expired. Please sign in again."),
    );
  }

  if (!envelope) {
    // A proxy answered, not the API. Only a gateway timeout after a long wait
    // means the API has the run and is still on it (see MIN_READ_TIMEOUT_MS);
    // any other error page means the API was not reached or did not answer.
    const gaveUpOnAnswer =
      (res.status === 504 || res.status === 524) &&
      waitedMs() >= MIN_READ_TIMEOUT_MS;
    return logged(
      gaveUpOnAnswer
        ? fail(504, stillRunning(run))
        : fail(502, SERVER_NOT_ACTIVE),
      res.status,
    );
  }

  return logged(
    respond(res.status, {
      success: false,
      statusCode: res.status,
      message:
        message ||
        envelope.errorMessages?.[0]?.message ||
        `Request failed with ${res.status}`,
      errorMessages: envelope.errorMessages,
    }),
  );
}
