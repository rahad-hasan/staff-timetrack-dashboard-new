"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, LineChart, MonitorPlay, Receipt, Users } from "lucide-react";

import { BILLING_URL } from "@/lib/billing";
import { Button } from "@/components/ui/button";

/**
 * The designed "you're subscribed" screen: confetti-ringed check, plan
 * welcome, the four things the plan just unlocked, and the two exits.
 *
 * The illustration is hand-rolled inline SVG on purpose — a confetti library
 * (or a Lottie/PNG asset) would ship a dependency and a network fetch for one
 * decorative moment that is only ever seen once per subscription.
 *
 * Everything here is presentational; the caller owns the confirm/poll state
 * machine and only mounts this once the purchase is known good.
 */

/**
 * Illustration palette. These are deliberately bare hex values rather than
 * theme tokens: confetti is artwork, not surface, so it reads identically in
 * both themes (the shapes sit on the green disc's halo, never on the page
 * ground). Every *surface* colour below still uses the paired tokens.
 */
const CONFETTI_COLORS = {
  blue: "#0788f3",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  yellow: "#facc15",
  purple: "#a855f7",
} as const;

type ConfettiShape = "dot" | "diamond" | "squiggle";

/**
 * Pre-computed scatter — positions are on a ring around the disc in the
 * 220×220 user space (centre 110,110). Baked into a constant because the house
 * rule bans `Math.random()` during render: a randomised scatter would differ
 * between the server and client passes and blow up hydration.
 *
 * `ox`/`oy` are the *starting* offsets (45% of the way back toward the centre)
 * so the pieces read as being thrown outward from the check rather than fading
 * in where they already sit.
 */
const CONFETTI: ReadonlyArray<{
  x: number;
  y: number;
  shape: ConfettiShape;
  color: keyof typeof CONFETTI_COLORS;
  rotate: number;
  ox: number;
  oy: number;
}> = [
  { x: 27.3, y: 79.9, shape: "squiggle", color: "blue", rotate: -14, ox: 37.2, oy: 13.5 },
  { x: 60.7, y: 47, shape: "dot", color: "green", rotate: 0, ox: 22.2, oy: 28.4 },
  { x: 90.9, y: 20, shape: "diamond", color: "orange", rotate: 12, ox: 8.6, oy: 40.5 },
  { x: 131.2, y: 30.8, shape: "dot", color: "pink", rotate: 0, ox: -9.5, oy: 35.6 },
  { x: 167.9, y: 41.1, shape: "squiggle", color: "yellow", rotate: 22, ox: -26.1, oy: 31 },
  { x: 187.9, y: 78.5, shape: "diamond", color: "purple", rotate: -18, ox: -35.1, oy: 14.2 },
  { x: 199.1, y: 122.5, shape: "dot", color: "blue", rotate: 0, ox: -40.1, oy: -5.6 },
  { x: 178.8, y: 158.2, shape: "squiggle", color: "green", rotate: -24, ox: -31, oy: -21.7 },
  { x: 156, y: 189.7, shape: "diamond", color: "pink", rotate: 16, ox: -20.7, oy: -35.9 },
  { x: 112.9, y: 192, shape: "dot", color: "orange", rotate: 0, ox: -1.3, oy: -36.9 },
  { x: 76.3, y: 193.4, shape: "squiggle", color: "purple", rotate: 18, ox: 15.2, oy: -37.5 },
  { x: 44.1, y: 165.3, shape: "diamond", color: "blue", rotate: -12, ox: 29.7, oy: -24.9 },
  { x: 32.7, y: 130.7, shape: "dot", color: "yellow", rotate: 0, ox: 34.8, oy: -9.3 },
  { x: 18.1, y: 106.8, shape: "squiggle", color: "green", rotate: 8, ox: 41.4, oy: 1.4 },
];

/**
 * Soft concentric rings behind the disc; widest/faintest first. The hue is a
 * paired Tailwind class (CSS `fill` beats the SVG attribute), while the
 * translucency rides on `fillOpacity` — an opacity *modifier* on a `fill-*`
 * utility is not something every Tailwind build emits, and a silently dropped
 * class here would paint three solid green slabs over the whole illustration.
 */
const HALOS = [
  { r: 72, opacity: 0.07 },
  { r: 60, opacity: 0.11 },
  { r: 48, opacity: 0.17 },
];

