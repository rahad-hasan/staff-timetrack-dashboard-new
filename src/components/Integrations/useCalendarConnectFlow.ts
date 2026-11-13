"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import {
    getGoogleAuthUrl,
    getGoogleConnected,
    getMicrosoftAuthUrl,
    getMicrosoftConnected,
} from "@/actions/integrations/action";
import { useIntegrationConnectFlow } from "./useIntegrationConnectFlow";

const CALENDAR_PROVIDERS = {
    google: {
        name: "Google",
        getAuthUrl: getGoogleAuthUrl,
        getConnected: getGoogleConnected,
        windowName: "stafftime-google-connect",
    },
    microsoft: {
        name: "Microsoft",
        getAuthUrl: getMicrosoftAuthUrl,
        getConnected: getMicrosoftConnected,
        windowName: "stafftime-microsoft-connect",
    },
} as const;

export type CalendarProvider = keyof typeof CALENDAR_PROVIDERS;

/**
 * OAuth-popup connect for a user's own Google Calendar / Microsoft Teams
 * account — the shared app-integration flow (`useIntegrationConnectFlow`)
 * with the calendar endpoints plugged in.
 *
 * It replaces two hand-rolled copies (one per provider) whose 1.5s poll had no
 * unmount cleanup: closing the event modal mid-connect left a server action
 * firing every 1.5s for two minutes, with toasts and `onConnected` landing in
 * a tree that was gone. The shared flow listens for the callback page's
 * postMessage (both providers post one), polls only as a fallback, one probe
 * at a time, and tears everything down on unmount.
 *
 * Kept from the old hooks: the "connected as <email>" toast, the "sign-in
 * window closed" note when the user gives up, and continuing in this tab when
 * the browser blocks the popup (these callers have nowhere to show a
 * "pop-up blocked" hint).
 *
 * `start` connects an account; `reconnect` is for one that is ALREADY
 * connected ("Reconnect account"). There the status endpoint answers
 * "connected" — for the existing link — from the first probe on, which used to
 * end the flow as a success three seconds in: popup closed mid-consent, toast
 * naming the old account. A reconnect therefore completes on the callback
 * page's message alone.
 */
export const useCalendarConnectFlow = (
    provider: CalendarProvider,
    onConnected?: () => void,
) => {
    const config = CALENDAR_PROVIDERS[provider];
    /** the account a fallback probe saw, for the toast when no message came */
    const probedEmailRef = useRef<string | null>(null);
    /** the running flow was started by `reconnect` */
    const reconnectRef = useRef(false);

    const { start: startFlow, busy } = useIntegrationConnectFlow(
        { key: provider, name: config.name },
        (outcome) => {
            if (outcome === "success") {
                onConnected?.();
            } else if (outcome === "closed") {
                toast.message(`${config.name} sign-in window closed`);
                // With no probe, a reconnect cannot tell whether the sign-in
                // went through before the window closed (a browser that blocks
                // the callback message) — re-read the status in case it did.
                if (reconnectRef.current) onConnected?.();
            }
        },
        {
            getAuthUrl: config.getAuthUrl,
            checkConnected: async () => {
                // "connected" is the link being replaced, not this sign-in
                if (reconnectRef.current) return false;
                const res = await config.getConnected();
                probedEmailRef.current = res?.data?.provider_email ?? null;
                return res?.data?.connected === true;
            },
            windowName: config.windowName,
            successToast: (providerEmail) => {
                const email = providerEmail ?? probedEmailRef.current;
                return email
                    ? `${config.name} connected as ${email}`
                    : `${config.name} connected successfully`;
            },
            onPopupBlocked: (url) => window.location.assign(url),
        },
    );

    const begin = useCallback(
        (reconnect: boolean) => {
            // the shared flow drops a click while one is running — it must not
            // relabel the running flow either
            if (busy) return;
            reconnectRef.current = reconnect;
            // no probe runs to replace an email an earlier connect left here
            if (reconnect) probedEmailRef.current = null;
            void startFlow();
        },
        [busy, startFlow],
    );
    const start = useCallback(() => begin(false), [begin]);
    const reconnect = useCallback(() => begin(true), [begin]);

    return { start, reconnect, busy };
};
