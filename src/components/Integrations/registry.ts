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
    /** What the provider's importable container is called, lowercase ("board", "list") */
    noun: { singular: string; plural: string };
    /** What lives inside a container, lowercase singular ("item", "task") */
    countNoun: string;
    /**
     * How the picker groups rows — "none": flat list (monday),
     * "space": Workspace · Space headers (ClickUp), "workspace": Workspace
     * headers (Asana). Row badges (ClickUp Folder / Asana Team) come from
     * `IntegrationItem.badge` regardless of mode.
     */
    groupBy: "none" | "space" | "workspace";
    /** optional informational line shown on the import/sync result screen */
    resultNote?: string;
    capabilities: {
        boardPicker: boolean;
        sync: boolean;
        importDefaults: boolean;
    };
}

/** "boards" → "Boards" for headings/buttons built from registry nouns. */
export const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

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
        noun: { singular: "board", plural: "boards" },
        countNoun: "item",
        groupBy: "none",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "clickup",
        name: "ClickUp",
        logo: clickupLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Bring your ClickUp lists and tasks into the tracker.",
        available: true,
        apiBase: "/clickup",
        noun: { singular: "list", plural: "lists" },
        countNoun: "task",
        groupBy: "space",
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
        noun: { singular: "project", plural: "projects" },
        countNoun: "issue",
        groupBy: "none",
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "asana",
        name: "Asana",
        logo: asanaLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Import Asana projects and tasks for time tracking.",
        available: true,
        apiBase: "/asana",
        noun: { singular: "project", plural: "projects" },
        countNoun: "task",
        groupBy: "workspace",
        resultNote:
            "Asana has no native status or priority — task status is taken from its section (e.g. “To do”, “In progress”) and completion flag; priority from a “Priority” custom field when one exists.",
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
        noun: { singular: "channel", plural: "channels" },
        countNoun: "message",
        groupBy: "none",
        capabilities: { boardPicker: false, sync: false, importDefaults: false },
    },
];

export const getIntegrationDef = (key?: string | null) =>
    INTEGRATIONS.find((def) => def.key === key);
