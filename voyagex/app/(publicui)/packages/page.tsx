import type { Metadata } from "next";
import PackagesPage from "./packages-listing-client";

export const metadata: Metadata = {
  title: "Tour Packages in Pakistan | VoyageX",
  description:
    "Discover curated tour packages across Hunza, Skardu, Swat, Naran, and beyond — from verified guides and agencies. Compare, book, and travel safely with VoyageX.",
  alternates: { canonical: "/packages" },
  openGraph: {
    title: "Tour Packages in Pakistan | VoyageX",
    description: "Discover curated tour packages across northern Pakistan from verified guides and agencies.",
    url: "/packages",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tour Packages in Pakistan | VoyageX",
    description: "Discover curated tour packages across northern Pakistan from verified guides and agencies.",
  },
};

export default function Page() {
  return <PackagesPage />;
}
