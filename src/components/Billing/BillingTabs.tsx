"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import SegmentedPills, {
  type SegmentedPillOption,
} from "@/components/Common/SegmentedPills";
import { CreditCard, Package, Receipt } from "lucide-react";
import PlanIcon from "../Icons/PlanIcons/PlanIcon";
import InvoiceIcon from "../Icons/PlanIcons/InvoiceIcon";
import CardIcon from "../Icons/PlanIcons/CardIcon";

export type BillingTabId = "my-plan" | "invoice" | "change-card";

/**
 * The tab the page opens on. Its value is never written to the URL — the
 * param is deleted instead, so `/settings/billing` and
 * `/settings/billing?tab=my-plan` are the same address and every
 * `block.webBillingUrl` / 402 redirect (which carry `?blocked=…` and nothing
 * else) still land on a recognisable default.
 */
export const DEFAULT_BILLING_TAB: BillingTabId = "my-plan";

/** Anchor id of the pricing grid, which lives inside the My Plan tab body. */
const PLANS_ANCHOR_ID = "plans";

const TAB_IDS: readonly BillingTabId[] = ["my-plan", "invoice", "change-card"];

/**
 * Normalises whatever is in `?tab=`.
 *
 * Two things are folded in deliberately: an unknown value falls back to the
 * default rather than rendering an empty page, and `change-card` collapses to
 * the default for non-admins. Billing is *readable* by manager/hr, but cards
 * are admin-only server-side — a manager who bookmarks or is sent the
 * `?tab=change-card` link must get the plan tab, not a panel whose every
 * request 403s.
 */
export const resolveBillingTab = (
  raw: string | null | undefined,
  isAdmin: boolean,
): BillingTabId => {
  const candidate = TAB_IDS.find((id) => id === raw) ?? DEFAULT_BILLING_TAB;
  if (candidate === "change-card" && !isAdmin) return DEFAULT_BILLING_TAB;
  return candidate;
};

/**
 * Read/write side of `?tab=`, split out from the strip so the surfaces ABOVE
 * the strip (the recovery cards) can drive it without rendering one.
 *
 * `rawTab` is the literal param, not the resolved tab: callers that need to
 * know "is the My Plan body mounted right now" can compare against the
 * default without also needing the viewer's role.
 */
const useBillingTabNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");

  const setTab = useCallback(
    (next: BillingTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_BILLING_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      const query = params.toString();
      // `scroll: false` — the tab bodies swap in place; yanking the viewport to
      // the top would throw away the position of a user who scrolled down to
      // the pricing grid and tapped Invoice to cross-check a charge.
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { rawTab, setTab };
};

/**
 * The billing page's active tab plus its setter.
 *
 * `initialTab` is the server-rendered `?tab=` value. It only ever seeds the
 * very first paint — `useSearchParams` is authoritative from then on — but
 * without it the page would flash My Plan before settling on the requested
 * tab after hydration.
 */
export const useBillingTab = ({
  isAdmin,
  initialTab,
}: {
  isAdmin: boolean;
  initialTab?: string | null;
}) => {
  const { rawTab, setTab } = useBillingTabNav();
  const activeTab = resolveBillingTab(rawTab ?? initialTab, isAdmin);
  return { activeTab, setTab };
};

/**
 * "Take me to the pricing grid" for any surface on the billing page.
 *
 * The grid lives inside the My Plan tab body, so once the tabs exist a bare
 * `getElementById("plans")?.scrollIntoView()` is a dead button on every other
 * tab: the anchor simply is not in the DOM. This switches the tab first and
 * scrolls once the new body has been committed.
 *
 * The wait is a `requestAnimationFrame` fired from an effect keyed on the URL
 * param, NOT a guessed `setTimeout`: the effect runs after React has committed
 * the tab swap, and the frame callback runs after the browser has laid it out,
 * so the anchor is measurable by the time we ask for it.
 */
export const useScrollToPlans = () => {
  const { rawTab, setTab } = useBillingTabNav();

  /** Set only by a click, so a plain tab change never hijacks the viewport. */
  const pendingScroll = useRef(false);

  const isOnDefaultTab = rawTab === null || rawTab === DEFAULT_BILLING_TAB;

  useEffect(() => {
    if (!pendingScroll.current || !isOnDefaultTab) return;
    pendingScroll.current = false;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(PLANS_ANCHOR_ID)
        ?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOnDefaultTab]);

  return useCallback(() => {
    if (isOnDefaultTab) {
      document
        .getElementById(PLANS_ANCHOR_ID)
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    pendingScroll.current = true;
    setTab(DEFAULT_BILLING_TAB);
  }, [isOnDefaultTab, setTab]);
};

/**
 * The billing page's tab strip.
 *
 * Rendered with the shared `SegmentedPills` row rather than a fourth
 * hand-rolled `<button>` strip — the repo has no `ui/tabs.tsx`, and the pill
 * markup had already been copied across the settings tabs, the notification
 * tabs and the payroll board before it was extracted.
 *
 * Change Card is withheld from manager/hr: they may read billing, but every
 * payment-method endpoint is `auth('admin')`, so offering the tab would just
 * be a route to three 403s. `resolveBillingTab` closes the same hole for a
 * hand-typed URL.
 */
export default function BillingTabs({
  activeTab,
  onChange,
  isAdmin,
}: {
  activeTab: BillingTabId;
  onChange: (tab: BillingTabId) => void;
  isAdmin: boolean;
}) {
  const options = useMemo<SegmentedPillOption<BillingTabId>[]>(() => {
    const base: SegmentedPillOption<BillingTabId>[] = [
      { value: "my-plan", label: "My Plan", icon: <PlanIcon size={20}/> },
      { value: "invoice", label: "Invoice", icon: <InvoiceIcon size={20}/> },
    ];
    if (isAdmin) {
      base.push({ value: "change-card", label: "Change Card", icon: <CardIcon size={20}/> });
    }
    return base;
  }, [isAdmin]);

  return (
    <SegmentedPills
      options={options}
      value={activeTab}
      onChange={onChange}
      ariaLabel="Billing sections"
      // Manual activation: arrows move focus, Space/Enter switches the tab.
      // `onChange` here is `router.push` into a `force-dynamic` page, so
      // select-on-move would charge a keyboard user a history entry and a full
      // RSC refetch for every arrow press spent reading the strip — and key
      // auto-repeat (the row wraps, so it never ends) would fire them without
      // limit. It also keeps Back meaning "leave Settings" instead of walking
      // backwards through tabs the user only skimmed. This is a tab strip
      // choosing which panel is mounted, which is precisely the case
      // WAI-ARIA reserves manual activation for.
      activation="manual"
      // variant="loose"
      border={false}
      className="gap-2 py-1 px-1 rounded-lg  shadow-[5px_05px_10px_rgba(0,0,0,0.05)] border border-borderColor/50 dark:border-darkBorder"
    />
  );
}
