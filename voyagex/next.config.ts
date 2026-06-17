import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Accept backend uploads and external images
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Prefer modern formats — WebP ~30 % smaller than JPEG, AVIF ~50 % smaller
    formats: ["image/avif", "image/webp"],
    // Tighter size ladder — northern Pakistan devices are mid-range (360–720 px wide)
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimised images for 7 days to minimise repeat downloads on 2G
    minimumCacheTTL: 604_800,
    // Limit concurrent image optimisation workers (saves server memory)
    dangerouslyAllowSVG: false,
  },
  // Compress HTTP responses (gzip/brotli) — significant on slow uplinks
  compress: true,
  reactStrictMode: true,
  // Remove X-Powered-By header (tiny payload saving per response)
  poweredByHeader: false,
  // Reduce JS payload on slow networks by tree-shaking these heavy packages
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "framer-motion",
      "lucide-react",
      "date-fns",
    ],
  },
};

export default nextConfig;
