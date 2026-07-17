import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, fetchPublicJson, touristDestinationJsonLd, truncate } from "@/lib/seo";
import { getImageUrl } from "@/lib/image-utils";
import DestinationDetailPage from "./destination-detail-client";

interface DestinationRecord {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  city?: string;
  country?: string;
}

async function fetchDestination(slug: string): Promise<DestinationRecord | null> {
  return fetchPublicJson<DestinationRecord>(`/destinations/${slug}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const destination = await fetchDestination(slug);
  const name = destination?.name || "Northern Pakistan";
  const title = `Explore ${name} | VoyageX`;
  const description = truncate(
    destination?.description ||
      `Discover ${name} with VoyageX — verified local guides, curated tour packages, and everything you need to plan your trip.`,
    160,
  );
  const image = destination?.image ? getImageUrl(destination.image) : undefined;
  const url = `/destination/${id}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", ...(image && { images: [{ url: image }] }) },
    twitter: { card: "summary_large_image", title, description, ...(image && { images: [image] }) },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const destination = await fetchDestination(slug);

  return (
    <>
      {destination && (
        <JsonLd
          data={[
            touristDestinationJsonLd({
              name: destination.name,
              id,
              slug: destination.slug,
              description: destination.description,
              image: destination.image ? getImageUrl(destination.image) : undefined,
              city: destination.city,
              country: destination.country,
            }),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Destinations", url: "/destination" },
              { name: destination.name, url: `/destination/${id}/${slug}` },
            ]),
          ]}
        />
      )}
      <DestinationDetailPage />
    </>
  );
}
