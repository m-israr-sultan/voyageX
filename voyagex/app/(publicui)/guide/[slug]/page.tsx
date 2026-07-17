import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, fetchPublicJson, personJsonLd, truncate } from "@/lib/seo";
import { getImageUrl } from "@/lib/image-utils";
import GuideProfilePage from "./guide-detail-client";

interface GuideRecord {
  id: string;
  slug: string;
  bio?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
  region?: string;
  users?: { firstName?: string; lastName?: string; avatar?: string };
}

async function fetchGuide(slug: string): Promise<GuideRecord | null> {
  return fetchPublicJson<GuideRecord>(`/guides/${slug}`);
}

function guideName(guide: GuideRecord | null): string {
  if (!guide) return "Local Guide";
  const name = `${guide.users?.firstName ?? ""} ${guide.users?.lastName ?? ""}`.trim();
  return name || "Local Guide";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  const name = guideName(guide);
  const location = guide?.location || (guide?.region ? guide.region.replace(/_/g, " ") : "Pakistan");
  const title = `${name} — Local Guide in ${location}`;
  const description = truncate(
    guide?.bio || `Book ${name}, a verified local guide in ${location}, for a safe and memorable trip with VoyageX.`,
    160,
  );
  const image = guide?.users?.avatar ? getImageUrl(guide.users.avatar) : undefined;
  const url = `/guide/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile", ...(image && { images: [{ url: image }] }) },
    twitter: { card: "summary_large_image", title, description, ...(image && { images: [image] }) },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  const name = guideName(guide);

  return (
    <>
      {guide && (
        <JsonLd
          data={[
            personJsonLd({
              name,
              slug: guide.slug,
              image: guide.users?.avatar ? getImageUrl(guide.users.avatar) : undefined,
              bio: guide.bio,
              location: guide.location,
              rating: guide.rating,
              totalReviews: guide.totalReviews,
            }),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Guides", url: "/guide" },
              { name, url: `/guide/${slug}` },
            ]),
          ]}
        />
      )}
      <GuideProfilePage />
    </>
  );
}
