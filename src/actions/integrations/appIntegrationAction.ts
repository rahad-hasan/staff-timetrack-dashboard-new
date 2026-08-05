// "use server";

// import {
//     AsanaImportResult,
//     AsanaProject,
//     ClickUpImportResult,
//     ClickUpList,
//     IntegrationImportPayload,
//     IntegrationImportResult,
//     IntegrationItem,
//     IntegrationStatusResponse,
//     IResponse,
//     JiraImportResult,
//     JiraProject,
//     MondayBoard,
//     MondayImportResult,
// } from "@/types/type";
// import axios, { AxiosResponse } from "axios";
// import { revalidateTag } from "next/cache";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import { baseApi } from "../baseApi";

// /**
//  * Server-side whitelist of app-integration providers. A new provider
//  * (Slack) is enabled here + in the client registry — the generic
//  * actions below need no changes beyond a config entry.
//  *
//  * `authPrefix` — provider endpoints answer 401 with a message starting with
//  * this prefix when the *provider* revoked the token (not a session expiry);
//  * baseApi then returns the error envelope instead of logging the user out.
//  *
//  * `toItem` / `toResult` — each provider's wire format (boards vs lists) is
//  * normalized to the neutral `Integration*` shapes here, so every component
//  * stays provider-agnostic.
//  */
// interface ProviderConfig {
//     base: string;
//     tag: string;
//     authPrefix: string;
//     /**
//      * listing endpoint path — "/boards" (monday), "/lists" (ClickUp),
//      * "/projects" (Asana and Jira)
//      */
//     itemsPath: string;
//     /** field name the provider's import endpoint expects the ids under */
//     idsField: string;
//     toItem: (row: never) => IntegrationItem;
//     toResult: (raw: never) => IntegrationImportResult;
// }

// const mondayToItem = (row: MondayBoard): IntegrationItem => ({
//     id: row.id,
//     name: row.name,
//     description: row.description,
//     items_count: row.items_count,
//     workspace: row.workspace,
//     already_imported: row.already_imported,
//     project_id: row.project_id,
// });

// const mondayToResult = (raw: MondayImportResult): IntegrationImportResult => ({
//     imported: (raw?.imported ?? []).map((board) => ({
//         id: board.board_id,
//         name: board.board_name,
//         project_id: board.project_id,
//         created: board.created,
//         tasks_created: board.tasks_created,
//         tasks_updated: board.tasks_updated,
//         tasks_skipped: board.tasks_skipped,
//         truncated: board.items_truncated,
//         webhook_registered: board.webhooks_registered,
//     })),
//     skipped: (raw?.skipped_boards ?? []).map((board) => ({
//         id: board.board_id,
//         reason: board.reason,
//     })),
//     unmatched_users: raw?.unmatched_monday_users ?? [],
//     ...(raw?.remaining_board_ids
//         ? { remaining_ids: raw.remaining_board_ids }
//         : {}),
// });

// const clickupToItem = (row: ClickUpList): IntegrationItem => ({
//     id: row.id,
//     name: row.name,
//     items_count: row.task_count,
//     workspace: row.workspace,
//     space: row.space,
//     badge: row.folder?.name ?? null,
//     already_imported: row.already_imported,
//     project_id: row.project_id,
// });

// const clickupToResult = (raw: ClickUpImportResult): IntegrationImportResult => ({
//     imported: (raw?.imported ?? []).map((list) => ({
//         id: list.list_id,
//         name: list.list_name,
//         project_id: list.project_id,
//         created: list.created,
//         tasks_created: list.tasks_created,
//         tasks_updated: list.tasks_updated,
//         tasks_skipped: list.tasks_skipped,
//         truncated: list.tasks_truncated,
//         webhook_registered: list.webhook_registered,
//     })),
//     skipped: (raw?.skipped_lists ?? []).map((list) => ({
//         id: list.list_id,
//         reason: list.reason,
//     })),
//     unmatched_users: raw?.unmatched_clickup_users ?? [],
//     ...(raw?.remaining_list_ids
//         ? { remaining_ids: raw.remaining_list_ids }
//         : {}),
// });

// const asanaToItem = (row: AsanaProject): IntegrationItem => ({
//     id: row.id,
//     name: row.name,
//     // Asana's API has no cheap task count (§12.2) — the UI hides it
//     workspace: row.workspace,
//     badge: row.team,
//     already_imported: row.already_imported,
//     project_id: row.project_id,
// });

