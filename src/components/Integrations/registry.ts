import { StaticImageData } from "next/image";
import mondayLogo from "@/assets/integrations/monday.svg";
import clickupLogo from "@/assets/integrations/clickup.svg";
import jiraLogo from "@/assets/integrations/jira.svg";
import asanaLogo from "@/assets/integrations/asana.svg";
import slackLogo from "@/assets/integrations/slack.svg";
import { Folder, Hash, LucideIcon, Users } from "lucide-react";

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
    /** What lives inside a container, lowercase singular ("item", "task", "issue") */
    countNoun: string;
    /**
     * How the picker groups rows — "none": flat list (monday),
     * "space": Workspace · Space headers (ClickUp), "workspace": headers from
     * the item's top-level container, i.e. Asana Workspace / Jira Site.
     * Row badges (ClickUp Folder / Asana Team / Jira key) come from
     * `IntegrationItem.badge` regardless of mode.
     */
    groupBy: "none" | "space" | "workspace";
    /** icon shown inside `IntegrationItem.badge` chips */
    badgeIcon?: LucideIcon;
    /**
     * Providers whose webhooks lapse while idle (Jira: 30 days, §13.4) warn
     * after this many days without a sync so the user re-registers them.
     */
    staleSyncWarningDays?: number;
    /** optional provider-specific copy — omitted keys render nothing */
    notes?: {
        /** informational line on the import/sync result screen */
        result?: string;
        /** appended to the "Unmatched users" warning section */
        unmatchedUsers?: string;
        /**
         * replaces the whole default unmatched-users intro (which advises
         * inviting by email — wrong for providers that never expose emails,
         * i.e. Trello). `unmatchedUsers` is ignored when this is set.
         */
        unmatchedUsersIntro?: string;
        /** shown next to the Connect button, before OAuth starts */
        connect?: string;
        /** replaces the default "matched by email" how-it-works bullet */
        assigneeMatching?: string;
        /**
         * footnote under the "Imported …" list for providers whose listing
         * endpoint is capped and may therefore miss imported items
         */
        importedListCaveat?: string;
    };
    /**
     * Lets the import picker accept a pasted container URL/id on top of the
     * listed rows (Trello: the /boards list caps at the first 100 open
     * boards, but /import also takes any 24-hex id or 8-char shortLink).
     */
    manualIdEntry?: {
        /** input placeholder, e.g. a sample board URL */
        placeholder: string;
        /** helper line under the input explaining when to paste (list cap) */
        hint?: string;
        /** validation message when `parse` rejects the input */
        error: string;
        /** extract a provider id from pasted text; null = unrecognized */
        parse: (raw: string) => string | null;
    };
    capabilities: {
        boardPicker: boolean;
        sync: boolean;
        importDefaults: boolean;
    };
}

/** "boards" → "Boards" for headings/buttons built from registry nouns. */
export const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

/**
 * One sentence describing what an import does, derived from the registry
 * nouns so hub, detail view and picker never drift apart.
 */
export const describeImport = (def: IntegrationDef) => {
    if (def.noun.singular === "project") {
        // Asana / Jira already call their containers "projects"
        return `Your ${def.name} projects are imported for time tracking, along with their ${def.countNoun}s.`;
    }
    if (def.countNoun === "task") {
        return `Your ${def.name} ${def.noun.plural} are imported as projects, and their tasks come along with them.`;
    }
    return `Your ${def.name} ${def.noun.plural} are imported as projects; their ${def.countNoun}s become tasks.`;
};

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
        badgeIcon: Folder,
        capabilities: { boardPicker: true, sync: true, importDefaults: true },
    },
    {
        key: "jira",
        name: "Jira",
        logo: jiraLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Sync Jira projects and issues as trackable work.",
        available: true,
        apiBase: "/jira",
        noun: { singular: "project", plural: "projects" },
        countNoun: "issue",
        // Jira groups by Atlassian Site — normalized onto `workspace` (§13.1)
        groupBy: "workspace",
        badgeIcon: Hash,
        // Jira webhooks lapse after 30 days of inactivity (§13.4)
        staleSyncWarningDays: 21,
        notes: {
            result:
                "Issue status is matched by name (with Jira's status category as fallback), priority maps Highest/High → High, Medium → Medium, Low/Lowest → Low, the due date becomes the task deadline, and subtasks are imported as ordinary tasks.",
            unmatchedUsers:
                "Atlassian hides most user emails behind account privacy settings, so Jira matches people by email when it is shared and otherwise by an exact display-name match. To fix a listed user, ask them to make their email visible at id.atlassian.com (Profile and visibility → Contact → Email address → “Anyone”), or make their name here match their Jira display name — the next Sync re-maps their issues automatically.",
            assigneeMatching:
                "Assignees are matched to teammates by email, or by exact display name when Atlassian hides the email.",
            connect:
                "Sign in with an Atlassian account that can reach at least one Jira site — accounts without Jira access cannot complete the connection.",
        },
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
        badgeIcon: Users,
        notes: {
            result:
                "Asana has no native status or priority — task status is taken from its section (e.g. “To do”, “In progress”) and completion flag; priority from a “Priority” custom field when one exists.",
        },
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
