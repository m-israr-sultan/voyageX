import type { Metadata } from "next";
import GuidePage from "./guide-listing-client";

export const metadata: Metadata = {
  title: "Find Local Guides in Pakistan | VoyageX",
  description:
    "Browse verified local guides across northern Pakistan — Hunza, Skardu, Swat, Chitral, and more. Book a safe, personalized trip with VoyageX.",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "Find Local Guides in Pakistan | VoyageX",
    description: "Browse verified local guides across northern Pakistan and book a safe, personalized trip.",
    url: "/guide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Local Guides in Pakistan | VoyageX",
    description: "Browse verified local guides across northern Pakistan and book a safe, personalized trip.",
  },
};

export default function Page() {
  return <GuidePage />;
}
