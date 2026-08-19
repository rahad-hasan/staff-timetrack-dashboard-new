/**
 * A tracked "url" row carries whatever the desktop agent captured for the active
 * browser tab: usually a bare host ("github.com"), sometimes a full URL, and
 * sometimes a plain window title ("Firefox Installer") or a non-public host
 * ("localhost", "192.168.0.10"). Only a real public hostname can resolve to a
 * favicon, so parsing returns null for everything else and callers fall back to
 * initials instead of requesting an icon that can never exist.
 */

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const HOSTNAME =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const getSiteHostname = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;

  let host = value.trim().toLowerCase();
  if (!host) return null;

  // Peel the URL apart in this order — scheme, then path/query/hash, then
  // credentials, then port — so an "@" or ":" inside a path can never be
  // mistaken for a userinfo or port delimiter (e.g. "github.com/@user").
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  host = host.split(/[/?#]/)[0];
  host = host.slice(host.lastIndexOf("@") + 1);
  host = host.split(":")[0];
  host = host.replace(/^www\./, "").replace(/\.$/, "");

  if (!host || IPV4.test(host) || !HOSTNAME.test(host)) return null;

  return host;
};

/**
 * DuckDuckGo's favicon service — no API key, no per-domain config, and it
 * answers for any public host. Returns undefined when the value is not a real
 * domain so the avatar can skip the request entirely.
 */
export const getFaviconUrl = (value?: string | null): string | undefined => {
  const host = getSiteHostname(value);
  return host
    ? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`
    : undefined;
};

/** Two-letter placeholder shown while the favicon loads, or in place of it. */
export const getSiteInitials = (value?: string | null): string => {
  const label =
    getSiteHostname(value)?.split(".")[0] ??
    (typeof value === "string" ? value.trim() : "");

  const initials = label.replace(/[^a-z0-9]/gi, "").slice(0, 2);
  return initials ? initials.toUpperCase() : "?";
};
