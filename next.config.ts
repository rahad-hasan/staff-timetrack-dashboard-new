import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
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
    ];
  },
};

export default nextConfig;
