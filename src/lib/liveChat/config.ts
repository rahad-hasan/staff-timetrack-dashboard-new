/**
 * Live chat (Crisp): the one place to change where the widget loads from and
 * what the prompt says.
 */

/**
 * Public Crisp website ID. It is the same inbox the marketing site feeds, so a
 * visitor who chatted before signing up reaches the same team.
 *
 * Not a secret: Crisp embeds it in every page it runs on. It is `NEXT_PUBLIC_`
 * and therefore inlined at BUILD time, so changing it needs a rebuild. When it
 * is unset the feature is off: nothing loads and nothing renders.
 */
export const CRISP_WEBSITE_ID =
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || null;

/**
 * The dashboard is English-only. Pinned rather than detected so a browser set
 * to another language does not get a chat UI that disagrees with the app.
 */
export const LIVE_CHAT_LOCALE = "en";

/**
 * Tags every conversation started here, so the inbox can tell a paying
 * customer inside the product from a prospect on the marketing site.
 */
export const LIVE_CHAT_SEGMENT = "dashboard";

const unread = (count: number) =>
  `${count} unread ${count === 1 ? "message" : "messages"}`;

export const LIVE_CHAT_COPY = {
  region: "Live chat",
  launcher: "Chat with us",
  /** Spoken only: the launcher's name while a reply is waiting. */
  launcherWithUnread: (count: number) => `Chat with us, ${unread(count)}`,
  /** Spoken only: announced when a reply arrives while the chat is closed. */
  unreadAnnouncement: (count: number) => `${unread(count)} from support`,
} as const;
