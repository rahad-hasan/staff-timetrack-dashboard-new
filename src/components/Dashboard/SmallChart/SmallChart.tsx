/**
 * Seven-day sparkline in a dashboard member row (`weekly_chart`: day index →
 * 0–100, "0" = today, drawn left to right in key order).
 *
 * Plain SVG on purpose. This used to be a recharts BarChart, which put all of
 * recharts and its d3/redux dependencies (~112 KB gzipped) on the landing page
 * and gave every row its own chart store and ResizeObserver. The geometry
 * below reproduces what that chart drew, so the bars sit and scale exactly as
 * before. It renders on the server too, so the bars are in the first paint
 * instead of appearing after hydration.
 *
 * Decorative: the row already states the week's activity and hours in text,
 * so the chart is hidden from assistive technology rather than being an
 * unlabelled stop in the tab order (which the recharts surface was).
 */

const WIDTH = 105;
const HEIGHT = 40;

/** The old BarChart margin; the axes were hidden and took no space. */
const PLOT_LEFT = 20;
const PLOT_RIGHT = 30;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 5;
const PLOT_WIDTH = WIDTH - PLOT_LEFT - PLOT_RIGHT;
const PLOT_HEIGHT = HEIGHT - PLOT_TOP - PLOT_BOTTOM;

const BAR_WIDTH = 5;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Top of the value axis recharts derived for [0, max]: five "nice" ticks, so
 * the tallest bar stops a little short of the top (73 → 80, 13 → 16,
 * 100 → 100). A port of its adaptive tick step for tickCount 5 with a zero
 * minimum, where the domain always ends at four steps.
 */
const niceDomainMax = (max: number): number => {
  if (!(max > 0)) return 0;
  const roughStep = max / 4;
  const digitCount = Math.floor(Math.log10(roughStep)) + 1;
  const magnitude = 10 ** digitCount;
  const ratioScale = digitCount === 1 ? 0.1 : 0.05;
  // recharts works in decimal arithmetic; the epsilon keeps binary noise
  // (0.25 / 0.05 = 5.000…1) from rounding a whole step up.
  const steps = Math.ceil(roughStep / magnitude / ratioScale - 1e-9);
  return 4 * steps * ratioScale * magnitude;
};

const toBarValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

const SmallChart = ({ data }: { data?: Record<string, number> }) => {
  const values = Object.values(data ?? {}).map(toBarValue);
  const domainMax = niceDomainMax(Math.max(0, ...values));

  // Category bands share the plot width; a fixed-width bar is centred in its
  // band (recharts falls back to 90% of the band when 5px will not fit).
  const band = values.length > 0 ? PLOT_WIDTH / values.length : 0;
  const barWidth = BAR_WIDTH < band ? BAR_WIDTH : band * 0.9;
  const offset = Math.round((band - barWidth) / 2);

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block fill-primary"
      aria-hidden="true"
    >
      {domainMax > 0 &&
        values.map((value, index) => {
          const height = (value / domainMax) * PLOT_HEIGHT;
          if (height <= 0) return null;
          return (
            <rect
              key={index}
              x={round2(PLOT_LEFT + index * band + offset)}
              y={round2(PLOT_TOP + PLOT_HEIGHT - height)}
              width={round2(barWidth)}
              height={round2(height)}
            />
          );
        })}
    </svg>
  );
};

export default SmallChart;
