import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node addon and must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Default is 1MB which rejects most product images and logos.
      // Raise to 8MB so reasonable image uploads pass through.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
