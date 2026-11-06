import { cn } from "@/lib/utils";
import { LIVE_CHAT_COPY } from "@/lib/liveChat/config";

interface PresenceStatusProps {
  isAvailable: boolean;
  className?: string;
}

/**
 * The status line under the teaser's title. The dot pulses green only while
 * Crisp says someone is there to answer, and turns grey otherwise.
 */
export default function PresenceStatus({
  isAvailable,
  className,
}: PresenceStatusProps) {
  return (
    <p
      className={cn(
        "flex items-start gap-1 text-xs leading-[1.3] font-medium tracking-[0.2px] text-subTextColor dark:text-darkTextSecondary",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative size-4 shrink-0 rounded-full",
          isAvailable ? "bg-live-chat-online/22" : "bg-gray-400/25",
        )}
      >
        {isAvailable && (
          <span className="absolute inset-0 animate-live-chat-pulse rounded-full bg-live-chat-online motion-reduce:hidden" />
        )}
        <span
          className={cn(
            "absolute inset-1 rounded-full",
            isAvailable ? "bg-live-chat-online" : "bg-gray-400",
          )}
        />
      </span>
      <span>{isAvailable ? LIVE_CHAT_COPY.online : LIVE_CHAT_COPY.away}</span>
    </p>
  );
}
