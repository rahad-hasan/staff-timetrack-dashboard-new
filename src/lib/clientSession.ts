import { buildLogInUserData } from "@/lib/authSession";
import { shutdownCrisp } from "@/lib/liveChat/crisp";
import { forgetSessionTokens } from "@/lib/liveChat/sessionToken";
import { useBillingStore } from "@/store/billingStore";
import { useLiveChatStore } from "@/store/liveChatStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useProjectFormStore } from "@/store/ProjectFormStore";
import { useQuickActionStore } from "@/store/quickActionStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { resetProfileImageRefresh } from "@/utils/profileImageRefresh";

/**
 * The browser half of a session's lifecycle. The server half — the cookies —
 * lives in `lib/sessionCookies.ts`; these functions are for client components
 * only.
 */

/**
 * Per-user flags other modules keep in sessionStorage. That storage is per
 * TAB, so it survives a sign-out in the same tab. Only these keys are removed:
 * the rest of sessionStorage holds the Google Ads conversion markers, which
 * must outlive the session they were earned in.
 */
const PER_USER_SESSION_KEYS = [
  // GoogleReconnectBanner's dismissal. Left behind, one user's "dismiss" hid
  // the next user's reconnect warning in that tab.
  "stafftime-google-reconnect-dismissed",
] as const;

/**
 * Return the per-user client state to its signed-out shape: stop the billing
 * poll and forget the status, reset the onboarding, quick-action and project
 * wizard stores and the profile-image refresher, and drop the per-user
 * sessionStorage flags.
 *
 * It does not navigate and leaves the user store, the sidebar and live chat
 * alone, so it is also safe while a page stays open (see
 * `switchClientSession`).
 */
export function resetUserScopedState() {
  useBillingStore.getState().reset();
  useOnboardingStore.getState().reset();
  useQuickActionStore.getState().clearCreate();
  useProjectFormStore.getState().resetData();

  resetProfileImageRefresh();

  try {
    PER_USER_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Storage blocked — nothing to remove.
  }
}

/**
 * Forget everything this browser holds about the signed-in user: stop the
 * billing poll, return every per-user store to its signed-out state, and
 * delete the user's data from localStorage / sessionStorage (name, email,
 * phone, role and company id lived in localStorage indefinitely).
 *
 * Runs on sign-out, on /session-expired and before a new session is seeded.
 * Without it a shared machine showed the next user the previous tenant's
 * trial banner or blocked takeover (the billing store stayed `loaded`), and
 * could open the welcome modal from the previous user's onboarding progress.
 * Safe to call any number of times, and on pages where none of it was used.
 *
 * One thing is deliberately left: the live-chat session tokens. Forgotten
 * here, a session that expired or the same user signing in again opened an
 * empty conversation, and the agent's reply to the old one never arrived.
 * Only `signOut` (all of them) and `beginClientSession` (other users') remove
 * them; see lib/liveChat/sessionToken.ts.
 */
export function resetClientSession() {
  resetUserScopedState();
  useSidebarStore.getState().resetSidebar();

  shutdownCrisp();
  useLiveChatStore.getState().resetRuntime();

  // In-memory first, then storage: a write after `clearStorage` would persist
  // whatever the store still held. `persist` is absent when the store was
  // created without usable storage (blocked site data).
  useLogInUserStore.getState().resetData();
  try {
    useLogInUserStore.persist?.clearStorage();
  } catch {
    // Storage blocked — nothing was persisted to clear.
  }
}

/** Two known account ids that differ. An unknown one (an empty store) is no other account. */
export const isOtherAccount = (a: unknown, b: unknown): boolean =>
  a != null && b != null && String(a) !== String(b);

/** Two known account ids of the same account. An unknown one is no account at all. */
export const isSameAccount = (a: unknown, b: unknown): boolean =>
  a != null && b != null && String(a) === String(b);

/**
 * Set once this page starts reloading for an account switch. From then on it
 * acts for neither account: a second effect run (StrictMode), a later layout
 * render or another event must not reload again or write an identity back.
 */
let reloading = false;

/**
 * True once this page has started its account-switch reload. Every app-owned
 * "leave site?" guard (`beforeunload`) must let that reload through: a
 * cancelled one leaves the page acting for the old account with the new
 * account's cookie, and nothing retries it, because `reloading` stays set and
 * memory already follows storage.
 */
export const isAccountSwitchReload = (): boolean => reloading;

/**
 * A persisted account id `switchClientSession` could neither replace nor
 * remove. It is known stale, and a reload would only hydrate it again, so it
 * never counts as another tab's sign-in.
 */
let unremovableUserId: string | undefined;

/**
 * The account id persisted for the user store — what the next page load in
 * this browser starts from. `undefined` when nothing is persisted or it cannot
 * be read; a load then starts from an empty store too.
 */
function persistedUserId(): unknown {
  try {
    const options = useLogInUserStore.persist?.getOptions();
    const stored = options?.name ? options.storage?.getItem(options.name) : null;
    // localStorage answers synchronously; only a promise lacks `state`.
    return stored && "state" in stored ? stored.state.logInUserData?.id : undefined;
  } catch {
    return undefined;
  }
}

function reloadTab() {
  reloading = true;
  window.location.reload();
}

