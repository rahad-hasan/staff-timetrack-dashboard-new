import { Cog, PauseCircle, ShieldAlert } from "lucide-react";
import type { TSuspensionSource } from "@/types/trackingSuspension";

const TITLES: Record<TSuspensionSource, string> = {
  anomaly_engine: "Detected by anomaly engine",
  manual: "Manual suspension",
  system: "System suspension",
};

export function SourceIcon({
  source,
  className = "size-3.5",
}: {
  source: TSuspensionSource;
  className?: string;
}) {
  const title = TITLES[source];
  if (source === "manual") return <PauseCircle aria-label={title} className={className} />;
  if (source === "system") return <Cog aria-label={title} className={className} />;
  return <ShieldAlert aria-label={title} className={className} />;
}
