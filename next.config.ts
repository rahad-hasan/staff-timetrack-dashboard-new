import type { NextConfig } from "next";
// Relative, not `@/`: the config is loaded before tsconfig paths apply.
import { MARKETING_SIGN_UP_URL } from "./src/lib/siteLinks";

/*
 * One identifier per build, inlined into every bundle — browser and server
 * alike — as `process.env.NEXT_PUBLIC_BUILD_STAMP`. An open tab's live refresh
 * (src/hooks/useLiveRefresh.ts) compares the copy compiled into its own JS
 * with the one GET /api/live-ping reports from the running server: if they
 * differ, a deploy has landed since the tab loaded, and a router.refresh()
 * would make Next hard-reload the page (it does on a build-id mismatch) — so
 * the tab reloads or asks first instead, never under a half-filled form.
 *
 * Set ONCE, when the build process first loads this file, and only if unset:
 * Next loads the file again in every compiler worker, and those inherit this
 * process's environment, so `||=` leaves client and server bundles on the
 * same value. (A fresh value per load would make them disagree, and every tab
 * would see a "new build" forever.) Next also records env changes made while
 * the config loads, so its own env resets keep the value. A value already in
 * the environment wins — it must then be unique per build.
 *
 * Every read is compiled in, so the new value this file sets when `next
 * start` loads it again at runtime is never consulted. Next's own build id
 * (generateBuildId) is deliberately left alone.
 */
process.env.NEXT_PUBLIC_BUILD_STAMP ||= `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2, 10)}`;

// Build/dev output folder. Defaults to .next (what `npm run start` serves under pm2);
// automated tooling sets NEXT_DIST_DIR=.next-agent so its builds and dev servers never
// overwrite the folder a running `next start` is serving.
const distDir = process.env.NEXT_DIST_DIR || ".next";

/*
 * One shared chunk for zustand, in the browser's production build.
 *
 * Every entry — the root layout, each page, each lazily loaded dialog — imports
 * a store, so all of them need zustand (about 7 kB with `persist`). Next only
 * moves a module into a shared chunk when the group it would form reaches
 * 20 kB, which this never does on its own: whether it is shared or copied into
 * every chunk that uses it depends on which other modules happen to have the
 * same set of importers. After the form dialogs became chunks of their own
 * (2026-11-16) it tipped the wrong way and 21 chunks carried a copy each, so a
 * page downloaded it two or three times. `enforce` skips the size check; one
 * request, always already in the browser's cache after the first page.
 *
 * Nothing wider on purpose: a group like this is loaded by every entry that
 * uses ANY module in it, and the root layout uses nothing else that small and
 * universal.
 */
const shareZustandChunk: NonNullable<NextConfig["webpack"]> = (
  config,
  { dev, isServer },
) => {
  if (dev || isServer) return config;

  const splitChunks = config.optimization?.splitChunks;
  if (splitChunks && typeof splitChunks === "object") {
    splitChunks.cacheGroups = {
      ...splitChunks.cacheGroups,
      zustand: {
        // pnpm: node_modules/.pnpm/zustand@x/node_modules/zustand/…
        test: /[\\/]node_modules[\\/]zustand[\\/]/,
        name: "zustand",
        // Above Next's own `lib` group (30), below `framework` (40).
        priority: 35,
        enforce: true,
      },
    };
  }
  return config;
};

const nextConfig: NextConfig = {
  // NEXT_PUBLIC_ variables are inlined anyway; listing it here states the
  // contract next to its only producer.
  env: {
    NEXT_PUBLIC_BUILD_STAMP: process.env.NEXT_PUBLIC_BUILD_STAMP,
  },
  distDir,
  // Each output folder gets its own tsconfig. Next type-checks against this file and adds
  // `<distDir>/types/**/*.ts` to its `include` when that line is missing. With a single
  // tsconfig.json, an agent build added `.next-agent/types` beside `.next/types`, so a
  // production build also checked the leftover types of an older tree. Those types still
  // named the since-deleted /dashboard layout, so `pnpm build` failed on the VPS. Both
  // folders declare the same global PageProps/LayoutProps, so they must never share a program.
  typescript: {
    tsconfigPath: distDir === ".next" ? "tsconfig.json" : "tsconfig.agent.json",
  },
  output: "standalone",
  // Not under `next dev --turbopack`: Turbopack ignores a webpack hook and
  // warns about one on every start. (The CLI sets TURBOPACK before this file
  // is loaded.)
  webpack: process.env.TURBOPACK ? undefined : shareZustandChunk,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Barrel packages Next does not already optimise (lucide-react, date-fns
    // and recharts are on its built-in list). With this, the build resolves
    // only the modules an import names instead of the whole barrel.
    // - radix-ui: the meta package's index imports all ~35 primitives
    //   (`import * as X from "@radix-ui/react-x"`). `ui/separator.tsx` takes
    //   only `Separator` from it, which is rewritten to
    //   @radix-ui/react-separator.
    optimizePackageImports: ["radix-ui"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "staff-time-tracker.sgp1.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "staff-time-tracker.sgp1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "staff-time-tracker-screenshot.lon1.digitaloceanspaces.com",
      },
      // External services
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatar.iran.liara.run" },
      { protocol: "https", hostname: "picsum.photos" },
      // Favicons for tracked sites and web-branded apps. Serving them through
      // the optimizer means the upstream 404 for a domain the provider has no
      // icon for reaches the browser as an error, so the avatar falls back to
      // initials instead of rendering the provider's grey placeholder glyph.
      { protocol: "https", hostname: "icons.duckduckgo.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
      // Accounts are created on the marketing site; the dashboard's own form
      // is gone. Bookmarks, old emails and tabs still running a previous
      // build's JS land on the live form instead of a 404 — with their query
      // (`plan`, `cycle`, …), which Next forwards on a redirect. Temporary on
      // purpose: browsers cache a 308 indefinitely, so a permanent one could
      // never be taken back if the route returns.
      {
        source: "/auth/sign-up",
        destination: MARKETING_SIGN_UP_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
