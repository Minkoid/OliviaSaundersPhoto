import { getAppUrl } from '@/lib/env';
import type { SiteSettingsView } from '@/lib/content';

/**
 * schema.org structured data for the photography business. Rendered as a
 * JSON-LD script so search engines understand the studio, its offerings and
 * contact details.
 */
export function StructuredData({ settings }: { settings: SiteSettingsView }) {
  const appUrl = getAppUrl();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${appUrl}/#business`,
    name: settings.studioName,
    description: settings.seoDescription,
    url: appUrl,
    image: `${appUrl}/placeholders/hero.jpg`,
    email: settings.contactEmail || undefined,
    telephone: settings.contactPhone || undefined,
    areaServed: settings.areasServed || undefined,
    sameAs: [settings.instagramUrl, settings.pinterestUrl, settings.facebookUrl].filter(Boolean),
    knowsAbout: [
      'Wedding photography',
      'Portrait photography',
      'Family photography',
      'Editorial photography',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
