import type { Metadata } from "next";
import { Suspense } from "react";
import OfflineDetector from "@/components/OfflineDetector";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import JsonLd from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, organizationJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VoyageX — Pakistan's Travel Marketplace",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "VoyageX is a specialized travel marketplace for Pakistan. Connect with verified local guides and registered agencies for safe, customized travel experiences across northern Pakistan.",
  keywords: [
    "VoyageX",
    "VoyageX Travel",
    "Pakistan tourism",
    "Pakistan tourism marketplace",
    "Northern Pakistan guides",
    "Hunza",
    "Skardu",
    "local tour guides Pakistan",
  ],
  icons: {
    icon: "/weblogo.png",
    apple: "/weblogo.png",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "VoyageX — Pakistan's Travel Marketplace",
    description:
      "Connect with verified local guides and registered agencies for safe, customized travel experiences across northern Pakistan.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 800,
        height: 600,
        alt: "VoyageX Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoyageX — Pakistan's Travel Marketplace",
    description:
      "Connect with verified local guides and agencies for travel across northern Pakistan.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <JsonLd data={organizationJsonLd()} />
        <OfflineDetector />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
        <Analytics />
      </body>
    </html>
  );
}