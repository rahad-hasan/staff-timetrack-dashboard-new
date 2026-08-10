/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from "react";

import { getIntegrationItems } from "@/actions/integrations/appIntegrationAction";
import { IntegrationItem } from "@/types/type";

interface UseIntegrationItemsProps {
    integrationKey: string;
    enabled: boolean;
    nounPlural: string;
    onConnectionLost?: () => void;
}

interface UseIntegrationItemsReturn {
    items: IntegrationItem[] | null;
    itemsLoading: boolean;
    itemsError: string | null;
    fetchItems: (options?: { silent?: boolean }) => Promise<void>;
    setItems: React.Dispatch<React.SetStateAction<IntegrationItem[] | null>>;
    setItemsError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useIntegrationItems = ({
    integrationKey,
    enabled,
    nounPlural,
    onConnectionLost,
}: UseIntegrationItemsProps): UseIntegrationItemsReturn => {
    const [items, setItems] = useState<IntegrationItem[] | null>(null);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState<string | null>(null);

    const fetchItems = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!enabled) return;

            if (!silent) {
                setItemsLoading(true);
                setItemsError(null);
            }

            try {
                const res: any = await getIntegrationItems(integrationKey);

                if (res?.success) {
                    setItems(res.data ?? []);
                    setItemsError(null);
                } else if (res?.statusCode === 401) {
                    setItems(null);
                    setItemsError(
                        res?.message ??
                            "Connection lost. Please reconnect your account.",
                    );

                    onConnectionLost?.();
                } else {
                    const message =
                        res?.message ||
                        `Failed to load ${nounPlural}`;

                    if (message.includes("not connected")) {
                        setItems(null);
                        setItemsError(message);

                        onConnectionLost?.();
                    } else if (!silent) {
                        setItemsError(message);
                    }
                }
            } catch {
                if (!silent) {
                    setItemsError(`Failed to load ${nounPlural}`);
                }
            } finally {
                setItemsLoading(false);
            }
        },
        [
            enabled,
            integrationKey,
            nounPlural,
            onConnectionLost,
        ],
    );

    return {
        items,
        itemsLoading,
        itemsError,
        fetchItems,
        setItems,
        setItemsError,
    };
};