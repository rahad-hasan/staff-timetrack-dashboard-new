import { create } from "zustand";
import {
  getOnboardingStatus,
  updateOnboardingStatus,
} from "@/actions/onboarding/action";
import {
  IOnboardingStatus,
  IOnboardingStatusUpdate,
  ITourStep,
  OnboardingTaskId,
  TourId,
} from "@/types/onboarding";
import {
  stepsForTour,
  toGlobalIndex,
  tourForGlobalIndex,
  toLocalIndex,
} from "@/lib/onboarding/registry";

/**
 * Client cache of `GET /user/onboarding-status`, plus the live tour runtime.
 *
 * Two halves with deliberately different lifetimes:
 *
 *  - `status` mirrors the server and is the only thing that survives a reload.
 *    It follows the `billingStore` contract exactly — one shared in-flight
 *    request, a `requestId` so a superseded response cannot land on top of a
 *    fresher one, and `force` for every read-after-write.
 *  - `activeTour` / `stepIndex` / `welcomeOpen` are runtime only. They are
 *    NOT persisted to localStorage on purpose: a half-finished tour restored
 *    into a browser tab that has since navigated elsewhere spotlights a target
 *    that is not on screen. Resume is driven from the server's
 *    `currentStepIndex` instead, which the user opts into.
 */

/**
 * Step advances are written through a trailing debounce.
 *
 * Every `user.update` invalidates that user's Redis auth entry (see the client
 * extension in the backend's `lib/prisma.ts`), so a PATCH per step would make
 * the next request on every step re-read the user row from Postgres. Clicking
 * "Next" six times should cost one write, not six.
 */
const STEP_PERSIST_DEBOUNCE_MS = 900;
let stepPersistTimer: ReturnType<typeof setTimeout> | null = null;

interface OnboardingStore {
  /**
   * The current user's role, seeded server-side by `OnboardingGate`.
   *
   * Held here so surfaces outside the gate — the profile menu's "Restart
   * product tour" — can build a role-correct tour without reaching for
   * `logInUserStore`, which is localStorage-backed and empty on a fresh
   * browser. An undefined role filters every step away and would make that
   * menu item a silent no-op.
   */
  role: string | undefined;
  setRole: (role: string | undefined) => void;

  /* ---- server state ---- */
  status: IOnboardingStatus | null;
  loaded: boolean;
  inFlight: Promise<IOnboardingStatus | null> | null;
  requestId: number;
  fetchStatus: (options?: {
    force?: boolean;
  }) => Promise<IOnboardingStatus | null>;

  /* ---- server writes ---- */
  completeTask: (task: OnboardingTaskId) => Promise<void>;
  dismiss: () => Promise<void>;
  finish: () => Promise<void>;
  restart: () => Promise<void>;

  /* ---- tour runtime ---- */
  welcomeOpen: boolean;
  activeTour: TourId | null;
  steps: ITourStep[];
  stepIndex: number;
  checklistExpanded: boolean;