const FEATURES = [
  {
    icon: Clock,
    label: "Time Tracking",
    sub: "Track work hours accurately",
    // --primary is blue in both themes, so the token needs no dark pair here.
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: LineChart,
    label: "Detailed Insights",
    sub: "Get productive Analytics",
    tint: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  },
  {
    icon: Users,
    label: "Team Management",
    sub: "Manage your team effortlessly",
    tint: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    icon: MonitorPlay,
    label: "Screenshot Monitoring",
    sub: "Ensure accountability",
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
];

function ConfettiPiece({
  shape,
  color,
}: {
  shape: ConfettiShape;
  color: string;
}) {
  if (shape === "dot") return <circle r={4} fill={color} />;
  if (shape === "diamond")
    return (
      <rect
        x={-5}
        y={-5}
        width={10}
        height={10}
        rx={1.5}
        fill={color}
        transform="rotate(45)"
      />
    );
  return (
    <path
      d="M -9 1.5 q 4.5 -6 9 0 t 9 0"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

export default function SuccessCelebration({
  planName,
}: {
  planName?: string | null;
}) {
  const reduce = useReducedMotion();
  // A blank/whitespace name from the entitlement snapshot must not render
  // "Welcome to !", so treat it the same as a missing one.
  const plan = planName?.trim() || "your new plan";

  /**
   * `initial={false}` is the whole reduced-motion story: framer snaps straight
   * to the `animate` values and runs nothing. That keeps ONE copy of the final
   * state instead of a parallel static branch that could drift out of step
   * with the animated one.
   */
  const enter = (from: Record<string, number>, delay: number) => ({
    initial: reduce ? (false as const) : from,
    animate: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
    transition: reduce
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 260, damping: 18, delay },
  });

  return (
    <div className="w-full max-w-xl">
      <div className="rounded-2xl border border-borderColor bg-bgPrimary p-6 text-center shadow-sm sm:p-8 dark:border-darkBorder dark:bg-darkPrimaryBg">
        <svg
          viewBox="0 0 220 220"
          role="img"
          aria-label="Payment successful"
          className="mx-auto h-40 w-40 sm:h-48 sm:w-48"
        >
          <defs>
            <linearGradient id="sc-disc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>

          {HALOS.map((halo, i) => (
            <motion.circle
              key={halo.r}
              cx={110}
              cy={110}
              r={halo.r}
              fillOpacity={halo.opacity}
              className="fill-green-500 dark:fill-green-400"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              {...enter({ opacity: 0, scale: 0.6 }, 0.05 * (HALOS.length - i))}
            />
          ))}

          <motion.circle
            cx={110}
            cy={110}
            r={36}
            fill="url(#sc-disc)"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            {...enter({ opacity: 0, scale: 0 }, 0)}
          />

          <motion.path
            d="M 93 111 L 105 123 L 128 98"
            fill="none"
            stroke="#ffffff"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduce ? { duration: 0 } : { duration: 0.35, delay: 0.22 }
            }
          />

          {CONFETTI.map((piece, i) => (
            // Outer <g> parks the piece at its final spot with an SVG
            // transform; the inner motion.g owns the CSS transform, so the two
            // never fight over the same attribute. `fill-box` makes scale and
            // rotate pivot on the shape itself rather than the SVG origin.
            <g
              key={`${piece.x}-${piece.y}`}
              transform={`translate(${piece.x} ${piece.y})`}
            >
              <motion.g
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={
                  reduce
                    ? false
                    : { opacity: 0, scale: 0, x: piece.ox, y: piece.oy }
                }
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        type: "spring" as const,
                        stiffness: 220,
                        damping: 16,
                        delay: 0.28 + i * 0.035,
                      }
                }
              >
                <g transform={`rotate(${piece.rotate})`}>
                  <ConfettiPiece
                    shape={piece.shape}
                    color={CONFETTI_COLORS[piece.color]}
                  />
                </g>
              </motion.g>
            </g>
          ))}
        </svg>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/25">
          🎉 Payment Successful!
        </span>

        <h1 className="mt-4 text-2xl font-semibold text-headingTextColor sm:text-3xl dark:text-darkTextPrimary">
          Welcome to {plan}!
        </h1>
        <p className="mt-1.5 text-sm font-medium text-primary">
          Your subscription is now active
        </p>

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                className={`flex size-11 items-center justify-center rounded-full ${feature.tint}`}
              >
                <feature.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                {feature.label}
              </span>
              <span className="text-xs leading-snug text-subTextColor dark:text-darkTextSecondary">
                {feature.sub}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline2" className="w-full">
            <Link href={BILLING_URL}>
              <Receipt className="size-4" />
              View Billing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
