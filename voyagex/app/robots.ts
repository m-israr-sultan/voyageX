// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Admin Dashboard (private)
        '/admin/',
        '/admin/dashboard/',
        
        // Agency Panel (private)
        '/agency-panel/',
        '/agency-panel/dashboard/',
        
        // Guide Panel (private)
        '/guide-panel/',
        '/guide-panel/dashboard/',
        
        // Traveler Panel (private)
        '/traveler-panel/',
        '/traveler-panel/dashboard/',
        
        // Message (private)
        '/message/',
        
        // Booking details (private)
        '/booking/billing-detail/',
        '/booking/confirmation/',
        '/booking/travel-detail/',
        
        // Receipt verification (private)
        '/verify-receipt/',
        
        // API routes
        '/api/',
        '/_next/',
        '/*.json$',
        '/*.xml$',
      ],
    },
    sitemap: 'https://voyagextravel.com/sitemap.xml',
  };
}