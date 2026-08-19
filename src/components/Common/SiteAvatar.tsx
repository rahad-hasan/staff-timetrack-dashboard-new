"use client";

import EntityAvatar from "@/components/Common/EntityAvatar";
import { getFaviconUrl, getSiteHostname, getSiteInitials } from "@/utils/siteIcon";

/**
 * Favicon chip for a tracked site. Rows whose "url" is really a window title
 * ("Firefox Installer") or a private host ("localhost") never request an icon,
 * because getFaviconUrl() refuses to build one for them.
 */
const SiteAvatar = ({
  url,
  className,
}: {
  url?: string | null;
  className?: string;
}) => (
  <EntityAvatar
    label={getSiteHostname(url) ?? url ?? ""}
    src={getFaviconUrl(url)}
    initials={getSiteInitials(url)}
    className={className}
  />
);

export default SiteAvatar;
