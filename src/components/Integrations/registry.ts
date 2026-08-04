import { StaticImageData } from "next/image";
import mondayLogo from "@/assets/integrations/monday.svg";
import clickupLogo from "@/assets/integrations/clickup.svg";
import jiraLogo from "@/assets/integrations/jira.svg";
import asanaLogo from "@/assets/integrations/asana.svg";
import trelloLogo from "@/assets/integrations/trello.svg";
import slackLogo from "@/assets/integrations/slack.svg";
import { Folder, Hash, LucideIcon, Users } from "lucide-react";

export type IntegrationKey =
    | "monday"
    | "clickup"
    | "jira"
    | "asana"
    | "trello"
    | "slack";

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

/**
 * Trello §2.6 — /import accepts the canonical 24-hex board id or the 8-char
 * shortLink from a board URL (https://trello.com/b/<shortLink>/…). Anything
 * else (including other trello.com URLs, e.g. /c/ card links) is rejected.
 */
export const parseTrelloBoardId = (raw: string): string | null => {
    const text = raw.trim();
    if (!text) return null;
    if (/^[0-9a-f]{24}$/i.test(text)) return text.toLowerCase();
    const fromUrl = text.match(
        /^(?:https?:\/\/)?(?:www\.)?trello\.com\/b\/([A-Za-z0-9]{8})(?:[/?#]|$)/i,
    );
    if (fromUrl) return fromUrl[1];
    // bare shortLink, case-sensitive on Trello's side — pass through as-is
    if (/^[A-Za-z0-9]{8}$/.test(text)) return text;
    return null;
};

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
        key: "trello",
        name: "Trello",
        logo: trelloLogo,
        category: "project_management",
        categoryLabel: "Project management sync",
        blurb: "Import Trello boards as projects and keep cards in sync.",
        available: true,
        apiBase: "/trello",
        noun: { singular: "board", plural: "boards" },
        countNoun: "card",
        // boards can sit outside any workspace — those group under "Other"
        groupBy: "workspace",
        notes: {
            result:
                "A card's status comes from the list it sits in (a card marked “due complete” is always complete), its priority from labels named high / medium / low, and its due date becomes the task deadline.",
            unmatchedUsersIntro:
                "These Trello members have no matching account here, so their cards were assigned to you. Trello shares no member emails — make sure each member's full name in Trello matches their name in Staff Time Tracker, then run Sync.",
            assigneeMatching:
                "Assignees are matched to teammates by full name — Trello shares no member emails, so names must match exactly.",
            importedListCaveat:
                "Trello lists only your first 100 open boards, so boards imported by pasted link may not appear here.",
        },
        manualIdEntry: {
            placeholder: "Paste a board link, short link, or board ID",
            hint:
                "The list above shows your first 100 open boards — paste a board link to import one that isn't listed.",
            error:
                "Enter a Trello board link (trello.com/b/…), an 8-character short link, or a 24-character board ID.",
            parse: parseTrelloBoardId,
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
