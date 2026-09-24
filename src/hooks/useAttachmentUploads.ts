"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteTicketAttachment } from "@/actions/support/action";
import {
  SUPPORT_ATTACHMENT_MAX_FILES,
  isImageFile,
  validateAttachmentFile,
} from "@/lib/supportAttachments";
import { UploadedTicketAttachment } from "@/types/support";

export type AttachmentUploadStatus = "uploading" | "done" | "error";

export interface AttachmentUploadItem {
  id: string;
  name: string;
  size: number;
  contentType: string;
  isImage: boolean;
  /** Object URL of the local file (images only) — instant thumbnail. */
  previewUrl: string | null;
  status: AttachmentUploadStatus;
  /** 0–100 for the browser → server leg; the server → bucket leg shows as 100 + "Processing". */
  progress: number;
  /** Object key, once uploaded. This is what the ticket / reply payload carries. */
  key: string | null;
  /** Signed preview URL from the upload response. */
  url: string | null;
  error: string | null;
  /** Kept for retry. */
  file: File | null;
}

export interface AddFilesResult {
  added: number;
  rejected: string[];
}

interface UploadEnvelope {
  success?: boolean;
  message?: string;
  data?: UploadedTicketAttachment[];
}

const UPLOAD_ENDPOINT = "/api/support/attachments";

const errorMessageFor = (status: number, envelope: UploadEnvelope | null) => {
  if (envelope?.message) return envelope.message;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 413) return "Files must be 10 MB or smaller";
  if (status === 429) return "Too many uploads. Please wait a moment.";
  if (status === 0) return "Network error. Please try again.";
  return "Upload failed. Please try again.";
};

/**
 * Owns the lifecycle of files attached to a ticket or a reply: validation,
 * immediate upload with progress, retry, removal (which also deletes the
 * unsent object server-side) and cleanup on unmount.
 *
 * Objects are uploaded as soon as they are added so the submit button never
 * has to wait for a 10 MB transfer. `keys` is what the parent puts in the
 * payload; `uploading` gates the submit.
 */
