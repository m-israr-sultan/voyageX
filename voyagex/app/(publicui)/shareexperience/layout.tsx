import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share Your Travel Experience | VoyageX",
  description:
    "Share your trip story from Hunza, Skardu, Swat, or anywhere in northern Pakistan. Help other travelers discover VoyageX guides and packages.",
  alternates: { canonical: "/shareexperience" },
  openGraph: {
    title: "Share Your Travel Experience | VoyageX",
    description:
      "Share your northern Pakistan trip story and help other travelers discover VoyageX.",
    url: "/shareexperience",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Share Your Travel Experience | VoyageX",
    description:
      "Share your northern Pakistan trip story and help other travelers discover VoyageX.",
  },
};

export default function ShareExperienceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
