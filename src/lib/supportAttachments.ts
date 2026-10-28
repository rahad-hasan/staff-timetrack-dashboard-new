/**
 * Client-side mirror of the backend attachment policy
 * (backend: src/app/lib/supportAttachmentPolicy.ts) plus the browser upload
 * call. The server is the authority (magic-byte sniffing, ownership, the
 * 10-per-message cap); these checks only give instant feedback.
 *
 * The step-9 screens read AttachmentDTO objects (`ticket.files[]`,
 * `message.files[]`) with a 15-minute `download_url` and an `id` the v2
 * bodies reference (`attachment_ids[]`). `attachmentKeyFromUrl` recovers an
 * object key from a signed URL so one file can be re-signed
 * (ticket/attachmentUrls.tsx).
 */

import type { AttachmentDTO, UploadedAttachment } from "@/types/support";
import { narrowUploadedAttachments } from "@/zod/supportSchema";
import { parseRetryAfter, type SupportFail, type SupportResult } from "@/lib/support";

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

/** The multipart relay (`src/app/api/support/attachments/route.ts`, field `files`). */
export const SUPPORT_UPLOAD_ENDPOINT = "/api/support/attachments";

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

export const formatFileSize = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "";
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

/* ───────────────────────────── v1 string helpers ───────────────────────────── */

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

/* ───────────────────────────── AttachmentDTO helpers ───────────────────────────── */

export const isImageAttachmentDTO = (file: Pick<AttachmentDTO, "is_image" | "file_name" | "mime_type">) =>
  file.is_image ||
  (file.mime_type?.startsWith("image/") ?? false) ||
  IMAGE_EXTENSION_SET.has(fileExtension(file.file_name));

/**
 * The link for a DTO: its 15-minute `download_url`, or null once signing
 * failed — the caller refetches the ticket (which re-signs every file) rather
 * than rendering a dead link.
 */
export const attachmentDtoHref = (file: Pick<AttachmentDTO, "download_url">) =>
  file.download_url && /^https?:\/\//i.test(file.download_url) ? file.download_url : null;

/* ───────────────────────────── upload (XHR, with progress) ───────────────────────────── */

export interface UploadOptions {
  signal?: AbortSignal;
  /** 0–100 for the browser → Next leg; the Next → API → bucket leg shows as 100. */
  onProgress?: (percent: number) => void;
}

const uploadMessageFor = (status: number, message: string | null) => {
  if (message) return message;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 413) return "Files must be 10 MB or smaller";
  if (status === 429) return "Too many uploads. Please wait a moment.";
  if (status === 0) return "Network error. Please try again.";
  return "Upload failed. Please try again.";
};

/**
 * Uploads ONE file and answers its pending attachment row (`id` + v1 `key`).
 * `fetch` cannot report upload progress, so this is an XHR; the AbortSignal
 * aborts it (the chip's "×" and unmount cleanup).
 */
export const uploadSupportAttachment = (
  file: File,
  options: UploadOptions = {},
): Promise<SupportResult<UploadedAttachment>> =>
  new Promise((resolve) => {
    const { signal, onProgress } = options;
    const fail = (
      status: number,
      message: string,
      code: SupportFail["code"],
      aborted = false,
      retryAfterMs: number | null = null,
    ): SupportFail => ({ ok: false, status, message, code, errors: [], aborted, retryAfterMs });

    if (signal?.aborted) {
      resolve(fail(0, "Upload cancelled", "ABORTED", true));
      return;
    }

    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("files", file, file.name);

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const done = (result: SupportResult<UploadedAttachment>) => {
      signal?.removeEventListener("abort", onAbort);
      resolve(result);
    };

    xhr.open("POST", SUPPORT_UPLOAD_ENDPOINT);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      const envelope = (xhr.response ?? null) as {
        success?: boolean;
        message?: string;
        data?: unknown;
      } | null;
      if (xhr.status === 401) {
        done(fail(401, uploadMessageFor(401, envelope?.message ?? null), "SESSION_EXPIRED"));
        return;
      }
      if (xhr.status === 429) {
        done(
          fail(429, uploadMessageFor(429, envelope?.message ?? null), "RATE_LIMITED", false, parseRetryAfter(xhr.getResponseHeader("retry-after"))),
        );
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && envelope?.success) {
        const rows = narrowUploadedAttachments(envelope.data);
        const first = rows?.[0];
        if (first) {
          onProgress?.(100);
          done({
            ok: true,
            status: xhr.status,
            data: first,
            meta: null,
            message: envelope.message ?? "Uploaded",
            replayed: false,
          });
          return;
        }
        done(fail(xhr.status, "Unexpected response from the server.", "VALIDATION"));
        return;
      }
      done(
        fail(
          xhr.status,
          uploadMessageFor(xhr.status, envelope?.message ?? null),
          xhr.status === 413 || xhr.status === 422 ? "ATTACHMENT_INVALID" : null,
        ),
      );
    };
    xhr.onerror = () => done(fail(0, uploadMessageFor(0, null), "NETWORK"));
    xhr.onabort = () => done(fail(0, "Upload cancelled", "ABORTED", true));
    xhr.send(body);
  });
