"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useColorStore } from "@/store/globalColorStore";
import { cn } from "@/lib/utils";

/**
 * The tour's live-preview control.
 *
 * Picking a swatch writes to `globalColorStore`, and `SetGlobalColor` (mounted
 * in the root layout) pushes that straight onto `--primary` on the document
 * element. So the preview card below is not a mock-up of the change — it is
 * the same variable the rest of the app is painted with, which means the
 * sidebar, the buttons behind the overlay and the spotlight ring all shift
 * colour on the same frame. That is the whole point of showing it here.
 *
 * The store is persisted under `theme-color`, so whatever they pick during the
 * tour is still theirs on the next visit.
 */

/** Deliberately small and opinionated — this is a taster, not a colour picker. */
const SWATCHES = [
  { value: "#12cd69", label: "Default green" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ec4899", label: "Pink" },
] as const;

export default function BrandColorPreview() {
  const color = useColorStore((state) => state.color);
  const setColor = useColorStore((state) => state.setColor);

  return (
    <div className="mt-3 rounded-[10px] border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkSecondaryBg p-3">
      <div className="flex items-center gap-2">
        {SWATCHES.map((swatch) => {
          const active = color.toLowerCase() === swatch.value.toLowerCase();

          return (
            <button
              key={swatch.value}
              type="button"
              onClick={() => setColor(swatch.value)}
              aria-label={swatch.label}
              aria-pressed={active}
              className={cn(
                "size-7 rounded-full cursor-pointer flex items-center justify-center transition-transform",
                "ring-offset-2 ring-offset-bgSecondary dark:ring-offset-darkSecondaryBg",
                active ? "ring-2 ring-headingTextColor/40 scale-110" : "hover:scale-110",
              )}
              style={{ backgroundColor: swatch.value }}
            >
              {active && <Check className="size-3.5 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* The preview card. Every coloured thing in here reads var(--primary). */}
      <div className="mt-3 rounded-[8px] border border-borderColor dark:border-darkBorder bg-bgPrimary dark:bg-darkPrimaryBg p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="size-7 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
            />
            <div>
              <div className="h-2 w-20 rounded bg-borderColor dark:bg-darkBorder" />
              <div className="mt-1.5 h-2 w-12 rounded bg-borderColor/60 dark:bg-darkBorder/60" />
            </div>
          </div>

          <div
            className="rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Track
          </div>
        </div>

        <div className="mt-3 flex items-end gap-1.5 h-10">
          {[40, 70, 45, 90, 60, 80, 35].map((height, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-[3px]"
              style={{
                backgroundColor: "var(--primary)",
                opacity: 0.35 + (height / 100) * 0.65,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
