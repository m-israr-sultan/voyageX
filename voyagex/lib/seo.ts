/**
 * Single source of truth for SEO metadata helpers — site URL resolution,
 * canonical/OG URL building, and JSON-LD (schema.org) structured data
 * builders. Every server component that needs `generateMetadata` or
 * structured data should import from here rather than hardcoding
 * `https://voyagextravel.com` inline.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voyagextravel.com').replace(/\/$/, '');
export const SITE_NAME = 'VoyageX';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/weblogo.png`;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Server-side fetch to the backend API — used only for metadata/JSON-LD generation, never for interactivity. */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export async function fetchPublicJson<T = any>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      // Short-lived cache — good enough for crawlers/social previews without hammering the API.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

export function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// ── JSON-LD (schema.org) builders ────────────────────────────────────────────

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    description:
      "VoyageX is a specialized travel marketplace for Pakistan connecting travelers with verified local guides and registered agencies.",
    sameAs: [] as string[],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function personJsonLd(guide: {
  name: string;
  slug: string;
  image?: string;
  bio?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: guide.name,
    url: absoluteUrl(`/guide/${guide.slug}`),
    image: guide.image,
    description: guide.bio,
    jobTitle: 'Local Tour Guide',
    ...(guide.location && { homeLocation: { '@type': 'Place', name: guide.location } }),
    ...(guide.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: guide.rating,
        reviewCount: guide.totalReviews || 0,
      },
    }),
  };
}

export function travelAgencyJsonLd(agency: {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  city?: string;
  country?: string;
  rating?: number;
  totalReviews?: number;
  website?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: agency.name,
    url: absoluteUrl(`/agency/${agency.slug}`),
    image: agency.logo,
    description: agency.description,
    ...(agency.website && { sameAs: [agency.website] }),
    ...((agency.city || agency.country) && {
      address: { '@type': 'PostalAddress', addressLocality: agency.city, addressCountry: agency.country },
    }),
    ...(agency.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: agency.rating,
        reviewCount: agency.totalReviews || 0,
      },
    }),
  };
}

export function productJsonLd(pkg: {
  title: string;
  slug: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  rating?: number;
  totalReviews?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.title,
    url: absoluteUrl(`/packages/${pkg.slug}`),
    image: pkg.image,
    description: pkg.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: pkg.currency || 'PKR',
      price: pkg.price ?? 0,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/packages/${pkg.slug}`),
    },
    ...(pkg.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: pkg.rating,
        reviewCount: pkg.totalReviews || 0,
      },
    }),
  };
}

export function touristDestinationJsonLd(destination: {
  name: string;
  id: string;
  slug: string;
  description?: string;
  image?: string;
  city?: string;
  country?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.name,
    url: absoluteUrl(`/destination/${destination.id}/${destination.slug}`),
    image: destination.image,
    description: destination.description,
    ...((destination.city || destination.country) && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: destination.city,
        addressCountry: destination.country,
      },
    }),
  };
}
