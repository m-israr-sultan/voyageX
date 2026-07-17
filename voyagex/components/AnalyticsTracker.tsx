"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics-client";

/**
 * Mounted once in the root layout. Fires a first-party pageview ping on
 * initial load and on every client-side route change. Renders nothing.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    if (!fullPath || lastTracked.current === fullPath) return;
    lastTracked.current = fullPath;
    trackPageView(fullPath, typeof document !== "undefined" ? document.title : undefined);
  }, [pathname, searchParams]);

  return null;
}
