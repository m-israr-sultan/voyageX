// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://voyagextravel.com';
  const currentDate = new Date();

  // ============ MAIN PUBLIC PAGES ============
  const mainPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/destination`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/packages`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/customize`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/report`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shareexperience`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // ============ AUTH PAGES ============
  const authPages = [
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register/agency`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register/guide`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register/tourist`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/reset-password`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ];

  // ============ DESTINATION PAGES ============
  const destinations = [
    'hunza',
    'chitral',
    'kashmir',
    'swat',
    'kalam',
    'gilgit',
    'skardu',
    'naran'
  ];

  const destinationPages = destinations.map((dest) => ({
    url: `${baseUrl}/destination/${dest}/${dest}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ============ PACKAGE/TOUR PAGES ============
  // Note: Since you have dynamic packages, I'll list some common ones
  // You can add more or fetch from API later
  const packages = [
    'hunza-valley-tour',
    'skardu-adventure',
    'swat-valley-tour',
    'naran-kaghan-tour',
    'k2-base-camp',
    'chitral-cultural-tour',
  ];

  const packagePages = packages.map((pkg) => ({
    url: `${baseUrl}/packages/${pkg}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ============ GUIDE PAGES ============
  // Note: You can fetch these from your API later
  // For now, I'll add a few sample guides
  // In production, you would fetch from API:
  // const guides = await fetch(`${process.env.API_URL}/guides`).then(res => res.json());

  // ============ MESSAGE PAGES ============
  // Note: Message pages are dynamic and user-specific
  // Only include the main message page, not individual chat threads

  // ============ COMBINE ALL PAGES ============
  return [
    ...mainPages,
    ...authPages,
    ...destinationPages,
    ...packagePages,
    // Add guide pages here if you want
    // Add agency pages here if you want
  ];
}