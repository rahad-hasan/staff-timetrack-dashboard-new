"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supportApi } from "@/lib/support";
import {
  SUPPORT_ATTACHMENT_MAX_FILES,
  isImageFile,
  uploadSupportAttachment,
  validateAttachmentFile,
} from "@/lib/supportAttachments";
import type { UploadedAttachment } from "@/types/support";

export type SupportUploadStatus = "queued" | "uploading" | "done" | "error";

export interface SupportUploadItem {
  /** local id (React key) — not the attachment id */
  localId: string;
  name: string;
  size: number;
  contentType: string;
  isImage: boolean;
  /** object URL of the local file (images only) — instant thumbnail, revoked on remove/unmount */
  previewUrl: string | null;
  status: SupportUploadStatus;
  /** 0–100, browser → Next leg; 100 once the API answered */
  progress: number;
  /** the pending attachment row once uploaded (its `id` goes into `attachment_ids`) */
  uploaded: UploadedAttachment | null;
  error: string | null;
}

export interface AddFilesResult {
  added: number;
  /** "name: reason" lines, ready for a toast or an inline list */
  rejected: string[];
}

export interface UseSupportUploadsOptions {
  /** per ticket / per message cap (backend MAX_PER_MESSAGE = 10) */
  max?: number;
  /** parallel uploads (the rest queue) — keeps 10 × 10 MB from saturating the uplink */
  concurrency?: number;
}

const newLocalId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * The v2 attachment queue shared by the create form and the reply composer
 * (§8.3: upload first → pending rows → `attachment_ids` on create/messages).
 * Validates against the client mirror of the policy (type, empty, 10 MB,
 * duplicates, the 10-file cap), uploads immediately with progress (XHR via
 * `uploadSupportAttachment`, at most `concurrency` at a time), aborts on
 * remove, retries on demand, deletes orphaned pending rows on remove and on
 * unmount unless a submission is in flight (`setSubmitLock(true)` right
 * before sending the ids, `reset()` after success).
 */
