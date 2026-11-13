import "server-only";

import {
    AsanaImportResult,
    AsanaProject,
    ClickUpImportResult,
    ClickUpList,
    IntegrationImportResult,
    IntegrationItem,
    JiraImportResult,
    JiraProject,
    MondayBoard,
    MondayImportResult,
    TrelloBoard,
    TrelloImportResult,
} from "@/types/type";

/**
 * Server-side whitelist of app-integration providers. A new provider
 * (Slack) is enabled here + in the client registry — the generic
 * actions (appIntegrationAction.ts) and the import/sync route handlers
 * (lib/server/integrationRun.ts) need no changes beyond a config entry.
 *
 * A plain server-only module: both of those import it, and in a
 * "use server" file every export would be a callable action.
 *
 * `authPrefix` — provider endpoints answer 401 with a message starting with
 * this prefix when the *provider* revoked the token (not a session expiry);
 * baseApi then returns the error envelope instead of logging the user out.
 *
 * `toItem` / `toResult` — each provider's wire format (boards vs lists) is
 * normalized to the neutral `Integration*` shapes here, so every component
 * stays provider-agnostic.
 */
interface ProviderConfig {
    base: string;
    authPrefix: string;
    /**
     * listing endpoint path — "/boards" (monday), "/lists" (ClickUp),
     * "/projects" (Asana and Jira)
     */
    itemsPath: string;
    /** field name the provider's import endpoint expects the ids under */
    idsField: string;
    toItem: (row: never) => IntegrationItem;
    toResult: (raw: never) => IntegrationImportResult;
}

const mondayToItem = (row: MondayBoard): IntegrationItem => ({
    id: row.id,
    name: row.name,
    description: row.description,
    items_count: row.items_count,
    workspace: row.workspace,
    already_imported: row.already_imported,
    project_id: row.project_id,
});

const mondayToResult = (raw: MondayImportResult): IntegrationImportResult => ({
    imported: (raw?.imported ?? []).map((board) => ({
        id: board.board_id,
        name: board.board_name,
        project_id: board.project_id,
        created: board.created,
        tasks_created: board.tasks_created,
        tasks_updated: board.tasks_updated,
        tasks_skipped: board.tasks_skipped,
        truncated: board.items_truncated,
        webhook_registered: board.webhooks_registered,
    })),
    skipped: (raw?.skipped_boards ?? []).map((board) => ({
        id: board.board_id,
        reason: board.reason,
    })),
    unmatched_users: raw?.unmatched_monday_users ?? [],
    ...(raw?.remaining_board_ids
        ? { remaining_ids: raw.remaining_board_ids }
        : {}),
});

const clickupToItem = (row: ClickUpList): IntegrationItem => ({
    id: row.id,
    name: row.name,
    items_count: row.task_count,
    workspace: row.workspace,
    space: row.space,
    badge: row.folder?.name ?? null,
    already_imported: row.already_imported,
    project_id: row.project_id,
});

const clickupToResult = (raw: ClickUpImportResult): IntegrationImportResult => ({
    imported: (raw?.imported ?? []).map((list) => ({
        id: list.list_id,
        name: list.list_name,
        project_id: list.project_id,
        created: list.created,
        tasks_created: list.tasks_created,
        tasks_updated: list.tasks_updated,
        tasks_skipped: list.tasks_skipped,
        truncated: list.tasks_truncated,
        webhook_registered: list.webhook_registered,
    })),
    skipped: (raw?.skipped_lists ?? []).map((list) => ({
        id: list.list_id,
        reason: list.reason,
    })),
    unmatched_users: raw?.unmatched_clickup_users ?? [],
    ...(raw?.remaining_list_ids
        ? { remaining_ids: raw.remaining_list_ids }
        : {}),
});

const asanaToItem = (row: AsanaProject): IntegrationItem => ({
    id: row.id,
    name: row.name,
    // Asana's API has no cheap task count (§12.2) — the UI hides it
    workspace: row.workspace,
    badge: row.team,
    already_imported: row.already_imported,
    project_id: row.project_id,
});

const asanaToResult = (raw: AsanaImportResult): IntegrationImportResult => ({
    imported: (raw?.imported ?? []).map((project) => ({
        id: project.project_gid,
        name: project.project_name,
        project_id: project.project_id,
        created: project.created,
        tasks_created: project.tasks_created,
        tasks_updated: project.tasks_updated,
        tasks_skipped: project.tasks_skipped,
        truncated: project.tasks_truncated,
        webhook_registered: project.webhook_registered,
    })),
    skipped: (raw?.skipped_projects ?? []).map((project) => ({
        id: project.project_gid,
        reason: project.reason,
    })),
    unmatched_users: raw?.unmatched_asana_users ?? [],
    ...(raw?.remaining_project_gids
        ? { remaining_ids: raw.remaining_project_gids }
        : {}),
});

