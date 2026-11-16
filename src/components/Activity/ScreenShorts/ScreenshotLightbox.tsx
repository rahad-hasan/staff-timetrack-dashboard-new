"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { loadOrReload } from "@/lib/lazyChunk";
import { useLatched } from "@/lib/onboarding/useLatched";
import type { IAllScreenshot, TTimelineDetail } from "@/types/type";
import type { LightboxModalProps } from "./ScreenshotLightboxModals";

/*
 * The viewers (framer-motion and the embla carousel, about 50 kB gzipped) are
 * one chunk of their own: they are off screen until a screenshot is clicked,
 * and used to be part of what the screenshots page had to download and run
 * before it could hydrate. Viewing is what the page is for, though, so the
 * chunk is fetched as soon as the browser is idle after the grid mounts; the
 * dimmed placeholder covers a click that still beats it.
 */
const importLightboxModals = () => import("./ScreenshotLightboxModals");
const loadEvery10MinsModal = loadOrReload(() =>
  importLightboxModals().then((module) => module.Every10MinsLightboxModal),
);
const loadAllScreenshotsModal = loadOrReload(() =>
  importLightboxModals().then((module) => module.AllScreenshotsLightboxModal),
);

/** The viewers' backdrop, until the viewer itself can draw. */
const ViewerLoading = () => (
  <div
    role="status"
    aria-label="Loading screenshot"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
  >
    <Loader2 className="size-8 animate-spin text-white" />
  </div>
);

const Every10MinsModal = dynamic(loadEvery10MinsModal, {
  ssr: false,
  loading: ViewerLoading,
});
const AllScreenshotsModal = dynamic(loadAllScreenshotsModal, {
  ssr: false,
  loading: ViewerLoading,
});

// The raw import, never the loaders above: a warm-up must not reload the page.
const warmLightboxModals = () => {
  importLightboxModals().catch(() => {});
};

interface Lightbox<T> {
  open: (screenshot: T) => void;
  publish: (screenshots: T[]) => void;
}

/*
 * The screenshot lightbox, kept ABOVE the view's LiveDataBoundary.
 *
 * A failed refresh (the live refresh, or the action that re-signs expired
 * URLs) throws the view into that boundary, which swaps the grid for an error
 * card. A lightbox inside the grid went with it: the screenshot someone was
 * looking at closed, carousel position and all. Up here it stays open on the
 * screenshots it has, and takes the freshly signed URLs once the grid is back.
 */
function createLightbox<T extends { id: number }>(
  Modal: ComponentType<LightboxModalProps<T>>,
) {
  const LightboxContext = createContext<Lightbox<T> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<T>();
    // The grid's latest screenshots, never emptied: a grid that failed has
    // none to give, and one that came back empty (a refusal, the day's
    // screenshots deleted elsewhere) must not empty an open carousel.
    const [screenshots, setScreenshots] = useState<T[]>([]);

    const lightbox = useMemo<Lightbox<T>>(
      () => ({
        open: (screenshot) => {
          setSelected(screenshot);
          setModalOpen(true);
        },
        publish: (latest) => {
          if (latest.length > 0) setScreenshots(latest);
        },
      }),
      [],
    );

    // The live copy of the clicked screenshot (a fresh URL), else the click-time one.
    const selectedImage =
      screenshots.find((screenshot) => screenshot.id === selected?.id) ??
      selected;

    // Fetch the viewer once the grid is up and the browser has a moment.
    useEffect(() => {
      if ("requestIdleCallback" in window) {
        const handle = window.requestIdleCallback(warmLightboxModals, {
          timeout: 3_000,
        });
        return () => window.cancelIdleCallback(handle);
      }
      const timer = setTimeout(warmLightboxModals, 1_500);
      return () => clearTimeout(timer);
    }, []);

    // Mounted with the first open and kept from then on: the viewer owns its
    // AnimatePresence, so it has to outlive `modalOpen` to animate out.
    const viewerMounted = useLatched(modalOpen && selectedImage !== undefined);

    return (
      <LightboxContext.Provider value={lightbox}>
        {children}
        {viewerMounted && selectedImage && (
          <Modal
            screenShorts={screenshots}
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            selectedImage={selectedImage}
          />
        )}
      </LightboxContext.Provider>
    );
  }

  /** Hands the lightbox the grid's current screenshots; returns its opener. */
  function useLightbox(current: T[] | undefined) {
    const lightbox = useContext(LightboxContext);
    if (!lightbox) {
      throw new Error("A screenshot grid needs its lightbox provider above it.");
    }
    const { open, publish } = lightbox;
    useEffect(() => publish(current ?? []), [publish, current]);
    return open;
  }

  return { Provider, useLightbox };
}

const every10Mins = createLightbox<TTimelineDetail>(Every10MinsModal);
/** Wraps the "Every 10 min" view, above its LiveDataBoundary. */
export const Every10MinsLightbox = every10Mins.Provider;
export const useEvery10MinsLightbox = every10Mins.useLightbox;

const allScreenshots = createLightbox<IAllScreenshot>(AllScreenshotsModal);
/** Wraps the "All Screenshots" view, above its LiveDataBoundary. */
export const AllScreenshotsLightbox = allScreenshots.Provider;
export const useAllScreenshotsLightbox = allScreenshots.useLightbox;
