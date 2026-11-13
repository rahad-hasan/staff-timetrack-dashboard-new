"use client";

import { createContext, useContext, type ReactNode } from "react";
import { isValidTimeZone } from "@/lib/timezone";
import { useLogInUserStore } from "@/store/logInUserStore";

/**
 * The viewer's IANA time zone, for client components that format dates
 * while they are server-rendered.
 *
 * The `@/utils` date helpers default to the zone in the persisted user store.
 * That store is empty on the server, so the default there is "UTC", but it has
 * already been rehydrated from localStorage when the browser hydrates the same
 * component. Any instant that falls on another calendar day in the viewer's
 * zone (every Dhaka deadline, stored as local midnight, is the previous day
 * in UTC) therefore printed one date in the HTML and another in the browser,
 * and React threw the server HTML of the whole document away (error #418) to
 * render it again on the client.
 *
 * The (main_layout) layout reads the zone once per render with
 * `getViewerTimeZone()` (the live session's zone, React-cached, so no extra
 * request) and provides it here. The server pass and the hydration pass then
 * format in the same zone. Call sites pass it to the helpers explicitly.
 */
const ViewerTimeZoneContext = createContext<string | null>(null);

export function ViewerTimeZoneProvider({
  zone,
  children,
}: {
  zone: string;
  children: ReactNode;
}) {
  return (
    <ViewerTimeZoneContext.Provider value={zone}>
      {children}
    </ViewerTimeZoneContext.Provider>
  );
}

const selectStoredZone = (
  state: ReturnType<typeof useLogInUserStore.getState>,
): unknown => state.logInUserData?.timezone;

/**
 * The zone to format the viewer's dates in: the layout's inside
 * (main_layout), else the persisted user store's, else UTC.
 *
 * Outside the provider the store is read through its hook, never through
 * `getState()`: while hydrating, the hook serves the store's initial (empty)
 * state, which is "UTC" on both sides, and it re-renders with the persisted
 * zone right after. So nothing mismatches there either.
 */
export function useViewerTimeZone(): string {
  const provided = useContext(ViewerTimeZoneContext);
  const stored = useLogInUserStore(selectStoredZone);
  if (provided) return provided;
  return typeof stored === "string" && stored && isValidTimeZone(stored)
    ? stored
    : "UTC";
}
