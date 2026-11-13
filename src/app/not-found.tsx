"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Home, ArrowLeft, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * The motion is plain CSS. This root not-found boundary is passed down in
 * every page's RSC payload, so whatever it imports loads with every route —
 * an animation library here was paid for by the whole app.
 *
 * `nf-enter` plays each element in from below (offset, scale, duration and
 * delay per element through custom properties); `nf-loop` is the idle float
 * and twinkle, peaking halfway through each period. Reduced motion shows the
 * page at rest.
 */
const MOTION_CSS = `
@keyframes nf-enter {
  from {
    opacity: 0;
    transform: translateY(var(--nf-from-y, 18px)) scale(var(--nf-from-scale, 1));
  }
}
@keyframes nf-loop {
  50% {
    opacity: var(--nf-peak-opacity, 1);
    transform: translateY(var(--nf-peak-y, 0px)) scale(var(--nf-peak-scale, 1));
  }
}
.nf-enter {
  animation: nf-enter var(--nf-duration, 0.5s) ease-out var(--nf-delay, 0s) both;
}
.nf-loop {
  animation: nf-loop var(--nf-period, 3s) ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .nf-enter,
  .nf-loop {
    animation: none;
  }
}
`;

const enter = (
  delayS: number,
  fromY = 18,
  durationS = 0.5,
  fromScale = 1,
): CSSProperties =>
  ({
    "--nf-delay": `${delayS}s`,
    "--nf-from-y": `${fromY}px`,
    "--nf-duration": `${durationS}s`,
    "--nf-from-scale": fromScale,
  }) as CSSProperties;

const loop = (
  periodS: number,
  peak: { y?: number; opacity?: number; scale?: number },
): CSSProperties =>
  ({
    "--nf-period": `${periodS}s`,
    "--nf-peak-y": `${peak.y ?? 0}px`,
    "--nf-peak-opacity": peak.opacity ?? 1,
    "--nf-peak-scale": peak.scale ?? 1,
  }) as CSSProperties;

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-6 text-white">
      <style>{MOTION_CSS}</style>

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-10 top-20 h-52 w-52 rounded-full bg-blue-500/20 blur-[90px]" />
        <div className="absolute bottom-20 left-10 h-52 w-52 rounded-full bg-indigo-500/20 blur-[90px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:44px_44px]" />

      <section
        className="nf-enter mx-auto flex max-w-2xl flex-col items-center text-center"
        style={enter(0, 24, 0.55, 0.98)}
      >
        {/* Floating icon */}
        <div
          className="nf-loop mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md"
          style={loop(3, { y: -10 })}
        >
          <Search className="h-9 w-9 text-cyan-300" />
        </div>

        {/* Badge */}
        <div
          className="nf-enter mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-300 backdrop-blur-md"
          style={enter(0.15, 12, 0.45)}
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Page not found
        </div>

        {/* 404 Text */}
        <h1
          className="nf-enter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl"
          style={enter(0.25)}
        >
          404
        </h1>

        <h2
          className="nf-enter mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          style={enter(0.35)}
        >
          Oops! This page disappeared
        </h2>

        <p
          className="nf-enter mt-4 max-w-md text-base leading-7 text-slate-400"
          style={enter(0.45)}
        >
          The page you are looking for may have been moved, deleted, or never
          existed. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div
          className="nf-enter mt-8 flex flex-col gap-3 sm:flex-row"
          style={enter(0.55)}
        >
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-cyan-400 px-7 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-300 hover:shadow-cyan-500/40"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>

          {/* A real button: this used to be a `javascript:history.back()`
              link, which React 19 blocks, so it did nothing. */}
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
            className="h-12 rounded-full border-white/15 bg-white/5 px-7 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </section>

      {/* Decorative floating dots */}
      <div
        className="nf-loop absolute left-[18%] top-[25%] h-3 w-3 rounded-full bg-cyan-300 opacity-40"
        style={loop(4, { y: -16, opacity: 1 })}
      />

      <div
        className="nf-loop absolute bottom-[28%] right-[20%] h-4 w-4 rounded-full bg-blue-400 opacity-30"
        style={loop(5, { y: 18, opacity: 0.8 })}
      />

      <div
        className="nf-loop absolute right-[30%] top-[18%] h-2 w-2 rounded-full bg-indigo-300 opacity-40"
        style={loop(3.5, { scale: 1.35, opacity: 0.9 })}
      />
    </main>
  );
}
