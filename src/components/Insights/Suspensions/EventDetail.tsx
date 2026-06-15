"use client";

import { memo, useEffect, useState } from "react";
import { Camera, ListTree } from "lucide-react";
import { getSuspensionEventDetail } from "@/actions/suspensions/action";
import type { ISuspensionEventDetail } from "@/types/trackingSuspension";
import { EventTimeline } from "./EventTimeline";
import { ScreenshotStrip } from "./ScreenshotStrip";
import { RiskGauge } from "./RiskGauge";

interface Props {
  eventId: number;
  timezone: string;
}

function EventDetailImpl({ eventId, timezone }: Props) {
  const [detail, setDetail] = useState<ISuspensionEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSuspensionEventDetail(eventId, { timezone })
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data) {
          setDetail(res.data);
        } else {
          setError(res?.message || "Failed to load event detail.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error)?.message || "Failed to load event detail.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, timezone]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <div className="h-1 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkSecondaryBg">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-20 animate-pulse rounded-md bg-bgSecondary dark:bg-darkSecondaryBg" />
          <div className="h-20 animate-pulse rounded-md bg-bgSecondary dark:bg-darkSecondaryBg sm:col-span-2" />
        </div>
        <div className="h-24 animate-pulse rounded-md bg-bgSecondary dark:bg-darkSecondaryBg" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {error ?? "Unable to load event detail."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <RiskGauge score={detail.risk_score} />
        <div className="sm:col-span-2 rounded-[10px] border border-borderColor bg-bgSecondary p-3 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <span className="text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
            Reason
          </span>
          <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            {detail.reason_text || detail.reason_code}
          </p>
          {detail.description && (
            <p className="mt-2 text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
              {detail.description}
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby={`audit-${detail.id}`}>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          <ListTree className="size-3.5" aria-hidden />
          <h3 id={`audit-${detail.id}`}>Audit trail</h3>
        </div>
        <EventTimeline events={detail.events} />
      </section>

      <section aria-labelledby={`shots-${detail.id}`}>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          <Camera className="size-3.5" aria-hidden />
          <h3 id={`shots-${detail.id}`}>Screenshots</h3>
        </div>
        <ScreenshotStrip screenshots={detail.screenshots} />
      </section>
    </div>
  );
}

export const EventDetail = memo(EventDetailImpl);
