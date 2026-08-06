"use client";

import IntegrationDetail from "@/components/Integrations/IntegrationDetail";
import IntegrationsHub from "@/components/Integrations/IntegrationsHub";
import SlackIntegrationDetail from "@/components/Integrations/SlackIntegrationDetail";
import { getIntegrationDef } from "@/components/Integrations/registry";
import { useRouter } from "next/navigation";

const TAB_QUERY = `tab=${encodeURIComponent("App Integrations")}`;

interface AppIntegrationsProps {
    /** `app` search param — which provider detail is open (from the server page) */
    app?: string;
}

const AppIntegrations = ({ app }: AppIntegrationsProps) => {
    const router = useRouter();
    const def = getIntegrationDef(app);

    if (def?.available) {
        // Slack is a messaging surface with its own two-section card (slack
        // spec §1) — the project-management detail view must never render it
        if (def.category === "messaging") {
            return (
                <SlackIntegrationDetail
                    def={def}
                    onBack={() => router.push(`?${TAB_QUERY}`)}
                />
            );
        }
        return (
            <IntegrationDetail
                def={def}
                onBack={() => router.push(`?${TAB_QUERY}`)}
            />
        );
    }

    return (
        <IntegrationsHub
            onOpen={(nextDef) => router.push(`?${TAB_QUERY}&app=${nextDef.key}`)}
        />
    );
};

export default AppIntegrations;
