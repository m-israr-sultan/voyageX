import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

async function fetchJson<T = any>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

type SitemapEntry = MetadataRoute.Sitemap[number];

async function guidePages(): Promise<SitemapEntry[]> {
  const guides = await fetchJson<Array<{ slug: string; updatedAt?: string }>>('/guides');
  if (!Array.isArray(guides)) return [];
  return guides
    .filter((g) => g.slug)
    .map((g) => ({
      url: `${SITE_URL}/guide/${g.slug}`,
      lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
}

async function agencyPages(): Promise<SitemapEntry[]> {
  // Agencies are paginated — walk pages until exhausted, capped for safety.
  const entries: SitemapEntry[] = [];
  const limit = 100;
  for (let page = 1; page <= 20; page++) {
    const result = await fetchJson<{ items: Array<{ slug: string; updatedAt?: string }>; totalPages: number }>(
      `/agencies?page=${page}&limit=${limit}`,
    );
    if (!result?.items?.length) break;
    for (const a of result.items) {
      if (!a.slug) continue;
      entries.push({
        url: `${SITE_URL}/agency/${a.slug}`,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
    if (page >= (result.totalPages ?? 1)) break;
  }
  return entries;
}

async function packagePages(): Promise<SitemapEntry[]> {
  const packages = await fetchJson<Array<{ slug: string; updatedAt?: string }>>('/packages');
  if (!Array.isArray(packages)) return [];
  return packages
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/packages/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
}

async function destinationPages(): Promise<SitemapEntry[]> {
  const destinations = await fetchJson<Array<{ id: string; slug: string; updatedAt?: string }>>('/destinations');
  if (!Array.isArray(destinations)) return [];
  return destinations
    .filter((d) => d.slug && d.id)
    .map((d) => ({
      url: `${SITE_URL}/destination/${d.id}/${d.slug}`,
      lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  const staticPages: SitemapEntry[] = [
    { url: SITE_URL, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/destination`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/packages`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/guide`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/agency`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/customize`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/report`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shareexperience`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const authPages: SitemapEntry[] = [
    { url: `${SITE_URL}/login`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/register`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/register/agency`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/register/guide`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/register/tourist`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/reset-password`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const [guides, agencies, packages, destinations] = await Promise.all([
    guidePages(),
    agencyPages(),
    packagePages(),
    destinationPages(),
  ]);

  return [...staticPages, ...authPages, ...destinations, ...packages, ...guides, ...agencies];
}
