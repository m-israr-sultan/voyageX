import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Defense-in-depth against accidental indexing of private areas. `robots.ts`
 * already disallows crawling these paths, but search engines sometimes
 * index disallowed URLs anyway if they're linked externally — the
 * `X-Robots-Tag` response header is the authoritative signal to remove/omit
 * a page from the index even if it was crawled.
 */
const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/agency-panel",
  "/guide-panel",
  "/traveler-panel",
  "/message",
  "/booking/billing-detail",
  "/booking/confirmation",
  "/booking/travel-detail",
  "/verify-receipt",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isPrivate) return NextResponse.next();

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/agency-panel/:path*",
    "/guide-panel/:path*",
    "/traveler-panel/:path*",
    "/message/:path*",
    "/booking/billing-detail/:path*",
    "/booking/confirmation/:path*",
    "/booking/travel-detail/:path*",
    "/verify-receipt/:path*",
  ],
};
