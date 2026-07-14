import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private and authenticated surfaces are never indexed.
        disallow: ['/admin', '/account', '/gallery', '/api', '/login', '/reset-password', '/set-password'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