const jiraToItem = (row: JiraProject): IntegrationItem => ({
    // composite "<cloudId>:<projectId>" (§13.1) — opaque, passed straight back
    id: row.id,
    name: row.name,
    // Jira's Site is its top-level container — the picker groups by it
    workspace: row.site,
    badge: row.key,
    is_private: row.is_private,
    already_imported: row.already_imported,
    project_id: row.project_id,
});

const jiraToResult = (raw: JiraImportResult): IntegrationImportResult => ({
    imported: (raw?.imported ?? []).map((project) => ({
        id: project.project_id_external,
        name: project.project_name,
        badge: project.project_key,
        project_id: project.project_id,
        created: project.created,
        tasks_created: project.tasks_created,
        tasks_updated: project.tasks_updated,
        tasks_skipped: project.tasks_skipped,
        truncated: project.tasks_truncated,
        webhook_registered: project.webhook_registered,
    })),
    // Jira's skipped rows carry the composite id under `project_id` (§13.3)
    skipped: (raw?.skipped_projects ?? []).map((project) => ({
        id: project.project_id,
        reason: project.reason,
    })),
    unmatched_users: raw?.unmatched_jira_users ?? [],
    ...(raw?.remaining_project_ids
        ? { remaining_ids: raw.remaining_project_ids }
        : {}),
});

const trelloToItem = (row: TrelloBoard): IntegrationItem => ({
    id: row.id,
    name: row.name,
    // no cheap card count (§2.5); an unnamed workspace would render a second
    // "Other" group header, so it folds into the workspace-less bucket
    workspace: row.workspace?.name
        ? { id: row.workspace.id, name: row.workspace.name }
        : null,
    already_imported: row.already_imported,
    project_id: row.project_id,
});

const trelloToResult = (raw: TrelloImportResult): IntegrationImportResult => ({
    imported: (raw?.imported ?? []).map((board) => ({
        id: board.board_id,
        name: board.board_name,
        project_id: board.project_id,
        created: board.created,
        tasks_created: board.tasks_created,
        tasks_updated: board.tasks_updated,
        tasks_skipped: board.tasks_skipped,
        truncated: board.tasks_truncated,
        webhook_registered: board.webhook_registered,
    })),
    skipped: (raw?.skipped_boards ?? []).map((board) => ({
        id: board.board_id,
        reason: board.reason,
    })),
    unmatched_users: raw?.unmatched_trello_users ?? [],
    ...(raw?.remaining_board_ids
        ? { remaining_ids: raw.remaining_board_ids }
        : {}),
});

const PROVIDERS: Record<
    "monday" | "clickup" | "asana" | "jira" | "trello",
    ProviderConfig
> = {
    monday: {
        base: "/monday",
        authPrefix: "monday.com",
        itemsPath: "/boards",
        idsField: "board_ids",
        toItem: mondayToItem,
        toResult: mondayToResult,
    },
    clickup: {
        base: "/clickup",
        authPrefix: "ClickUp",
        itemsPath: "/lists",
        idsField: "list_ids",
        toItem: clickupToItem,
        toResult: clickupToResult,
    },
    asana: {
        base: "/asana",
        authPrefix: "Asana",
        itemsPath: "/projects",
        idsField: "project_gids",
        toItem: asanaToItem,
        toResult: asanaToResult,
    },
    jira: {
        base: "/jira",
        authPrefix: "Jira",
        itemsPath: "/projects",
        idsField: "project_ids",
        toItem: jiraToItem,
        toResult: jiraToResult,
    },
    trello: {
        base: "/trello",
        // 401 message: "Trello rejected the access token. Please reconnect…"
        authPrefix: "Trello",
        itemsPath: "/boards",
        idsField: "board_ids",
        toItem: trelloToItem,
        toResult: trelloToResult,
    },
};

type ProviderKey = keyof typeof PROVIDERS;

/** Own keys only — `"toString" in PROVIDERS` is true, and it is no provider. */
export const isProviderKey = (provider: unknown): provider is ProviderKey =>
    typeof provider === "string" &&
    Object.prototype.hasOwnProperty.call(PROVIDERS, provider);

export const providerConfig = (provider: string) => {
    if (!isProviderKey(provider)) {
        throw new Error(`Unknown integration provider: ${provider}`);
    }
    return PROVIDERS[provider];
};
