import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allow all localtunnel subdomains for HMR
  allowedDevOrigins: [
    "natures-best-farm-123.loca.lt",
    "localhost:3000"
  ]
};

export default nextConfig;
