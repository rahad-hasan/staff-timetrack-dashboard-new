"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  detachPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "@/actions/billing/action";
import { useBillingStore } from "@/store/billingStore";
import { IPaymentMethod, IPaymentMethodList } from "@/types/billing";

/**
 * Mutations resolve rather than throw. The server's refusal message is the
 * point — "you can't remove your only card while a subscription is live" has
 * to reach the user verbatim, so callers render `message` inline instead of
 * mapping a boolean onto generic copy.
 */
export interface PaymentMethodMutationResult {
  ok: boolean;
  message: string | null;
}

export interface PaymentMethodsState {
  methods: IPaymentMethod[];
  defaultId: string | null;
  /** False ⇒ the company has never reached Stripe; "no cards yet" is normal. */
  customerExists: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setDefault: (id: string) => Promise<PaymentMethodMutationResult>;
  detach: (id: string) => Promise<PaymentMethodMutationResult>;
  /** A default/detach write is in flight — freeze the list's controls. */
  mutating: boolean;
}

/**
 * Saved cards, read live from Stripe.
 *
 * Modelled on `Invoice/useInvoiceHistory` and for the same reasons:
 *
 * - **`latestRequest` is a monotonic id, not a cancelled flag.** Retry (or a
 *   `dataVersion` bump landing mid-flight) can put two reads in the air at
 *   once, and the loser must not be allowed to write over the winner.
 * - **`dataVersion` is a dependency.** This list lives in component state, so
 *   neither `revalidateTag` in the action nor `router.refresh()` reaches it.
 *   Without the subscription, a card saved during checkout — or a subscription
 *   change that moved the default — leaves the panel showing yesterday's card
 *   until a manual reload.
 */
export const usePaymentMethods = (): PaymentMethodsState => {
  const [methods, setMethods] = useState<IPaymentMethod[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [customerExists, setCustomerExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const dataVersion = useBillingStore((s) => s.dataVersion);

  const latestRequest = useRef(0);

  /**
   * Writes a server-returned list into state.
   *
   * The request id is claimed FIRST on purpose. Every mutation answers with the
   * full post-write list, which is by definition newer than any read still in
   * flight — without this, a slow `GET` issued before the delete lands after it
   * and resurrects the card the user just removed.
   */
  const applyList = useCallback((list: IPaymentMethodList | undefined) => {
    if (!list) return;
    latestRequest.current += 1;
    setMethods(Array.isArray(list.payment_methods) ? list.payment_methods : []);
    setDefaultId(list.default_payment_method_id ?? null);
    // The detach payload omits `customer_exists` (it answers `detached` + the
    // list instead), so keep the known value rather than flipping the panel
    // back to its "never reached Stripe" state after a successful removal.
    setCustomerExists((previous) => list.customer_exists ?? previous);

    // Settle the read state HERE, because claiming the request id above is
    // exactly what stops an in-flight read from settling it itself: that read's
    // `finally` compares `latestRequest.current` against its own id, sees it
    // has moved, and returns without clearing `loading`. A mutation landing
    // mid-read therefore latched the tab in its skeleton forever. This list is
    // authoritative and already on screen, so nothing is still loading and no
    // earlier error is still true.
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const response = await getPaymentMethods();
        if (latestRequest.current !== requestId) return;
        if (response?.success && response.data) {
          const list = response.data;
          setMethods(
            Array.isArray(list.payment_methods) ? list.payment_methods : [],
          );
          setDefaultId(list.default_payment_method_id ?? null);
          setCustomerExists(Boolean(list.customer_exists));
        } else {
          setError(response?.message || "Failed to load payment methods.");
        }
      } catch {
        if (latestRequest.current === requestId) {
          setError("Something went wrong while loading your saved cards.");
        }
      } finally {
        if (latestRequest.current === requestId) setLoading(false);
      }
    };

    void load();
  }, [reloadToken, dataVersion]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  const setDefault = useCallback(
    async (id: string): Promise<PaymentMethodMutationResult> => {
      setMutating(true);
      try {
        const response = await setDefaultPaymentMethod(id);
        if (response?.success && response.data) {
          applyList(response.data);
          return { ok: true, message: null };
        }
        return {
          ok: false,
          message: response?.message || "Could not update your default card.",
        };
      } catch {
        return {
          ok: false,
          message: "Something went wrong while updating your default card.",
        };
      } finally {
        setMutating(false);
      }
    },
    [applyList],
  );

  const detach = useCallback(
    async (id: string): Promise<PaymentMethodMutationResult> => {
      setMutating(true);
      try {
        const response = await detachPaymentMethod(id);
        if (response?.success && response.data) {
          applyList(response.data);
          return { ok: true, message: null };
        }
        // The 400 here is usually the deliberate "last card behind a live
        // subscription" guard. Pass it straight through — a generic failure
        // line would leave the admin retrying a refusal that will never change.
        return {
          ok: false,
          message: response?.message || "Could not remove that card.",
        };
      } catch {
        return {
          ok: false,
          message: "Something went wrong while removing that card.",
        };
      } finally {
        setMutating(false);
      }
    },
    [applyList],
  );

  return {
    methods,
    defaultId,
    customerExists,
    loading,
    error,
    refresh,
    setDefault,
    detach,
    mutating,
  };
};
