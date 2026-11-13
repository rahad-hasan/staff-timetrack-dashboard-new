import type { IDashboardInsight } from "./Insights";
import { donutSectorPath, layoutDonutSectors } from "./donutGeometry";

/**
 * "Overall activity" donut on the dashboard's Insights card.
 *
 * Plain SVG (no "use client"): this was the only recharts PieChart on the
 * dashboard, and recharts with its d3/redux dependencies is ~112 KB gzipped.
 * The ring is drawn on the server with the old chart's exact geometry — radii,
 * padding, rounded corners — and ships no JavaScript. The hover tooltip it had
 * is each segment's native `<title>`; the figures are also in the aria-label.
 */

const SEGMENTS = [
  { key: "productive", label: "Productive", color: "#5db0f1" },
  { key: "active", label: "Active", color: "#dce3e3" },
  { key: "idle", label: "Idle", color: "#ffcb49" },
] as const;

const INNER_RADIUS = 57;
const OUTER_RADIUS = 85;
const CORNER_RADIUS = 5;
const PADDING_ANGLE = 5;

/** The ring plus the half of its 1px outline that falls outside it. */
const SIZE = 2 * OUTER_RADIUS + 2;

const toValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

const OverallActivityChart = ({ data }: { data: IDashboardInsight }) => {
  const values = SEGMENTS.map((segment) => toValue(data?.data?.[segment.key]));
  const sectors = layoutDonutSectors(values, PADDING_ANGLE);
  const summary = SEGMENTS.map(
    (segment, index) => `${segment.label} ${values[index]}%`,
  ).join(", ");

  return (
    // Same 224px-tall box as before. Below the ring's own 172px the SVG
    // scales down instead of being clipped.
    <div className="flex h-56 w-full items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
        className="h-auto min-w-0 max-w-full"
        role="img"
        aria-label={`Overall activity: ${summary}`}
      >
        {sectors.map((angles, index) => {
          const path = donutSectorPath({
            ...angles,
            innerRadius: INNER_RADIUS,
            outerRadius: OUTER_RADIUS,
            cornerRadius: CORNER_RADIUS,
          });
          if (!path) return null;
          const segment = SEGMENTS[index];
          return (
            // The outline separates the segments from the card; it takes the
            // card's colour so it reads the same in dark mode as in light.
            <path
              key={segment.key}
              d={path}
              fill={segment.color}
              className="stroke-white dark:stroke-darkPrimaryBg"
            >
              <title>{`${segment.label}: ${values[index]}%`}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
};

export default OverallActivityChart;
