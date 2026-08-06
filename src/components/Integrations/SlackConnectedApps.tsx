/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getSlackStatus } from "@/actions/integrations/slackIntegrationAction";
import { SlackStatusResponse } from "@/types/type";
import { useCallback, useEffect, useRef, useState } from "react";
import SlackPersonalCard from "./SlackPersonalCard";

/**
 * "Connected apps" on the profile tab — the member-facing Slack surface
 * (slack spec §4). Personal connect is for every role, including employee,
 * so this renders for everyone; role gating here would be a bug (§6.4).
 */
const SlackConnectedApps = () => {
    const [status, setStatus] = useState<SlackStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastFetchRef = useRef(0);

    const fetchStatus = useCallback(async ({ silent = false } = {}) => {
        lastFetchRef.current = Date.now();
        if (!silent) setLoading(true);
        try {
            const res: any = await getSlackStatus();
            if (res?.success) {
                setStatus(res?.data ?? null);
                setError(null);
            } else {
                setError(res?.message || "Failed to load Slack status");
            }
        } catch {
            setError("Failed to load Slack status");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // refetch on window focus once the data is ~30s stale — catches an admin
    // connecting/disconnecting the workspace while this tab was hidden
    useEffect(() => {
        const onFocus = () => {
            if (Date.now() - lastFetchRef.current > 30_000) {
                fetchStatus({ silent: true });
            }
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchStatus]);

    return (
        <div className="mt-8">
            <h2 className="text-lg sm:text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
                Connected apps
            </h2>
            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                Personal connections that only affect your account.
            </p>
            <div className="mt-3 max-w-2xl">
                <SlackPersonalCard
                    status={status}
                    loading={loading}
                    error={error}
                    onRetry={() => fetchStatus()}
                    refetch={fetchStatus}
                />
            </div>
        </div>
    );
};

export default SlackConnectedApps;
