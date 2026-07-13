import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Site content access with graceful fallbacks.
 *
 * All public content reads go through here. If the database is unavailable
 * (e.g. during a first build before migrations/seed), refined default copy is
 * returned so the site still renders. This copy is intentionally understated
 * and clearly editable via the admin area.
 */

export interface SiteSettingsView {
  studioName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  areasServed: string;
  responseTime: string;
  studioLocation: string;
  instagramUrl: string;
  pinterestUrl: string;
  facebookUrl: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
}

export const DEFAULT_SETTINGS: SiteSettingsView = {
  studioName: 'Olivia Saunders',
  tagline: 'Photography with quiet permanence',
  // NOTE: replace with real business details (see CONTENT_CHECKLIST.md).
  contactEmail: 'studio@example.com',
  contactPhone: '',
  areasServed: 'The Cotswolds, Oxfordshire and throughout the United Kingdom, by arrangement.',
  responseTime: 'Enquiries are answered personally, usually within two working days.',
  studioLocation: 'By appointment — the Cotswolds',
  instagramUrl: '',
  pinterestUrl: '',
  facebookUrl: '',
  footerText:
    'Unhurried, considered photography for weddings, family and country life.',
  seoTitle: 'Olivia Saunders — Photography',
  seoDescription:
    'A photographer working across weddings, portraiture and country life with a restrained, editorial eye.',
};

export async function getSiteSettings(): Promise<SiteSettingsView> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    if (!s) return DEFAULT_SETTINGS;
    return {
      studioName: s.studioName || DEFAULT_SETTINGS.studioName,
      tagline: s.tagline || DEFAULT_SETTINGS.tagline,
      contactEmail: s.contactEmail || DEFAULT_SETTINGS.contactEmail,
      contactPhone: s.contactPhone || '',
      areasServed: s.areasServed || DEFAULT_SETTINGS.areasServed,
      responseTime: s.responseTime || DEFAULT_SETTINGS.responseTime,
      studioLocation: s.studioLocation || DEFAULT_SETTINGS.studioLocation,
      instagramUrl: s.instagramUrl || '',
      pinterestUrl: s.pinterestUrl || '',
      facebookUrl: s.facebookUrl || '',
      footerText: s.footerText || DEFAULT_SETTINGS.footerText,
      seoTitle: s.seoTitle || DEFAULT_SETTINGS.seoTitle,
      seoDescription: s.seoDescription || DEFAULT_SETTINGS.seoDescription,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export interface PageBlock {
  title: string;
  body: string;
  data: unknown;
}

// Editable placeholder copy — warm, personal, British, understated.
export const DEFAULT_PAGES: Record<string, PageBlock> = {
  'home.hero': {
    title: 'Photographs to be lived with',
    body: 'Unhurried, considered images made with warmth and a quiet editorial eye.',
    data: null,
  },
  'home.statement': {
    title: 'A considered way of working',
    body: 'I photograph people and places as they are — gently, patiently, and without spectacle. The result is a collection of images that feel honest today and become more treasured with time.',
    data: null,
  },
  'home.about': {
    title: 'About the studio',
    body: 'Working from the countryside and travelling wherever the work leads, I bring a calm presence and a fondness for natural light, fine detail and the small, unrepeatable moments in between.',
    data: null,
  },
  'home.testimonials': {
    title: 'In their words',
    body: '',
    data: [
      {
        quote:
          'Olivia has an extraordinary gift for making you forget the camera is there. The photographs feel like us.',
        attribution: 'A private client', // replace with a real, permissioned quote
      },
      {
        quote:
          'Every frame is quiet and considered. We return to the album again and again.',
        attribution: 'A wedding couple',
      },
    ],
  },
  'about.body': {
    title: 'About Olivia',
    body: [
      'I came to photography by way of long walks and old family albums — drawn less to grand set-pieces than to the ordinary moments that turn out to matter most.',
      'My approach is unobtrusive and warm. I work slowly, watch carefully, and let the day unfold. Whether in a country garden, a panelled hall or a favourite kitchen, my aim is the same: photographs that feel true.',
      'I care deeply about craft — light, tone and the printed image — and about looking after the people in front of my lens.',
    ].join('\n\n'),
    data: null,
  },
  'about.approach': {
    title: 'The approach',
    body: 'Considered, unhurried and personal. I favour natural light, honest expression and a restrained edit that lets each photograph breathe.',
    data: null,
  },
};

export async function getPageContent(key: string): Promise<PageBlock> {
  const fallback = DEFAULT_PAGES[key] ?? { title: '', body: '', data: null };
  try {
    const page = await prisma.pageContent.findUnique({ where: { key } });
    if (!page || !page.isPublished) return fallback;
    return {
      title: page.title || fallback.title,
      body: page.body || fallback.body,
      data: page.data ?? fallback.data,
    };
  } catch {
    return fallback;
  }
}
