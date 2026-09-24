/**
 * Client-side mirror of the backend attachment policy
 * (backend: src/app/lib/supportAttachmentPolicy.ts). The server is the
 * authority; these checks only give instant feedback before the upload.
 */

export const SUPPORT_ATTACHMENT_MAX_FILES = 10;
export const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"] as const;

export const SUPPORT_ATTACHMENT_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "log",
  "md",
  "json",
  "zip",
] as const;

/** `accept` attribute for the file picker. */
export const SUPPORT_ATTACHMENT_ACCEPT = SUPPORT_ATTACHMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export const SUPPORT_ATTACHMENT_KEY_PREFIX = "support-attachments/";

const IMAGE_EXTENSION_SET = new Set<string>(IMAGE_EXTENSIONS);
const ALLOWED_EXTENSION_SET = new Set<string>(SUPPORT_ATTACHMENT_EXTENSIONS);

const MIME_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
};

export const fileExtension = (name: string) => {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
};

export const isImageFile = (file: File) =>
  file.type.startsWith("image/") || IMAGE_EXTENSION_SET.has(fileExtension(file.name));

/** Returns a human-readable reason when the file must not be uploaded, else null. */
export const validateAttachmentFile = (file: File): string | null => {
  const extension = fileExtension(file.name);
  if (!extension || !ALLOWED_EXTENSION_SET.has(extension)) {
    return "Unsupported file type";
  }
  if (file.size === 0) return "This file is empty";
  if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
    return "Files must be 10 MB or smaller";
  }
  return null;
};

export const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Clipboard images arrive as "image.png" from every browser. Give them a
 * name that survives ten pasted screenshots in one ticket.
 */
export const normalisePastedFile = (file: File) => {
  if (!file.type.startsWith("image/")) return file;
  const extension =
    MIME_EXTENSION[file.type.toLowerCase()] ?? fileExtension(file.name) ?? "png";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  const name = `pasted-image-${stamp}.${extension || "png"}`;
  try {
    return new File([file], name, { type: file.type, lastModified: file.lastModified });
  } catch {
    return file;
  }
};

/**
 * Recovers the object key from either a bare key or a signed URL to our
 * bucket (virtual-hosted `https://bucket.host/key?...` or path-style
 * `https://host/bucket/key?...`). Null for anything else (legacy URLs).
 */
export const attachmentKeyFromUrl = (value: string): string | null => {
  if (!value) return null;
  if (value.startsWith(SUPPORT_ATTACHMENT_KEY_PREFIX)) return value;
  try {
    const parsed = new URL(value);
    const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
    if (pathname.startsWith(SUPPORT_ATTACHMENT_KEY_PREFIX)) return pathname;
    const slash = pathname.indexOf("/");
    if (slash !== -1) {
      const rest = pathname.slice(slash + 1);
      if (rest.startsWith(SUPPORT_ATTACHMENT_KEY_PREFIX)) return rest;
    }
  } catch {
    // not a URL
  }
  return null;
};

/**
 * Where a click should go. Signed URLs embedded in the page expire after a
 * few minutes; the open route mints a fresh one on every click.
 */
export const attachmentOpenHref = (value: string) => {
  const key = attachmentKeyFromUrl(value);
  return key
    ? `/api/support/attachments/open?key=${encodeURIComponent(key)}`
    : value;
};

/** Original-ish filename: strips the `${timestamp}-${random}-` prefix the backend adds to keys. */
export const attachmentDisplayName = (value: string) => {
  const key = attachmentKeyFromUrl(value);
  let last: string | undefined;
  if (key) {
    last = key.split("/").pop();
  } else {
    try {
      const parsed = new URL(value);
      last = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    } catch {
      last = value;
    }
  }
  const cleaned = (last ?? value).replace(/^\d{10,}-\d+-/, "");
  return cleaned || value;
};

export const isImageAttachment = (value: string) =>
  IMAGE_EXTENSION_SET.has(fileExtension(attachmentDisplayName(value)));
