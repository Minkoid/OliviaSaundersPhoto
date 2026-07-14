import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';
import { getPortfolioSlugs } from '@/lib/portfolio';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const now = new Date();

  const staticRoutes = [
    '',
    '/portfolio',
    '/about',
    '/contact',
    '/privacy',
    '/cookies',
    '/terms',
    '/gallery-terms',
    '/image-usage',
  ].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const slugs = await getPortfolioSlugs();
  const portfolioRoutes = slugs.map((slug) => ({
    url: `${appUrl}/portfolio/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...portfolioRoutes];
}
