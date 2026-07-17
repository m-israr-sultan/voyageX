import type { Metadata } from "next";
import DestinationPage from "./destination-listing-client";

export const metadata: Metadata = {
  title: "Explore Destinations in Pakistan | VoyageX",
  description:
    "Discover the best travel destinations in northern Pakistan — Hunza, Skardu, Chitral, Swat, Kalam, Naran, and more — with VoyageX.",
  alternates: { canonical: "/destination" },
  openGraph: {
    title: "Explore Destinations in Pakistan | VoyageX",
    description: "Discover the best travel destinations in northern Pakistan with VoyageX.",
    url: "/destination",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Destinations in Pakistan | VoyageX",
    description: "Discover the best travel destinations in northern Pakistan with VoyageX.",
  },
};

export default function Page() {
  return <DestinationPage />;
}
