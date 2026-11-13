/**
 * Donut geometry for `OverallActivityChart`, ported from the recharts `<Pie>`
 * + `<Sector>` it replaces so the ring keeps its exact shape: segments start
 * at 3 o'clock and run counter-clockwise, a fixed padding angle sits after
 * every non-zero segment (a full ring pads N times, not N - 1), and each
 * segment is an annular sector with all four corners rounded.
 *
 * Coordinates are centred on (0, 0) — the chart's viewBox is centred to match.
 */

const RADIAN = Math.PI / 180;

interface IPoint {
  x: number;
  y: number;
}

/** Angles grow counter-clockwise on screen, as in recharts. */
const polar = (radius: number, angle: number): IPoint => ({
  x: Math.cos(-RADIAN * angle) * radius,
  y: Math.sin(-RADIAN * angle) * radius,
});

/** Three decimals is far below a device pixel; `-0` would print as "0" anyway. */
const num = (value: number) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const point = ({ x, y }: IPoint) => `${num(x)},${num(y)}`;

export interface IDonutSectorAngles {
  startAngle: number;
  endAngle: number;
}

/**
 * Splits a full ring between `values` in proportion, after reserving
 * `paddingAngle` behind each non-zero value. Zero values get an empty sector
 * (start === end) and no padding; an all-zero ring yields no sectors at all.
 */
export const layoutDonutSectors = (
  values: readonly number[],
  paddingAngle: number,
): IDonutSectorAngles[] => {
  const sum = values.reduce((total, value) => total + value, 0);
  if (!(sum > 0)) return [];

  const padding = values.length <= 1 ? 0 : paddingAngle;
  const nonZeroCount = values.filter((value) => value !== 0).length;
  const sweepable = 360 - nonZeroCount * padding;

  let previousEnd = 0;
  return values.map((value, index) => {
    const startAngle =
      index === 0 ? 0 : previousEnd + (value !== 0 ? padding : 0);
    const endAngle = startAngle + (value / sum) * sweepable;
    previousEnd = endAngle;
    return { startAngle, endAngle };
  });
};

/** Where a corner circle of `cornerRadius` touches the arc and the radial edge. */
const tangentCircle = (
  radius: number,
  angle: number,
  sign: number,
  isInner: boolean,
  cornerRadius: number,
) => {
  const centerRadius = radius + (isInner ? cornerRadius : -cornerRadius);
  const theta = Math.asin(cornerRadius / centerRadius) / RADIAN;
  return {
    circleTangency: polar(radius, angle + sign * theta),
    lineTangency: polar(centerRadius * Math.cos(theta * RADIAN), angle),
    theta,
  };
};

/** A square-cornered annular sector — used when the corners will not fit. */
const plainSectorPath = (
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const sign = Math.sign(endAngle - startAngle);
  const delta = sign * Math.min(Math.abs(endAngle - startAngle), 359.999);
  const end = startAngle + delta;
  const largeArc = +(Math.abs(delta) > 180);
  return (
    `M ${point(polar(outerRadius, startAngle))} ` +
    `A ${outerRadius},${outerRadius},0,${largeArc},${+(startAngle > end)},${point(polar(outerRadius, end))} ` +
    `L ${point(polar(innerRadius, end))} ` +
    `A ${innerRadius},${innerRadius},0,${largeArc},${+(startAngle <= end)},${point(polar(innerRadius, startAngle))} Z`
  );
};

/**
 * SVG path for one donut segment with rounded corners (recharts' Sector with
 * `cornerRadius`, corners inside the segment). Returns null for an empty
 * segment, which recharts did not draw either.
 */
export const donutSectorPath = ({
  innerRadius,
  outerRadius,
  cornerRadius,
  startAngle,
  endAngle,
}: IDonutSectorAngles & {
  innerRadius: number;
  outerRadius: number;
  cornerRadius: number;
}): string | null => {
  if (outerRadius < innerRadius || startAngle === endAngle) return null;

  const radius = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
  const span = Math.abs(startAngle - endAngle);
  if (!(radius > 0) || span >= 360) {
    return plainSectorPath(innerRadius, outerRadius, startAngle, endAngle);
  }

  const sign = Math.sign(endAngle - startAngle);
  const sweep = +(sign < 0);

  const outerStart = tangentCircle(outerRadius, startAngle, sign, false, radius);
  const outerEnd = tangentCircle(outerRadius, endAngle, -sign, false, radius);
  const outerArc = span - outerStart.theta - outerEnd.theta;

  // Too thin for two rounded corners: recharts drops the rounding entirely.
  if (outerArc < 0) {
    return plainSectorPath(innerRadius, outerRadius, startAngle, endAngle);
  }

  const innerStart = tangentCircle(innerRadius, startAngle, sign, true, radius);
  const innerEnd = tangentCircle(innerRadius, endAngle, -sign, true, radius);
  const innerArc = span - innerStart.theta - innerEnd.theta;

  return (
    `M ${point(outerStart.lineTangency)} ` +
    `A${radius},${radius},0,0,${sweep},${point(outerStart.circleTangency)} ` +
    `A${outerRadius},${outerRadius},0,${+(outerArc > 180)},${sweep},${point(outerEnd.circleTangency)} ` +
    `A${radius},${radius},0,0,${sweep},${point(outerEnd.lineTangency)} ` +
    `L${point(innerEnd.lineTangency)} ` +
    `A${radius},${radius},0,0,${sweep},${point(innerEnd.circleTangency)} ` +
    `A${innerRadius},${innerRadius},0,${+(innerArc > 180)},${+(sign > 0)},${point(innerStart.circleTangency)} ` +
    `A${radius},${radius},0,0,${sweep},${point(innerStart.lineTangency)}Z`
  );
};
