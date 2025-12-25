import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['staff-time-tracker-screenshot.lon1.digitaloceanspaces.com','avatar.iran.liara.run', 'https://picsum.photos', 'picsum.photos',],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // Use false if this might change in the future
      },
    ];
  },
};

export default nextConfig;
