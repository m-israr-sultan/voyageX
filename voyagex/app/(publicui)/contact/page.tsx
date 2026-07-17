import type { Metadata } from "next";
import ContactPage from "./contact-client";

export const metadata: Metadata = {
  title: "Contact VoyageX | Get in Touch",
  description:
    "Have a question about booking a guide, agency, or travel package in Pakistan? Contact the VoyageX team for support.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact VoyageX | Get in Touch",
    description:
      "Have a question about booking a guide, agency, or travel package in Pakistan? Contact the VoyageX team for support.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact VoyageX | Get in Touch",
    description:
      "Have a question about booking a guide, agency, or travel package in Pakistan? Contact the VoyageX team for support.",
  },
};

export default function Page() {
  return <ContactPage />;
}
