import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Local dev — Next.js Image component pointing at local backend
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/v1/images/**",
      },
      {
        // Supabase Storage — direct bucket URLs
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        // All other https sources (Render backend, external images, avatars etc.)
        protocol: "https",
        hostname: "**",
      },
    ],
    // Prefer modern formats — WebP ~30% smaller than JPEG, AVIF ~50% smaller
    formats: ["image/avif", "image/webp"],
    // Tighter size ladder — northern Pakistan devices are mid-range (360–720px wide)
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimised images for 7 days to minimise repeat downloads on 2G
    minimumCacheTTL: 604_800,
    dangerouslyAllowSVG: false,
  },
  // Compress HTTP responses (gzip/brotli) — significant on slow uplinks
  compress: true,
  reactStrictMode: true,
  // Remove X-Powered-By header
  poweredByHeader: false,
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