import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, fetchPublicJson, productJsonLd, truncate } from "@/lib/seo";
import { getImageUrl } from "@/lib/image-utils";
import PackageDetailPage from "./package-detail-client";

interface PackageRecord {
  id: string;
  slug: string;
  title: string;
  description?: string;
  images?: string[];
  price?: number;
  rating?: number;
  totalReviews?: number;
  destinations?: { name?: string };
}

async function fetchPackage(slug: string): Promise<PackageRecord | null> {
  return fetchPublicJson<PackageRecord>(`/packages/${slug}`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await fetchPackage(slug);
  const title = pkg?.title ? `${pkg.title} | VoyageX` : "Tour Package | VoyageX";
  const destinationName = pkg?.destinations?.name;
  const description = truncate(
    pkg?.description ||
      `Book ${pkg?.title ?? "this tour package"}${destinationName ? ` in ${destinationName}` : ""} with VoyageX — verified guides and agencies across Pakistan.`,
    160,
  );
  const image = pkg?.images?.[0] ? getImageUrl(pkg.images[0]) : undefined;
  const url = `/packages/${slug}`;

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
  const pkg = await fetchPackage(slug);

  return (
    <>
      {pkg && (
        <JsonLd
          data={[
            productJsonLd({
              title: pkg.title,
              slug: pkg.slug,
              description: pkg.description,
              image: pkg.images?.[0] ? getImageUrl(pkg.images[0]) : undefined,
              price: pkg.price,
              rating: pkg.rating,
              totalReviews: pkg.totalReviews,
            }),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Packages", url: "/packages" },
              { name: pkg.title, url: `/packages/${slug}` },
            ]),
          ]}
        />
      )}
      <PackageDetailPage />
    </>
  );
}
