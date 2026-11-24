import "server-only";

import { cookies } from "next/headers";
import { after } from "next/server";
import { baseApi } from "@/actions/baseApi";
import {
  AWIN_CLICK_COOKIE,
  AWIN_CLICK_SN_COOKIE,
  MARKETING_CONSENT_COOKIE,
  buildClickForward,
  type IAwinClickForward,
} from "@/lib/awinClick";

/**
 * Forwards the browser's Awin click (the HttpOnly first-party cookie the
 * marketing site or `middleware.ts` set) to the API, server to server. The
 * cookie never reaches client JavaScript, and the API — not this app —
 * decides whether the click is valid, in window and newer than the stored one.
 *
 * A plain server-only module, not "use server": exporting these as actions
 * would let any browser bind an arbitrary click to its company.
 */

/** Hard limit on the bind request itself (it runs after the response). */
const BIND_TIMEOUT_MS = 5000;

/** The click to forward, or null when the browser carries none. */
export async function readAwinClick(): Promise<IAwinClickForward | null> {
  try {
    const store = await cookies();
    return buildClickForward({
      awc: store.get(AWIN_CLICK_COOKIE)?.value,
      awcSn: store.get(AWIN_CLICK_SN_COOKIE)?.value,
      consent: store.get(MARKETING_CONSENT_COOKIE)?.value,
    });
  } catch {
    return null;
  }
}

/**
 * Binds the browser's click to the signed-in admin's company (`touchpoint`
 * says where) AFTER this server action's response has been sent (`after`),
 * so it adds no latency to a sign-in or a checkout, and its outcome is
 * ignored — affiliate tracking must never change what either does. The
 * request is aborted after BIND_TIMEOUT_MS; baseApi then resolves, never
 * throws, never redirects. Call only from server actions / route handlers.
 *
 * `accessToken` covers a session written in this same action (sign-in),
 * whose cookie the request does not carry yet.
 */
export async function bindAwinClickAfterResponse(
  touchpoint: "login" | "checkout",
  accessToken?: string | null,
): Promise<void> {
  const click = await readAwinClick();
  if (!click) return;
  const token = accessToken ?? (await cookies()).get("accessToken")?.value;
  if (!token) return;

  after(async () => {
    try {
      await baseApi("/affiliates/awin/attribution", {
        method: "POST",
        body: { ...click, touchpoint },
        headers: { Authorization: `Bearer ${token}` },
        redirectOnUnauthorized: false,
        skipPaymentRedirect: true,
        skipRevalidate: true,
        signal: AbortSignal.timeout(BIND_TIMEOUT_MS),
      });
    } catch {
      /* best-effort by design */
    }
  });
}
