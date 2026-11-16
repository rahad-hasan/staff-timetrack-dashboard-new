"use client";

import { AnimatePresence } from "framer-motion";
import type { IAllScreenshot, TTimelineDetail } from "@/types/type";
import AllScreenShortsModal from "./AllScreenShortsModal";
import ScreenShortsModal from "./ScreenShortsModal";

/*
 * The two screenshot viewers with their enter/exit animation — everything of
 * the lightbox that needs framer-motion and the carousel. ScreenshotLightbox
 * loads this file as one chunk once the grid is on screen (and at the latest
 * on the first click), so those libraries are not part of what the
 * screenshots page needs to hydrate.
 *
 * Each wrapper stays mounted after the first open, and `AnimatePresence`
 * lives inside it: closing still plays the exit animation, exactly as when
 * the presence sat in the provider.
 */

export interface LightboxModalProps<T> {
  screenShorts: T[];
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  selectedImage: T;
}

export function Every10MinsLightboxModal({
  screenShorts,
  modalOpen,
  setModalOpen,
  selectedImage,
}: LightboxModalProps<TTimelineDetail>) {
  return (
    <AnimatePresence>
      {modalOpen && (
        <ScreenShortsModal
          screenShorts={screenShorts}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          selectedImage={selectedImage}
        />
      )}
    </AnimatePresence>
  );
}

export function AllScreenshotsLightboxModal({
  screenShorts,
  modalOpen,
  setModalOpen,
  selectedImage,
}: LightboxModalProps<IAllScreenshot>) {
  return (
    <AnimatePresence>
      {modalOpen && (
        <AllScreenShortsModal
          screenShorts={screenShorts}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          selectedImage={selectedImage}
        />
      )}
    </AnimatePresence>
  );
}