  openWelcome: () => void;
  closeWelcome: () => void;
  startTour: (tour: TourId, role: string | undefined, atIndex?: number) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: (options?: { completed?: boolean }) => void;
  setChecklistExpanded: (expanded: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()((set, get) => ({
  role: undefined,
  setRole: (role) => set({ role }),

  status: null,
  loaded: false,
  inFlight: null,
  requestId: 0,

  fetchStatus: async (options = {}) => {
    const inFlight = get().inFlight;
    if (inFlight && !options.force) return inFlight;

    const requestId = get().requestId + 1;
    set({ requestId });

    const request = (async () => {
      try {
        const res = await getOnboardingStatus();
        // Superseded by a newer (forced) request — drop this result rather
        // than overwriting fresher data with it.
        if (get().requestId !== requestId) return get().status;
        if (res?.success && res.data) {
          set({ status: res.data, loaded: true });
          return res.data;
        }
        // A failed read must still flip `loaded`, or the gate renders nothing
        // forever when the API is down.
        set({ loaded: true });
        return null;
      } finally {
        if (get().requestId === requestId) set({ inFlight: null });
      }
    })();

    set({ inFlight: request });
    return request;
  },

  /**
   * Optimistic, idempotent, and safe to call from any success handler.
   *
   * Call sites are ordinary "the create succeeded" branches (AddClientModal,
   * AddProjectModal, AddNewMemberModal), which fire on every create — not just
   * the first. Re-reporting an earned milestone must therefore be free: it
   * returns before touching the network.
   */
  completeTask: async (task) => {
    const status = get().status;
    if (!status || status.completedSteps.includes(task)) return;

    // Paint first. The checklist tick and the tooltip's inline "done" state are
    // the feedback for an action the user just took — waiting on a round-trip
    // to acknowledge it is what makes an app feel slow.
    set({
      status: { ...status, completedSteps: [...status.completedSteps, task] },
    });

    const res = await updateOnboardingStatus({ completeSteps: [task] });

    if (res?.success && res.data) {
      set({ status: res.data, loaded: true });
    } else {
      // Roll back rather than leave a tick the server does not know about —
      // a reload would silently un-check it and look like data loss.
      const current = get().status;
      if (current) {
        set({
          status: {
            ...current,
            completedSteps: current.completedSteps.filter((id) => id !== task),
          },
        });
      }
    }
  },

  dismiss: async () => {
    const status = get().status;
    if (status) set({ status: { ...status, isDismissed: true } });
    set({ welcomeOpen: false, activeTour: null, steps: [], stepIndex: 0 });

    await patchAndStore(set, get, { isDismissed: true });
  },

  finish: async () => {
    const status = get().status;
    if (status) set({ status: { ...status, isOnboardingCompleted: true } });

    await patchAndStore(set, get, { isOnboardingCompleted: true });
  },

  restart: async () => {
    flushStepTimer();
    set({
      activeTour: null,
      steps: [],
      stepIndex: 0,
      checklistExpanded: true,
    });

    await patchAndStore(set, get, { reset: true });
    set({ welcomeOpen: true });
  },

  /* ---- runtime ---- */

  welcomeOpen: false,
  activeTour: null,
  steps: [],
  stepIndex: 0,
  checklistExpanded: true,

  openWelcome: () => set({ welcomeOpen: true }),
  closeWelcome: () => set({ welcomeOpen: false }),

  startTour: (tour, role, atIndex = 0) => {
    const steps = stepsForTour(tour, role);
    if (steps.length === 0) return;

    const stepIndex = Math.min(Math.max(atIndex, 0), steps.length - 1);
    set({ welcomeOpen: false, activeTour: tour, steps, stepIndex });
    persistStep(get, tour, stepIndex);
  },

  goToStep: (index) => {
    const { steps, activeTour } = get();
    if (!activeTour || steps.length === 0) return;

    const stepIndex = Math.min(Math.max(index, 0), steps.length - 1);
    set({ stepIndex });
    persistStep(get, activeTour, stepIndex);
  },

  nextStep: () => {
    const { steps, stepIndex, activeTour } = get();
    if (!activeTour) return;

    if (stepIndex >= steps.length - 1) {
      // Last step of the core walkthrough hands off to the orientation tour
      // via the gate, which owns the "want the full tour?" prompt. Ending here
      // keeps that decision out of the store.
      get().endTour({ completed: true });
      return;
    }

    const next = stepIndex + 1;
    set({ stepIndex: next });
    persistStep(get, activeTour, next);
  },

  prevStep: () => {
    const { stepIndex, activeTour } = get();
    if (!activeTour || stepIndex === 0) return;

    const prev = stepIndex - 1;
    set({ stepIndex: prev });
    persistStep(get, activeTour, prev);
  },

  endTour: (options = {}) => {
    flushStepTimer();
    const { activeTour, steps, stepIndex, status } = get();
    set({ activeTour: null, steps: [], stepIndex: 0 });

    if (!activeTour) return;

    // One PATCH, not three. Finishing the orientation tour would otherwise
    // fire "step index", "milestone earned" and "onboarding complete" as
    // separate writes — three auth-cache invalidations for one click.
    const payload: IOnboardingStatusUpdate = {
      currentStepIndex: toGlobalIndex(activeTour, stepIndex),
    };

    if (options.completed) {
      const finishedStep = steps[stepIndex];
      if (finishedStep?.task) payload.completeSteps = [finishedStep.task];
      // Only the orientation tour ends the whole onboarding. Finishing the
      // core walkthrough hands off to the "see the rest of the dashboard?"
      // prompt, which the gate owns.
      if (activeTour === "orientation") payload.isOnboardingCompleted = true;
    }

    if (status) {
      set({
        status: {
          ...status,
          currentStepIndex: payload.currentStepIndex ?? status.currentStepIndex,
          isOnboardingCompleted:
            payload.isOnboardingCompleted ?? status.isOnboardingCompleted,
          completedSteps: payload.completeSteps
            ? Array.from(
                new Set([...status.completedSteps, ...payload.completeSteps]),
              )
            : status.completedSteps,
        },
      });
    }

    void patchAndStore(set, get, payload);
  },

  setChecklistExpanded: (expanded) => set({ checklistExpanded: expanded }),
}));

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

type Setter = (partial: Partial<OnboardingStore>) => void;
type Getter = () => OnboardingStore;

/**
 * PATCH, then adopt the server's answer as the new truth. The endpoint returns
 * the full status, so there is never a reason to follow a write with a read.
 */
async function patchAndStore(
  set: Setter,
  get: Getter,
  payload: IOnboardingStatusUpdate,
): Promise<IOnboardingStatus | null> {
  const res = await updateOnboardingStatus(payload);

  if (res?.success && res.data) {
    set({ status: res.data, loaded: true });
    return res.data;
  }

  // Leave the optimistic local state alone. Onboarding is not worth a red
  // toast on a flaky network — the next successful write or read reconciles.
  return get().status;
}

function flushStepTimer() {
  if (stepPersistTimer) {
    clearTimeout(stepPersistTimer);
    stepPersistTimer = null;
  }
}

/** Trailing-debounced write of the resume position. */
function persistStep(get: Getter, tour: TourId, localIndex: number) {
  flushStepTimer();

  const globalIndex = toGlobalIndex(tour, localIndex);
  const status = get().status;
  if (status) {
    // Keep the local mirror in step so a re-render reading `currentStepIndex`
    // does not briefly show the old position.
    useOnboardingStore.setState({
      status: { ...status, currentStepIndex: globalIndex },
    });
  }

  stepPersistTimer = setTimeout(() => {
    stepPersistTimer = null;
    void updateOnboardingStatus({ currentStepIndex: globalIndex });
  }, STEP_PERSIST_DEBOUNCE_MS);
}

/**
 * Where a resumed tour picks up, derived from the single persisted integer.
 * Returns null when there is nothing to resume.
 */
export const resumePoint = (
  status: IOnboardingStatus | null,
): { tour: TourId; index: number } | null => {
  if (!status || status.isOnboardingCompleted) return null;
  if (status.currentStepIndex <= 0) return null;

  const tour = tourForGlobalIndex(status.currentStepIndex);
  return { tour, index: toLocalIndex(tour, status.currentStepIndex) };
};
