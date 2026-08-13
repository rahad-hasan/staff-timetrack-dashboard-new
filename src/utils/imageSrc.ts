/**
 * The API stores bucket object keys (e.g. "user/1712345-999.png") and only
 * turns them into absolute signed CDN URLs for response fields the signing
 * middleware knows about. A value that is still a bare key must never reach
 * next/image or an <img>: it would resolve against the app origin and 404,
 * which renders as a broken image rather than a fallback avatar.
 */
export const isRenderableImageSrc = (value?: unknown): value is string => {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  );
};
