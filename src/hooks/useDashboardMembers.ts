"use client";

import { useEffect, useState } from "react";
import { readLiveJson } from "@/lib/readLiveJson";

export interface DashboardMember {
  id: number;
  name: string;
  image: string;
}

type ProjectId = string | number | null | undefined;

/** Served by src/app/api/dashboard/members/route.ts. */
const MEMBERS_URL = "/api/dashboard/members";

const keyOf = (projectId: ProjectId) =>
  projectId === null || projectId === undefined || projectId === ""
    ? ""
    : String(projectId);

interface MembersRead {
  members: Promise<DashboardMember[] | null>;
  controller: AbortController;
  /** Pickers waiting on it; the last one to leave cancels it. */
  waiting: number;
}

/*
 * One request per project filter at a time, shared by every picker on screen
 * (the work report mounts two user pickers at once). Entries are removed the
 * moment they settle: this de-duplicates concurrent mounts — it is NOT a
 * cache, so a member added a second ago is always in the next load.
 */
const inFlight = new Map<string, MembersRead>();

/** Joins (or starts) the read for `key`; `leave` cancels it once no picker waits on it. */
function loadMembers(key: string) {
  let read = inFlight.get(key);
  if (!read) {
    const controller = new AbortController();
    const started: MembersRead = {
      members: readLiveJson<DashboardMember[]>(MEMBERS_URL, {
        query: { project_id: key },
        signal: controller.signal,
      })
        .then((res) =>
          res?.success && Array.isArray(res.data) ? res.data : null,
        )
        .finally(() => {
          if (inFlight.get(key) === started) inFlight.delete(key);
        }),
      controller,
      waiting: 0,
    };
    inFlight.set(key, started);
    read = started;
  }
  const joined = read;
  joined.waiting += 1;
  return {
    members: joined.members,
    leave: () => {
      joined.waiting -= 1;
      if (joined.waiting > 0) return;
      joined.controller.abort();
      if (inFlight.get(key) === joined) inFlight.delete(key);
    },
  };
}

interface MembersState {
  members: DashboardMember[];
  loading: boolean;
  error: boolean;
  /** Project key ("" = all members) whose members `members` holds; null before the first load. */
  loadedFor: string | null;
}

/**
 * Members for a picker, optionally narrowed to one project's assignees.
 *
 * The single implementation of the fetch that every member picker used to
 * copy. Two guarantees the copies lacked: a response for a project the user
 * has already switched away from is dropped instead of overwriting the newer
 * list, and pickers mounting together share one request.
 *
 * `loadedFor` tells a caller whose follow-up depends on the loaded list (e.g.
 * re-selecting an assignee) which project the current `members` belong to.
 */
export function useDashboardMembers(
  projectId?: ProjectId,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const key = keyOf(projectId);
  const [state, setState] = useState<MembersState>({
    members: [],
    loading: enabled,
    error: false,
    loadedFor: null,
  });

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    const { members, leave } = loadMembers(key);
    members.then((list) => {
      if (!current) return;
      setState({
        members: list ?? [],
        loading: false,
        error: list === null,
        loadedFor: key,
      });
    });
    return () => {
      current = false;
      leave();
    };
  }, [key, enabled]);

  return state;
}
