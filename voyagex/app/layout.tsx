import type { Metadata } from "next";
import OfflineDetector from "@/components/OfflineDetector";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoyageX — Pakistan's Travel Marketplace",
  description:
    "VoyageX is a specialized travel marketplace for Pakistan. Connect with verified local guides and registered agencies for safe, customized travel experiences across northern Pakistan.",
  icons: {
    icon: "/weblogo.png",
    apple: "/weblogo.png",
  },
  openGraph: {
    title: "VoyageX — Pakistan's Travel Marketplace",
    description:
      "Connect with verified local guides and registered agencies for safe, customized travel experiences across northern Pakistan.",
    url: "https://voyagextravel.com",
    siteName: "VoyageX",
    images: [
      {
        url: "https://voyagextravel.com/weblogo.png",
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
    images: ["https://voyagextravel.com/weblogo.png"],
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
        <OfflineDetector />
        {children}
        <Analytics />
      </body>
    </html>
  );
}