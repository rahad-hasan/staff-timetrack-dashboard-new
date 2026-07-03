import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      // ✅ নতুন SGP1 private bucket — CDN (এটা সবচেয়ে important)
      {
        protocol: "https",
        hostname: "staff-time-tracker.sgp1.cdn.digitaloceanspaces.com",
      },
      // ✅ নতুন SGP1 private bucket — origin (fallback)
      {
        protocol: "https",
        hostname: "staff-time-tracker.sgp1.digitaloceanspaces.com",
      },
      // ✅ পুরোনো LON1 public bucket — backward compat
      {
        protocol: "https",
        hostname: "staff-time-tracker-screenshot.lon1.digitaloceanspaces.com",
      },
      // External services
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatar.iran.liara.run" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
