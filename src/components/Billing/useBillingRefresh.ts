"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useBillingStore } from "@/store/billingStore";
import { IBillingStatus } from "@/types/billing";

/**
 * The one "billing just changed" signal. Call it after EVERY successful billing
 * mutation (seats, plan switch, cancel, restore, downgrade) instead of calling
 * `fetchStatus()` directly.
 *
 * Three things have to happen, and none of them substitutes for the others —
 * which is exactly why a seat purchase could succeed and still leave the page
 * showing the old numbers:
 *
 * 1. **`fetchStatus({ force: true })`** — the billing state machine. The plain
 *    `fetchStatus()` joins an in-flight request so concurrent callers share one
 *    round trip; that is right for polling and wrong here. A poll tick issued
 *    moments BEFORE the charge would answer this read-after-write with the
 *    pre-purchase snapshot.
 *
 * 2. **`bumpDataVersion()`** — surfaces holding their own fetched data (the
 *    invoice history table). Their data sits in component state, so neither
 *    `revalidateTag` in the server action nor `router.refresh()` can touch it;
 *    without this, the invoice you just paid for is missing from the table
 *    until a manual reload.
 *
 * 3. **`router.refresh()`** — the server-rendered tree. `/settings/billing` is
 *    a server component that passes `initialStatus`, `activeUserCount` and
 *    `plans` down as props; they are baked into the RSC payload and would
 *    otherwise keep disagreeing with the store until a full navigation.
 *
 * Note for anyone hunting a caching bug here: the reads themselves are NOT
 * served from Next's Data Cache. `baseApi` sends an `Authorization` header,
 * which makes every fetch uncacheable, and billing reads additionally pass
 * `cache: "no-cache"`. Staleness in this feature is always client state.
 */
export const useBillingRefresh = () => {
  const router = useRouter();

  return useCallback(async (): Promise<IBillingStatus | null> => {
    const { bumpDataVersion, fetchStatus } = useBillingStore.getState();
    // Bump first so dependent tables start their reload in parallel with the
    // status round trip rather than after it.
    bumpDataVersion();
    try {
      return await fetchStatus({ force: true });
    } finally {
      router.refresh();
    }
  }, [router]);
};