// const asanaToResult = (raw: AsanaImportResult): IntegrationImportResult => ({
//     imported: (raw?.imported ?? []).map((project) => ({
//         id: project.project_gid,
//         name: project.project_name,
//         project_id: project.project_id,
//         created: project.created,
//         tasks_created: project.tasks_created,
//         tasks_updated: project.tasks_updated,
//         tasks_skipped: project.tasks_skipped,
//         truncated: project.tasks_truncated,
//         webhook_registered: project.webhook_registered,
//     })),
//     skipped: (raw?.skipped_projects ?? []).map((project) => ({
//         id: project.project_gid,
//         reason: project.reason,
//     })),
//     unmatched_users: raw?.unmatched_asana_users ?? [],
//     ...(raw?.remaining_project_gids
//         ? { remaining_ids: raw.remaining_project_gids }
//         : {}),
// });

// const jiraToItem = (row: JiraProject): IntegrationItem => ({
//     // composite "<cloudId>:<projectId>" (§13.1) — opaque, passed straight back
//     id: row.id,
//     name: row.name,
//     // Jira's Site is its top-level container — the picker groups by it
//     workspace: row.site,
//     badge: row.key,
//     is_private: row.is_private,
//     already_imported: row.already_imported,
//     project_id: row.project_id,
// });

// const jiraToResult = (raw: JiraImportResult): IntegrationImportResult => ({
//     imported: (raw?.imported ?? []).map((project) => ({
//         id: project.project_id_external,
//         name: project.project_name,
//         badge: project.project_key,
//         project_id: project.project_id,
//         created: project.created,
//         tasks_created: project.tasks_created,
//         tasks_updated: project.tasks_updated,
//         tasks_skipped: project.tasks_skipped,
//         truncated: project.tasks_truncated,
//         webhook_registered: project.webhook_registered,
//     })),
//     // Jira's skipped rows carry the composite id under `project_id` (§13.3)
//     skipped: (raw?.skipped_projects ?? []).map((project) => ({
//         id: project.project_id,
//         reason: project.reason,
//     })),
//     unmatched_users: raw?.unmatched_jira_users ?? [],
//     ...(raw?.remaining_project_ids
//         ? { remaining_ids: raw.remaining_project_ids }
//         : {}),
// });

// const PROVIDERS: Record<"monday" | "clickup" | "asana" | "jira", ProviderConfig> = {
//     monday: {
//         base: "/monday",
//         tag: "monday-integration",
//         authPrefix: "monday.com",
//         itemsPath: "/boards",
//         idsField: "board_ids",
//         toItem: mondayToItem,
//         toResult: mondayToResult,
//     },
//     clickup: {
//         base: "/clickup",
//         tag: "clickup-integration",
//         authPrefix: "ClickUp",
//         itemsPath: "/lists",
//         idsField: "list_ids",
//         toItem: clickupToItem,
//         toResult: clickupToResult,
//     },
//     asana: {
//         base: "/asana",
//         tag: "asana-integration",
//         authPrefix: "Asana",
//         itemsPath: "/projects",
//         idsField: "project_gids",
//         toItem: asanaToItem,
//         toResult: asanaToResult,
//     },
//     jira: {
//         base: "/jira",
//         tag: "jira-integration",
//         authPrefix: "Jira",
//         itemsPath: "/projects",
//         idsField: "project_ids",
//         toItem: jiraToItem,
//         toResult: jiraToResult,
//     },
// };

// type ProviderKey = keyof typeof PROVIDERS;

// const providerConfig = (provider: string) => {
//     const config = PROVIDERS[provider as ProviderKey];
//     if (!config) {
//         throw new Error(`Unknown integration provider: ${provider}`);
//     }
//     return config;
// };

// /* ---------------- generic (same endpoint family for every provider) ---------------- */

// export const getIntegrationStatus = async (
//     provider: string,
// ): Promise<IResponse<IntegrationStatusResponse>> => {
//     const { base, tag, authPrefix } = providerConfig(provider);
//     return await baseApi(`${base}/status`, {
//         tag,
//         cache: "no-cache",
//         providerAuthPrefix: authPrefix,
//     });
// };

// export const getIntegrationAuthUrl = async (
//     provider: string,
// ): Promise<IResponse<string>> => {
//     const { base, tag, authPrefix } = providerConfig(provider);
//     return await baseApi(`${base}/connect`, {
//         tag,
//         cache: "no-cache",
//         providerAuthPrefix: authPrefix,
//     });
// };

