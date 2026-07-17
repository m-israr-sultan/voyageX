import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a Safety Concern | VoyageX",
  description:
    "Report a guide, agency, or booking safety concern to the VoyageX team. We take traveler safety seriously across Pakistan.",
  alternates: { canonical: "/report" },
  openGraph: {
    title: "Report a Safety Concern | VoyageX",
    description:
      "Report a guide, agency, or booking safety concern to the VoyageX team.",
    url: "/report",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Report a Safety Concern | VoyageX",
    description:
      "Report a guide, agency, or booking safety concern to the VoyageX team.",
  },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
