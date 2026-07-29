"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ISuspensionScreenshot } from "@/types/trackingSuspension";

interface ThumbProps {
  shot: ISuspensionScreenshot;
}

function Thumb({ shot }: ThumbProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          ref={ref}
          type="button"
          className={cn(
            "group relative aspect-video w-44 shrink-0 overflow-hidden rounded-md border border-borderColor bg-bgSecondary",
            "transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "dark:border-darkBorder dark:bg-darkSecondaryBg",
          )}
          aria-label={`Open screenshot from ${shot.time_format}`}
        >
          {visible && (
            <Image
              src={shot.image}
              alt={shot.display_name ?? `Screenshot at ${shot.time_format}`}
              fill
              sizes="176px"
              loading="lazy"
              decoding="async"
              className="object-cover transition group-hover:scale-[1.02]"
            />
          )}
          {shot.anomaly && (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Anomaly
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[11px] font-medium text-white">
            {shot.time_format}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] overflow-hidden p-0 md:max-w-[97vw] lg:max-w-[1280px]">
        <DialogHeader className="flex items-center justify-between border-b p-3">
          <DialogTitle className="text-base font-medium">
            {shot.display_name ?? "Screenshot"} · {shot.time_format}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center bg-gray-50 dark:bg-darkSecondaryBg">
          <Image
            src={shot.image}
            alt={shot.display_name ?? `Screenshot at ${shot.time_format}`}
            width={1600}
            height={900}
            className="h-auto w-full rounded-md object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  screenshots: ISuspensionScreenshot[];
}

function ScreenshotStripImpl({ screenshots }: Props) {
  if (!screenshots?.length) {
    return (
      <p className="rounded-md border border-dashed border-borderColor px-3 py-4 text-center text-xs text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
        No screenshots captured during this suspension window.
      </p>
    );
  }
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      role="list"
      aria-label="Screenshots during suspension window"
    >
      {screenshots.map((shot) => (
        <div role="listitem" key={shot.id}>
          <Thumb shot={shot} />
        </div>
      ))}
    </div>
  );
}

export const ScreenshotStrip = memo(ScreenshotStripImpl);
