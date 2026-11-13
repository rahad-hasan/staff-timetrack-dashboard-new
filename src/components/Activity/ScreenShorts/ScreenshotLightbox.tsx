"use client";

import { AnimatePresence } from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { IAllScreenshot, TTimelineDetail } from "@/types/type";
import AllScreenShortsModal from "./AllScreenShortsModal";
import ScreenShortsModal from "./ScreenShortsModal";

interface LightboxModalProps<T> {
  screenShorts: T[];
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  selectedImage: T;
}

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

    return (
      <LightboxContext.Provider value={lightbox}>
        {children}
        <AnimatePresence>
          {modalOpen && selectedImage && (
            <Modal
              screenShorts={screenshots}
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              selectedImage={selectedImage}
            />
          )}
        </AnimatePresence>
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

const every10Mins = createLightbox<TTimelineDetail>(ScreenShortsModal);
/** Wraps the "Every 10 min" view, above its LiveDataBoundary. */
export const Every10MinsLightbox = every10Mins.Provider;
export const useEvery10MinsLightbox = every10Mins.useLightbox;

const allScreenshots = createLightbox<IAllScreenshot>(AllScreenShortsModal);
/** Wraps the "All Screenshots" view, above its LiveDataBoundary. */
export const AllScreenshotsLightbox = allScreenshots.Provider;
export const useAllScreenshotsLightbox = allScreenshots.useLightbox;
