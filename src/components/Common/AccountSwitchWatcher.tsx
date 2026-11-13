"use client";

import { useEffect } from "react";
import { watchForAccountSwitch } from "@/lib/clientSession";

/**
 * Reloads this tab the moment another account signs in on this browser
 * (`watchForAccountSwitch`); renders nothing. `SessionSync` mounts it for every
 * (main_layout) page; authenticated pages outside that layout — checkout, the
 * plan picker — mount it themselves, or a purchase started for one account
 * would be sent with the next one's session cookie.
 *
 * `userId`: the account the server rendered the page for, which stands in
 * while this tab's persisted user store is empty.
 */
export default function AccountSwitchWatcher({ userId }: { userId?: number }) {
  useEffect(() => watchForAccountSwitch(userId), [userId]);
  return null;
}
