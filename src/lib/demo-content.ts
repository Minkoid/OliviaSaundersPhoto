import type { ImageView, PortfolioDetailView, PortfolioSummaryView, LayoutHint } from './view-models';

/**
 * Demo fallback content used when the database has no published portfolios yet
 * (e.g. immediately after a fresh build, before seeding). Uses the generated,
 * original placeholder plates in /public/placeholders. Clearly not real
 * photography — see CONTENT_CHECKLIST.md.
 */

function plate(name: string, width: number, height: number): string {
  return `/placeholders/${name}.jpg`;
}

function img(
  id: string,
  name: string,
  width: number,
  height: number,
  layoutHint: LayoutHint,
  alt: string,
  caption?: string,
): ImageView {
  return {
    id,
    src: plate(name, width, height),
    width,
    height,
    alt,
    layoutHint,
    caption: caption ?? null,
  };
}

export const DEMO_CATEGORIES: { slug: string; title: string; category: string; intro: string; plate: string }[] =
  [
    {
      slug: 'weddings',
      title: 'Weddings',
      category: 'Weddings',
      intro: 'Unhurried celebrations, photographed with warmth and discretion.',
      plate: 'weddings',
    },
    {
      slug: 'portraits',
      title: 'Portraits',
      category: 'Portraits',
      intro: 'Considered portraiture that feels honest and quietly timeless.',
      plate: 'portraits',
    },
    {
      slug: 'families',
      title: 'Families',
      category: 'Families',
      intro: 'The small, unrepeatable moments that make a family its own.',
      plate: 'families',
    },
    {
      slug: 'country-life',
      title: 'Country Life',
      category: 'Country life',
      intro: 'Estates, gardens and the rhythms of the countryside.',
      plate: 'country-life',
    },
    {
      slug: 'events',
      title: 'Events',
      category: 'Events',
      intro: 'Private gatherings and occasions, observed with a light touch.',
      plate: 'events',
    },
    {
      slug: 'editorial',
      title: 'Editorial',
      category: 'Editorial',
      intro: 'Commissioned stories with a restrained, magazine sensibility.',
      plate: 'editorial',
    },
    {
      slug: 'equine',
      title: 'Equine',
      category: 'Equine',
      intro: 'Horses and their people, in field and stable light.',
      plate: 'equine',
    },
    {
      slug: 'commercial',
      title: 'Commercial',
      category: 'Commercial',
      intro: 'Brand and hospitality imagery made with craft and calm.',
      plate: 'commercial',
    },
  ];

export function demoPortfolioSummaries(): PortfolioSummaryView[] {
  return DEMO_CATEGORIES.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    intro: c.intro,
    imageCount: 6,
    cover: img(`${c.slug}-cover`, c.plate, 1600, 1200, 'standard', `${c.title} photography`),
  }));
}

// A varied editorial arrangement so no two portfolio pages read identically.
const LAYOUT_SEQUENCE: LayoutHint[] = ['full', 'standard', 'standard', 'wide', 'tall', 'standard'];

export function demoPortfolioDetail(slug: string): PortfolioDetailView | null {
  const category = DEMO_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return null;
  const plates = ['feature-2', category.plate, 'feature-1', 'gallery-1', 'feature-3', 'gallery-3'];
  const images: ImageView[] = plates.map((p, i) => {
    const hint = LAYOUT_SEQUENCE[i % LAYOUT_SEQUENCE.length]!;
    const portrait = hint === 'tall';
    return img(
      `${slug}-${i}`,
      p,
      portrait ? 1600 : 2000,
      portrait ? 2000 : 1333,
      hint,
      `${category.title} — image ${i + 1}`,
      i === 0 ? 'A quiet opening frame' : undefined,
    );
  });
  return {
    slug: category.slug,
    title: category.title,
    category: category.category,
    intro: category.intro,
    description:
      'A short editorial introduction to this collection. Replace this placeholder with a few personal, considered sentences about the work, the setting and the people photographed.',
    images,
  };
}

export function demoFeatured(): ImageView[] {
  return [
    img('feat-1', 'feature-1', 1600, 2000, 'tall', 'Featured photograph one'),
    img('feat-2', 'feature-2', 2000, 1333, 'wide', 'Featured photograph two'),
    img('feat-3', 'feature-3', 1600, 2000, 'tall', 'Featured photograph three'),
  ];
}
