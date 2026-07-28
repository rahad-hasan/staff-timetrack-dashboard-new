import { StaticImageData } from "next/image";
import mondayLogo from "@/assets/integrations/monday.svg";
import clickupLogo from "@/assets/integrations/clickup.svg";
import jiraLogo from "@/assets/integrations/jira.svg";
import asanaLogo from "@/assets/integrations/asana.svg";
import slackLogo from "@/assets/integrations/slack.svg";

export type IntegrationKey = "monday" | "clickup" | "jira" | "asana" | "slack";

export interface IntegrationDef {
    key: IntegrationKey;
    name: string;
    logo: StaticImageData;
    category: "project_management" | "meetings_events";
    categoryLabel: string;
    blurb: string;
    available: boolean;
    apiBase: string;
    /** Terminology for the things the provider imports ("Boards", "Lists", …) */
    itemNoun: string;
    capabilities: {
        boardPicker: boolean;
        sync: boolean;
        importDefaults: boolean;
    };
}

/** The callback popup posts this message type to window.opener (all providers). */
export const INTEGRATION_CALLBACK_MESSAGE_TYPE =
    "staff-time-tracker:integration-callback";

export const INTEGRATIONS: IntegrationDef[] = [
    {
        key: "monday",
        name: "monday.com",
        logo: mondayLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Import boards as projects and keep tasks in sync automatically.",
        available: true,
        apiBase: "/monday",
        itemNoun: "Boards",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "clickup",
        name: "ClickUp",
        logo: clickupLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Bring your ClickUp lists and tasks into the tracker.",
        available: false,
        apiBase: "/clickup",
        itemNoun: "Lists",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "jira",
        name: "Jira",
        logo: jiraLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Sync Jira projects and issues as trackable work.",
        available: false,
        apiBase: "/jira",
        itemNoun: "Projects",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "asana",
        name: "Asana",
        logo: asanaLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Import Asana projects and tasks for time tracking.",
        available: false,
        apiBase: "/asana",
        itemNoun: "Projects",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "slack",
        name: "Slack",
        logo: slackLogo,
        category: "meetings_events",
        categoryLabel: "Meetings & events",
        blurb: "Schedule meetings and get event updates right in Slack.",
        available: false,
        apiBase: "/slack",
        itemNoun: "Channels",
        capabilities: { boardPicker: false, sync: false, importDefaults: false },
    },
];

export const getIntegrationDef = (key?: string | null) =>
    INTEGRATIONS.find((def) => def.key === key);
