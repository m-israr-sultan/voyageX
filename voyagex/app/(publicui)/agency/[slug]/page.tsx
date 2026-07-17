import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, fetchPublicJson, travelAgencyJsonLd, truncate } from "@/lib/seo";
import { getImageUrl } from "@/lib/image-utils";
import AgencyDetailPage from "./agency-detail-client";

interface AgencyRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  city?: string;
  country?: string;
  website?: string;
  rating?: number;
  totalReviews?: number;
}

async function fetchAgency(slug: string): Promise<AgencyRecord | null> {
  return fetchPublicJson<AgencyRecord>(`/agencies/${slug}`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agency = await fetchAgency(slug);
  const name = agency?.name || "Travel Agency";
  const location = [agency?.city, agency?.country].filter(Boolean).join(", ") || "Pakistan";
  const title = `${name} — Registered Travel Agency in ${location}`;
  const description = truncate(
    agency?.description || `${name} is a verified travel agency on VoyageX offering curated tour packages in ${location}.`,
    160,
  );
  const image = agency?.logo ? getImageUrl(agency.logo) : undefined;
  const url = `/agency/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", ...(image && { images: [{ url: image }] }) },
    twitter: { card: "summary_large_image", title, description, ...(image && { images: [image] }) },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agency = await fetchAgency(slug);

  return (
    <>
      {agency && (
        <JsonLd
          data={[
            travelAgencyJsonLd({
              name: agency.name,
              slug: agency.slug,
              logo: agency.logo ? getImageUrl(agency.logo) : undefined,
              description: agency.description,
              city: agency.city,
              country: agency.country,
              rating: agency.rating,
              totalReviews: agency.totalReviews,
              website: agency.website,
            }),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Agencies", url: "/agency" },
              { name: agency.name, url: `/agency/${slug}` },
            ]),
          ]}
        />
      )}
      <AgencyDetailPage />
    </>
  );
}