/**
 * Hand this tab to the account now signed in on this browser. It sends that
 * account's session cookie, but everything on the page belongs to the one it
 * was loaded for: its stores, and component state no reset reaches — a
 * half-filled form or an open dialog would now save into the other account's
 * workspace. So the page is reloaded rather than patched in place.
 *
 * The reload must not come back here. The new identity is persisted first, so
 * the reload starts from a store that already matches; if storage refuses the
 * write, the stale copy is removed instead (an empty store is filled, never
 * compared). Only a stale copy that can be neither replaced nor removed would
 * loop, so then the page is just reset in place, as it used to be, and that
 * copy is ignored from then on.
 */
export function switchClientSession(user: Record<string, string | number>) {
  resetUserScopedState();
  try {
    useLogInUserStore.getState().setLogInUserData(user);
  } catch {
    // Storage full: the in-memory store took the write, storage did not.
  }
  if (isOtherAccount(persistedUserId(), user.id)) {
    try {
      useLogInUserStore.persist?.clearStorage();
    } catch {
      // Storage blocked: checked below like any other failure.
    }
  }
  const persistedId = persistedUserId();
  if (isOtherAccount(persistedId, user.id)) {
    unremovableUserId = String(persistedId);
    return;
  }
  reloadTab();
}

/**
 * Reloads this tab when storage names another account than the one the tab
 * works for: its in-memory store's, or `fallbackId` while that is empty. Only
 * a write from another tab changes storage under this page — a sign-in, most
 * likely, now sending its cookie from here too — so the reload lets the
 * server's session settle it, starting from what that tab persisted.
 *
 * Returns true while the tab is reloading, also when an earlier call started
 * it: the caller must then write no identity at all.
 */
export function reloadIfAccountSwitched(fallbackId?: unknown): boolean {
  if (reloading) return true;
  const userId = useLogInUserStore.getState().logInUserData?.id ?? fallbackId;
  const persistedId = persistedUserId();
  if (!isOtherAccount(userId, persistedId) || String(persistedId) === unremovableUserId) {
    return false;
  }
  resetUserScopedState();
  // Memory follows storage (synchronously, over localStorage), so a write
  // landing while this page unloads — an avatar refresh — saves the new
  // account instead of putting this one back over it.
  void useLogInUserStore.persist?.rehydrate();
  reloadTab();
  return true;
}

/**
 * Reloads this tab the moment another tab signs a different account in. The
 * session cookie is shared, so from then on every save here lands in that
 * account's workspace, while `SessionSync` only notices at this layout's next
 * server render — minutes away on many pages. `fallbackId`, the account the
 * page was rendered for, stands in while this tab's store is empty (see
 * `reloadIfAccountSwitched`). Returns the unsubscribe.
 */
export function watchForAccountSwitch(fallbackId?: unknown): () => void {
  const onStorage = (event: StorageEvent) => {
    // A null key: storage was cleared wholesale.
    if (event.key === null || event.key === useLogInUserStore.persist?.getOptions().name) {
      reloadIfAccountSwitched(fallbackId);
    }
  };
  // Back/Forward cache: the restored page heard no events while it was away.
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) reloadIfAccountSwitched(fallbackId);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("pageshow", onPageShow);
  // A sign-in saved after this page's store loaded, but before this listener
  // existed, fired its event unheard.
  reloadIfAccountSwitched(fallbackId);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pageshow", onPageShow);
  };
}

/**
 * Asks the server to end the session (`POST /auth/logout` clears the session
 * cookies). Resolves false when the request never got an answer — the caller
 * must not then behave as if the user were signed out.
 */
export async function endServerSession(): Promise<boolean> {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      // The 303 to /auth/login serves plain form posts; following it here
      // would download the login page for nothing.
      redirect: "manual",
      cache: "no-store",
      credentials: "same-origin",
    });
    return response.type === "opaqueredirect" || response.ok;
  } catch {
    return false;
  }
}

/**
 * Sign out: end the server session, wipe this browser's per-user state, then
 * leave with a full page load — no store, router cache or socket survives it,
 * and `replace` keeps the signed-in page out of the back stack. Resolves false
 * (with nothing reset) when the server could not be reached.
 *
 * The one place every live-chat session token is forgotten: someone who signs
 * out is done with this browser, and the next person at it must not find a
 * token that resumes their conversation.
 */
export async function signOut(): Promise<boolean> {
  if (!(await endServerSession())) return false;
  resetClientSession();
  forgetSessionTokens();
  window.location.replace("/auth/login");
  return true;
}

/**
 * Seed the client for the session a server action just started (sign-in,
 * password reset, organization creation): drop whatever the previous session
 * left in this browser, store the new user and preselect the dashboard in the
 * sidebar. One hand-off for all three, so they cannot drift apart again —
 * the password-reset copy had lost the company time-zone fallback.
 *
 * Other users' live-chat tokens go here; this user's own stays, so signing in
 * again (after an expired session, say) returns to the same conversation.
 */
export function beginClientSession(data: Parameters<typeof buildLogInUserData>[0]) {
  resetClientSession();
  forgetSessionTokens(data?.id);
  useLogInUserStore.getState().setLogInUserData(buildLogInUserData(data));
  useSidebarStore.getState().setOpenMenu("/dashboard");
}
