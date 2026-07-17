import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the VoyageX Team | Pakistan Tourism Marketplace",
  description:
    "Meet the VoyageX founder and mentors building Pakistan's travel marketplace — connecting travelers with verified local guides across northern Pakistan.",
  alternates: { canonical: "/customize" },
  openGraph: {
    title: "About the VoyageX Team | Pakistan Tourism Marketplace",
    description:
      "Meet the VoyageX founder and mentors building Pakistan's travel marketplace for northern Pakistan.",
    url: "/customize",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About the VoyageX Team | Pakistan Tourism Marketplace",
    description:
      "Meet the VoyageX founder and mentors building Pakistan's travel marketplace for northern Pakistan.",
  },
};

export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
