// app/robots.ts
import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Admin Dashboard (private)
        '/admin',
        '/admin/',

        // Agency Panel (private)
        '/agency-panel',
        '/agency-panel/',

        // Guide Panel (private)
        '/guide-panel',
        '/guide-panel/',

        // Traveler Panel (private)
        '/traveler-panel',
        '/traveler-panel/',

        // Message (private)
        '/message',
        '/message/',

        // Booking details (private)
        '/booking/billing-detail/',
        '/booking/confirmation/',
        '/booking/travel-detail/',

        // Receipt verification (private)
        '/verify-receipt/',

        // API / framework internals
        '/api/',
        '/_next/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}