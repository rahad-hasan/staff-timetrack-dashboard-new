"use client";

import { useCallback } from "react";

import { useBillingStore } from "@/store/billingStore";
import { IBillingStatus } from "@/types/billing";

/**
 * The one "billing just changed" signal. Call it after EVERY successful billing
 * mutation (seats, plan switch, cancel, restore, downgrade) instead of calling
 * `fetchStatus()` directly.
 *
 * A billing write has three audiences, and each is reached exactly once:
 *
 * 1. **The server-rendered tree** — reached by the write itself. Subscription
 *    writes revalidate the `billing` tag (see "Freshness" in
 *    `@/actions/billing/action`), so Next re-renders the current route,
 *    layouts included, into the action's own response. Do NOT add
 *    `router.refresh()` here or after a write: it renders the whole route a
 *    second time — every layout and page read again — for nothing.
 *
 * 2. **`fetchStatus({ force: true })`** — the billing store, which that render
 *    does not feed outside /settings/billing (BillingGate's banners and
 *    takeovers, the global Add-seats dialog). The plain `fetchStatus()` joins
 *    an in-flight request so concurrent callers share one round trip; that is
 *    right for polling and wrong here. A poll tick issued moments BEFORE the
 *    charge would answer this read-after-write with the pre-purchase snapshot.
 *
 * 3. **`bumpDataVersion()`** — surfaces holding their own fetched data (the
 *    invoice history, refunds and saved-card lists). Their data sits in
 *    component state, so no server render can touch it; without this, the
 *    invoice you just paid for is missing from the table until a manual
 *    reload.
 *
 * Note for anyone hunting a caching bug here: billing reads are live —
 * `baseApi` sends every request `no-store` unless it opts into `cacheFor`, and
 * no billing read does. That policy is explicit, not a side effect of the
 * `Authorization` header: Next's Data Cache keys entries by headers, token
 * included, and will happily store per-user responses when asked to. Billing
 * staleness is always client state (this store, a component's own list, or a
 * Back/Forward restore from the router cache).
 */
export const useBillingRefresh = () =>
  useCallback(async (): Promise<IBillingStatus | null> => {
    const { bumpDataVersion, fetchStatus } = useBillingStore.getState();
    // Bump first so dependent tables start their reload in parallel with the
    // status round trip rather than after it.
    bumpDataVersion();
    return await fetchStatus({ force: true });
  }, []);
