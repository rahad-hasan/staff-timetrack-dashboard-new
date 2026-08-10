/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getIntegrationStatus } from "@/actions/integrations/appIntegrationAction";
import { IntegrationStatusResponse } from "@/types/type";

interface UseIntegrationStatusReturn {
    status: IntegrationStatusResponse | null;
    statusLoading: boolean;
    statusError: string | null;
    fetchStatus: (options?: { silent?: boolean }) => Promise<void>;
}

export const useIntegrationStatus = (
    integrationKey: string,
): UseIntegrationStatusReturn => {
    const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);

    const lastStatusFetchRef = useRef(0);

    const fetchStatus = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            lastStatusFetchRef.current = Date.now();

            if (!silent) {
                setStatusLoading(true);
            }

            try {
                const res: any = await getIntegrationStatus(integrationKey);

                if (res?.success) {
                    setStatus(res.data ?? null);
                    setStatusError(null);
                } else {
                    setStatusError(
                        res?.message || "Failed to load integration status",
                    );
                }
            } catch {
                setStatusError("Failed to load integration status");
            } finally {
                setStatusLoading(false);
            }
        },
        [integrationKey],
    );

    // Initial load
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Refresh when the tab regains focus (if stale)
    useEffect(() => {
        const onFocus = () => {
            if (Date.now() - lastStatusFetchRef.current > 30_000) {
                fetchStatus({ silent: true });
            }
        };

        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("focus", onFocus);
        };
    }, [fetchStatus]);

    return {
        status,
        statusLoading,
        statusError,
        fetchStatus,
    };
};