export function useSupportUploads(options: UseSupportUploadsOptions = {}) {
  const max = options.max ?? SUPPORT_ATTACHMENT_MAX_FILES;
  const concurrency = Math.max(1, options.concurrency ?? 3);

  const [items, setItems] = useState<SupportUploadItem[]>([]);
  const itemsRef = useRef<SupportUploadItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const controllersRef = useRef(new Map<string, AbortController>());
  const submitLockRef = useRef(false);
  const mountedRef = useRef(true);

  const commit = useCallback((next: SupportUploadItem[]) => {
    itemsRef.current = next;
    if (mountedRef.current) setItems(next);
  }, []);

  const patch = useCallback(
    (localId: string, change: Partial<SupportUploadItem>) => {
      commit(itemsRef.current.map((item) => (item.localId === localId ? { ...item, ...change } : item)));
    },
    [commit],
  );

  const pump = useCallback(() => {
    const active = itemsRef.current.filter((item) => item.status === "uploading").length;
    let slots = concurrency - active;
    if (slots <= 0) return;
    for (const item of itemsRef.current) {
      if (slots <= 0) break;
      if (item.status !== "queued") continue;
      const file = filesRef.current.get(item.localId);
      if (!file) continue;
      slots -= 1;
      const controller = new AbortController();
      controllersRef.current.set(item.localId, controller);
      patch(item.localId, { status: "uploading", progress: 0, error: null });
      void uploadSupportAttachment(file, {
        signal: controller.signal,
        onProgress: (progress) => {
          const current = itemsRef.current.find((entry) => entry.localId === item.localId);
          if (current && current.status === "uploading" && progress !== current.progress) {
            patch(item.localId, { progress });
          }
        },
      }).then((result) => {
        controllersRef.current.delete(item.localId);
        const still = itemsRef.current.some((entry) => entry.localId === item.localId);
        if (result.ok) {
          if (!still || !mountedRef.current) {
            // removed (or unmounted) while the request was finishing: drop the orphan
            void supportApi.deletePendingAttachment(result.data.id).catch(() => undefined);
            return;
          }
          patch(item.localId, { status: "done", progress: 100, uploaded: result.data, error: null });
        } else if (!result.aborted && still) {
          patch(item.localId, { status: "error", error: result.message });
        }
        pump();
      });
    }
  }, [concurrency, patch]);

  const addFiles = useCallback(
    (incoming: File[] | FileList): AddFilesResult => {
      const files = Array.from(incoming);
      const rejected: string[] = [];
      const accepted: SupportUploadItem[] = [];
      const current = itemsRef.current;
      let remaining = max - current.length;

      for (const file of files) {
        const reason = validateAttachmentFile(file);
        if (reason) {
          rejected.push(`${file.name}: ${reason}`);
          continue;
        }
        const duplicate = [...current, ...accepted].some(
          (item) => item.status !== "error" && item.name === file.name && item.size === file.size,
        );
        if (duplicate) {
          rejected.push(`${file.name}: already added`);
          continue;
        }
        if (remaining <= 0) {
          rejected.push(`${file.name}: you can add up to ${max} attachments`);
          continue;
        }
        remaining -= 1;
        const localId = newLocalId();
        const image = isImageFile(file);
        filesRef.current.set(localId, file);
        accepted.push({
          localId,
          name: file.name,
          size: file.size,
          contentType: file.type,
          isImage: image,
          previewUrl: image && typeof URL !== "undefined" ? URL.createObjectURL(file) : null,
          status: "queued",
          progress: 0,
          uploaded: null,
          error: null,
        });
      }

      if (accepted.length > 0) {
        commit([...current, ...accepted]);
        pump();
      }
      return { added: accepted.length, rejected };
    },
    [commit, max, pump],
  );

  const remove = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((entry) => entry.localId === localId);
      if (!item) return;
      controllersRef.current.get(localId)?.abort();
      controllersRef.current.delete(localId);
      filesRef.current.delete(localId);
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      commit(itemsRef.current.filter((entry) => entry.localId !== localId));
      if (item.status === "done" && item.uploaded) {
        // best effort; 409/404 once referenced or already gone — the chip is gone either way
        void supportApi.deletePendingAttachment(item.uploaded.id).catch(() => undefined);
      }
      pump();
    },
    [commit, pump],
  );

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((entry) => entry.localId === localId);
      if (!item || item.status !== "error" || !filesRef.current.has(localId)) return;
      patch(localId, { status: "queued", progress: 0, error: null, uploaded: null });
      pump();
    },
    [patch, pump],
  );

  /** After a successful submit: the rows are referenced now and must stay. */
  const reset = useCallback(() => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    itemsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    filesRef.current.clear();
    submitLockRef.current = false;
    commit([]);
  }, [commit]);

  /** true right before sending the ids, false once that request settled (success → `reset()`). */
  const setSubmitLock = useCallback((locked: boolean) => {
    submitLockRef.current = locked;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controllers = controllersRef.current;
    return () => {
      // Strict-mode safe: a simulated unmount right after mount has no items yet.
      mountedRef.current = false;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      const locked = submitLockRef.current;
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (!locked && item.status === "done" && item.uploaded) {
          void supportApi.deletePendingAttachment(item.uploaded.id).catch(() => undefined);
        }
      });
    };
  }, []);

  const ids = useMemo(
    () => items.flatMap((item) => (item.status === "done" && item.uploaded ? [item.uploaded.id] : [])),
    [items],
  );
  const uploading = items.some((item) => item.status === "uploading" || item.status === "queued");
  const hasErrors = items.some((item) => item.status === "error");

  // One object per state change (not per render), so callers can depend on `uploads` itself.
  return useMemo(
    () => ({
      items,
      max,
      remaining: Math.max(0, max - items.length),
      isFull: items.length >= max,
      addFiles,
      remove,
      retry,
      reset,
      setSubmitLock,
      /** `attachment_ids` for `POST /tickets` and `POST /tickets/:id/messages` */
      ids,
      uploading,
      hasErrors,
    }),
    [items, max, addFiles, remove, retry, reset, setSubmitLock, ids, uploading, hasErrors],
  );
}

export type SupportUploads = ReturnType<typeof useSupportUploads>;
