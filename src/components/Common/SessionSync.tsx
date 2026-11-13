"use client";

import { useLayoutEffect } from "react";
import AccountSwitchWatcher from "@/components/Common/AccountSwitchWatcher";
import {
  isOtherAccount,
  reloadIfAccountSwitched,
  switchClientSession,
} from "@/lib/clientSession";
import { useLogInUserStore } from "@/store/logInUserStore";

/** The live server identity handed down by the (main_layout) layout. */
export interface SessionSyncUser {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  time_zone?: string | null;
  company_id?: number;
}

/**
 * Keeps the client's persisted user store in step with the server's live
 * session (role, name, email, time zone, company). Mounted once by the
 * (main_layout) layout; renders nothing visible.
 *
 * That store used to be written only at sign-in, so a role change, an admin's
 * edit to the user's name or a new time zone stayed invisible to the user —
 * wrong menus, wrong day boundaries — until they signed out and back in. It
 * is now a cache of server identity: the layout reads the session live on
 * every render it runs, and this copies whatever differs into the store. On a
 * fresh browser (empty store) that fills it.
 *
 * Another account signing in on this browser — the session cookie is shared
 * by every tab — reloads this tab (`switchClientSession`,
 * `reloadIfAccountSwitched`, `AccountSwitchWatcher`).
 *
 * Writes only what differs, and depends on the server's values alone — never
 * on the store — so a write here cannot re-trigger it.
 */
export default function SessionSync({ user }: { user: SessionSyncUser | null }) {
  const id = user?.id;
  const name = user?.name;
  const email = user?.email;
  const role = user?.role;
  const timeZone = user?.time_zone;
  const companyId = user?.company_id;

  // A layout effect, from the first child of the shell: layout effects run
  // in tree order and before every passive effect. So when a render brings
  // another account, this tab is handed over before any other surface acts
  // on it — before BillingGate's layout effect adopts the new account's
  // billing snapshot and OnboardingGate's seed effect runs in that commit.
  useLayoutEffect(() => {
    // No live identity: the API could not be reached. The cached one is
    // still the best guess, so it is left alone.
    if (id === undefined) return;

    // Another tab saved a different account since this page's store loaded,
    // unheard so far (the listener below did not exist yet): this render
    // may predate that sign-in, so the reload settles it. Writing first
    // would put this account back over the newer one. An empty store stands
    // for `id`.
    if (reloadIfAccountSwitched(id)) return;

    // Keys as the store spells them (`timezone`, not `time_zone`).
    const live: Record<string, string | number> = { id };
    if (name) live.name = name;
    if (email) live.email = email;
    if (role) live.role = role;
    if (timeZone) live.timezone = timeZone;
    if (companyId !== undefined) live.company_id = companyId;

    const { logInUserData, updateUserData } = useLogInUserStore.getState();

    if (isOtherAccount(logInUserData?.id, id)) {
      // The cache belongs to another account: someone else signed in on this
      // browser while this tab stayed open, unseen until now (storage
      // blocked, a frozen tab, or a page outside this layout at the time).
      switchClientSession(live);
      return;
    }

    const changed = Object.entries(live).filter(
      ([key, value]) => logInUserData?.[key] !== value,
    );
    if (changed.length === 0) return;
    try {
      updateUserData(Object.fromEntries(changed));
    } catch {
      // Storage full: the in-memory copy is updated regardless.
    }
  }, [id, name, email, role, timeZone, companyId]);

  // A child's passive effect: it subscribes after the layout effect above.
  return <AccountSwitchWatcher userId={id} />;
}