export function useAttachmentUploads(options?: { max?: number }) {
  const max = options?.max ?? SUPPORT_ATTACHMENT_MAX_FILES;
  const [items, setItems] = useState<AttachmentUploadItem[]>([]);
  const itemsRef = useRef<AttachmentUploadItem[]>([]);
  const requestsRef = useRef(new Map<string, XMLHttpRequest>());
  // True from the moment a create/reply request carrying these keys is sent
  // until it settles. Unmount cleanup must not delete objects the server is
  // about to reference (the user can still click "Back" mid-request).
  const submitLockRef = useRef(false);

  itemsRef.current = items;

  const patchItem = useCallback(
    (
      id: string,
      patch:
        | Partial<AttachmentUploadItem>
        | ((item: AttachmentUploadItem) => Partial<AttachmentUploadItem>),
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) }
            : item,
        ),
      );
    },
    [],
  );

  const startUpload = useCallback(
    (id: string, file: File) => {
      const xhr = new XMLHttpRequest();
      requestsRef.current.set(id, xhr);

      const body = new FormData();
      body.append("files", file, file.name);

      xhr.open("POST", UPLOAD_ENDPOINT);
      xhr.responseType = "json";

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        patchItem(id, { progress: Math.min(100, percent) });
      };

      xhr.onload = () => {
        requestsRef.current.delete(id);
        const envelope = (xhr.response ?? null) as UploadEnvelope | null;
        const uploaded = envelope?.data?.[0];

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          envelope?.success &&
          uploaded?.key
        ) {
          patchItem(id, {
            status: "done",
            progress: 100,
            key: uploaded.key,
            url: uploaded.url ?? null,
            error: null,
          });
          return;
        }

        patchItem(id, {
          status: "error",
          error: errorMessageFor(xhr.status, envelope),
        });
      };

      xhr.onerror = () => {
        requestsRef.current.delete(id);
        patchItem(id, { status: "error", error: errorMessageFor(0, null) });
      };

      xhr.onabort = () => {
        requestsRef.current.delete(id);
      };

      xhr.send(body);
    },
    [patchItem],
  );

  const addFiles = useCallback(
    (incoming: File[] | FileList): AddFilesResult => {
      const files = Array.from(incoming);
      const rejected: string[] = [];
      const accepted: AttachmentUploadItem[] = [];
      const current = itemsRef.current;
      let remaining = max - current.length;

      for (const file of files) {
        const reason = validateAttachmentFile(file);
        if (reason) {
          rejected.push(`${file.name}: ${reason}`);
          continue;
        }

        const duplicate =
          current.some(
            (item) =>
              item.status !== "error" &&
              item.name === file.name &&
              item.size === file.size,
          ) ||
          accepted.some((item) => item.name === file.name && item.size === file.size);
        if (duplicate) {
          rejected.push(`${file.name}: already added`);
          continue;
        }

        if (remaining <= 0) {
          rejected.push(`${file.name}: you can add up to ${max} attachments`);
          continue;
        }
        remaining -= 1;

        const isImage = isImageFile(file);
        accepted.push({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          contentType: file.type,
          isImage,
          previewUrl: isImage ? URL.createObjectURL(file) : null,
          status: "uploading",
          progress: 0,
          key: null,
          url: null,
          error: null,
          file,
        });
      }

      if (accepted.length > 0) {
        // Eager ref update so a second drop in the same tick validates against
        // the new count; functional setState so a progress/done patch queued
        // in the same batch is never overwritten by a stale snapshot.
        itemsRef.current = [...current, ...accepted];
        setItems((prev) => [...prev, ...accepted]);
        accepted.forEach((item) => {
          if (item.file) startUpload(item.id, item.file);
        });
      }

      return { added: accepted.length, rejected };
    },
    [max, startUpload],
  );

  const remove = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item) return;

    requestsRef.current.get(id)?.abort();
    requestsRef.current.delete(id);
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);

    itemsRef.current = itemsRef.current.filter((entry) => entry.id !== id);
    setItems((prev) => prev.filter((entry) => entry.id !== id));

    if (item.status === "done" && item.key) {
      // Best effort: the chip is gone locally either way.
      void deleteTicketAttachment(item.key).catch(() => undefined);
    }
  }, []);

  const retry = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item?.file || item.status === "uploading") return;
      patchItem(id, { status: "uploading", progress: 0, error: null, key: null, url: null });
      startUpload(id, item.file);
    },
    [patchItem, startUpload],
  );

  /**
   * Clears local state after a successful submit. The uploaded objects are
   * now referenced by the ticket / reply and must stay in the bucket.
   */
  const reset = useCallback(() => {
    requestsRef.current.forEach((xhr) => xhr.abort());
    requestsRef.current.clear();
    itemsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    itemsRef.current = [];
    submitLockRef.current = false;
    setItems([]);
  }, []);

  /** Call with true right before sending the keys, false once the request settled. */
  const setSubmitLock = useCallback((locked: boolean) => {
    submitLockRef.current = locked;
  }, []);

  // Leaving the form with unsent uploads (Cancel, back button): abort what is
  // in flight and drop the objects that already landed so the bucket does not
  // accumulate orphans. A successful submit calls reset() first, so nothing
  // is left here to delete in that path.
  useEffect(() => {
    const requests = requestsRef.current;
    return () => {
      requests.forEach((xhr) => xhr.abort());
      requests.clear();
      const locked = submitLockRef.current;
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (!locked && item.status === "done" && item.key) {
          void deleteTicketAttachment(item.key).catch(() => undefined);
        }
      });
      itemsRef.current = [];
    };
  }, []);

  const keys = useMemo(
    () =>
      items
        .filter((item) => item.status === "done" && item.key)
        .map((item) => item.key as string),
    [items],
  );

  const previewUrls = useMemo(
    () =>
      items
        .filter((item) => item.status === "done" && item.url)
        .map((item) => item.url as string),
    [items],
  );

  const uploading = items.some((item) => item.status === "uploading");
  const hasErrors = items.some((item) => item.status === "error");

  return {
    items,
    max,
    addFiles,
    remove,
    retry,
    reset,
    setSubmitLock,
    keys,
    previewUrls,
    uploading,
    hasErrors,
  };
}