// export const disconnectIntegration = async (
//     provider: string,
// ): Promise<IResponse<IntegrationStatusResponse>> => {
//     const { base, tag, authPrefix } = providerConfig(provider);
//     return await baseApi(`${base}/disconnect`, {
//         method: "DELETE",
//         tag,
//         cache: "no-cache",
//         providerAuthPrefix: authPrefix,
//     });
// };

// /**
//  * Import/sync legitimately run for minutes (§4.6) — the server-side fetch
//  * used by baseApi is cut off by undici's 5-minute headers timeout, so these
//  * two calls go through axios (plain node http, 15-minute ceiling) while
//  * returning the exact same envelope shape baseApi produces.
//  */
// const LONG_RUNNING_TIMEOUT_MS = 15 * 60 * 1000;

// const longRunningPost = async <T>(
//     path: string,
//     authPrefix: string,
//     body?: unknown,
// ): Promise<IResponse<T>> => {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("accessToken")?.value;

//     let res: AxiosResponse;
//     try {
//         res = await axios.post(
//             `${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`,
//             body ?? {},
//             {
//                 headers: {
//                     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//                     "Content-Type": "application/json",
//                 },
//                 timeout: LONG_RUNNING_TIMEOUT_MS,
//                 validateStatus: () => true,
//             },
//         );
//     } catch {
//         return {
//             success: false,
//             message: "Server is not active. Please try again later.",
//         } as IResponse<T>;
//     }

//     const data = res.data;
//     if (res.status === 401) {
//         if (
//             typeof data?.message === "string" &&
//             data.message.startsWith(authPrefix)
//         ) {
//             return {
//                 success: false,
//                 statusCode: 401,
//                 message: data.message,
//                 errorMessages: data?.errorMessages,
//             } as IResponse<T>;
//         }
//         redirect("/session-expired");
//     }
//     if (res.status < 200 || res.status >= 300) {
//         return {
//             success: false,
//             message:
//                 data?.message ||
//                 data?.errorMessages?.[0]?.message ||
//                 `Request failed with ${res.status}`,
//             errorMessages: data?.errorMessages,
//         } as IResponse<T>;
//     }
//     return data as IResponse<T>;
// };

// /* -------- item-picker family (§9: same endpoint family per provider) -------- */

// export const getIntegrationItems = async (
//     provider: string,
// ): Promise<IResponse<IntegrationItem[]>> => {
//     const { base, tag, authPrefix, itemsPath, toItem } =
//         providerConfig(provider);
//     const res = await baseApi<IResponse<never[]>>(`${base}${itemsPath}`, {
//         tag,
//         cache: "no-cache",
//         providerAuthPrefix: authPrefix,
//     });
//     if (res?.success) {
//         // tolerate a malformed success envelope — the UI expects an array
//         return {
//             ...res,
//             data: Array.isArray(res.data) ? res.data.map(toItem) : [],
//         };
//     }
//     return res as unknown as IResponse<IntegrationItem[]>;
// };

// export const importIntegrationItems = async (
//     provider: string,
//     payload: IntegrationImportPayload,
// ): Promise<IResponse<IntegrationImportResult>> => {
//     const { base, tag, authPrefix, idsField, toResult } =
//         providerConfig(provider);
//     const body: Record<string, unknown> = { [idsField]: payload.ids };
//     if (payload.start_date) body.start_date = payload.start_date;
//     if (payload.deadline) body.deadline = payload.deadline;
//     const res = await longRunningPost<never>(`${base}/import`, authPrefix, body);
//     if (res?.success) {
//         // imported boards/lists become ordinary projects/tasks — refresh those caches
//         revalidateTag(tag);
//         revalidateTag("projects");
//         revalidateTag("tasks");
//         return { ...res, data: toResult(res.data) };
//     }
//     return res as unknown as IResponse<IntegrationImportResult>;
// };

// export const syncIntegration = async (
//     provider: string,
// ): Promise<IResponse<IntegrationImportResult>> => {
//     const { base, tag, authPrefix, toResult } = providerConfig(provider);
//     const res = await longRunningPost<never>(`${base}/sync`, authPrefix);
//     if (res?.success) {
//         revalidateTag(tag);
//         revalidateTag("projects");
//         revalidateTag("tasks");
//         return { ...res, data: toResult(res.data) };
//     }
//     return res as unknown as IResponse<IntegrationImportResult>;
// };
