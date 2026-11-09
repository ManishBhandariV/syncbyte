import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Blob-hosted uploads must be allow-listed before next/image will optimize
    // them. Pinned to this store's exact host rather than a wildcard.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "u4qgnlvjczlcf9t7.public.blob.vercel-storage.com",
        pathname: "/**",
        search: "",
      },
    ],
    // Default is 4 hours. Blob uploads use addRandomSuffix, so every URL is
    // immutable — a long TTL means each original is fetched from Blob roughly
    // once per variant instead of every 4 hours.
    minimumCacheTTL: 2678400, // 31 days
  },
  // better-sqlite3 is a native Node addon and must not be bundled.
  // @react-pdf/renderer pulls in fontkit/yoga and bundles poorly — keep external.
  serverExternalPackages: ["better-sqlite3", "@react-pdf/renderer"],
  experimental: {
    serverActions: {
      // Default is 1MB which rejects most product images and logos.
      // Raise to 8MB so reasonable image uploads pass through.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
