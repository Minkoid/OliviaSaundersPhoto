/**
 * View models shared by public pages. They deliberately decouple the rendering
 * components from Prisma records and from where the image bytes live (public
 * bucket, CDN, or static placeholder), so the same components render seeded data
 * and the demo fallback identically.
 */

export type LayoutHint = 'full' | 'wide' | 'tall' | 'standard';

export interface ImageView {
  id: string;
  src: string;
  srcSet?: string;
  width: number | null;
  height: number | null;
  alt: string;
  blurDataUrl?: string | null;
  caption?: string | null;
  layoutHint: LayoutHint;
}

export interface PortfolioSummaryView {
  slug: string;
  title: string;
  category: string;
  intro: string;
  cover: ImageView;
  imageCount: number;
}

export interface PortfolioDetailView {
  slug: string;
  title: string;
  category: string;
  intro: string;
  description: string;
  images: ImageView[];
}
