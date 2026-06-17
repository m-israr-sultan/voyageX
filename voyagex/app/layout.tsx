import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import OfflineDetector from "@/components/OfflineDetector";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VoyageX",
  description: "VoyageX is a specialized travel marketplace for Pakistan. Unlike general booking sites, it focuses on verification, safety and customized plan. It connects tourists with Two distinct providers: Local Guides and Registered Agencies. The core value proposition is",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        

        <OfflineDetector />
        {children}
      </body>
    </html>
  );
}
