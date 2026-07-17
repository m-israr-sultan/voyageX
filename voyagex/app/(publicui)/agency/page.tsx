import type { Metadata } from "next";
import AgencyPage from "./agency-listing-client";

export const metadata: Metadata = {
  title: "Travel Agencies in Pakistan | VoyageX",
  description:
    "Explore registered, admin-approved travel agencies offering curated tour packages across northern Pakistan. Book with confidence on VoyageX.",
  alternates: { canonical: "/agency" },
  openGraph: {
    title: "Travel Agencies in Pakistan | VoyageX",
    description: "Explore registered, admin-approved travel agencies offering curated tour packages.",
    url: "/agency",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Agencies in Pakistan | VoyageX",
    description: "Explore registered, admin-approved travel agencies offering curated tour packages.",
  },
};

export default function Page() {
  return <AgencyPage />;
}
