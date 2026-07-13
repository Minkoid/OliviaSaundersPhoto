import 'server-only';
import { prisma } from '@/lib/prisma';
import { resolvePublicImage } from '@/lib/images/urls';
import type { ImageView, PortfolioDetailView, PortfolioSummaryView, LayoutHint } from './view-models';
import {
  demoFeatured,
  demoPortfolioDetail,
  demoPortfolioSummaries,
} from './demo-content';
import type { ImageAsset, PortfolioImage } from '@prisma/client';

function toImageView(
  pi: PortfolioImage & { asset: ImageAsset },
): ImageView {
  const resolved = resolvePublicImage(pi.asset);
  return {
    id: pi.id,
    src: resolved.display,
    srcSet: resolved.srcSet,
    width: resolved.width,
    height: resolved.height,
    alt: pi.asset.altText ?? pi.caption ?? '',
    blurDataUrl: resolved.blurDataUrl,
    caption: pi.caption,
    layoutHint: (pi.layoutHint as LayoutHint) ?? 'standard',
  };
}

/** Published portfolios for the index. Falls back to demo content when empty. */
export async function getPublishedPortfolios(): Promise<PortfolioSummaryView[]> {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        coverImage: { include: { asset: true } },
        images: {
          where: { visibility: 'PUBLIC' },
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        _count: { select: { images: true } },
      },
    });

    if (portfolios.length === 0) return demoPortfolioSummaries();

    return portfolios.map((p) => {
      const coverSource = p.coverImage ?? p.images[0];
      const cover: ImageView = coverSource
        ? toImageView(coverSource)
        : demoPortfolioSummaries()[0]!.cover;
      return {
        slug: p.slug,
        title: p.title,
        category: p.category,
        intro: p.intro ?? '',
        cover,
        imageCount: p._count.images,
      };
    });
  } catch {
    return demoPortfolioSummaries();
  }
}

export async function getPortfolioBySlug(slug: string): Promise<PortfolioDetailView | null> {
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        images: {
          where: { visibility: 'PUBLIC' },
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!portfolio) return demoPortfolioDetail(slug);
    if (portfolio.images.length === 0) return demoPortfolioDetail(slug) ?? {
      slug: portfolio.slug,
      title: portfolio.title,
      category: portfolio.category,
      intro: portfolio.intro ?? '',
      description: portfolio.description ?? '',
      images: [],
    };

    return {
      slug: portfolio.slug,
      title: portfolio.title,
      category: portfolio.category,
      intro: portfolio.intro ?? '',
      description: portfolio.description ?? '',
      images: portfolio.images.map(toImageView),
    };
  } catch {
    return demoPortfolioDetail(slug);
  }
}

export async function getFeaturedImages(limit = 3): Promise<ImageView[]> {
  try {
    const featured = await prisma.portfolioImage.findMany({
      where: { isFeatured: true, visibility: 'PUBLIC', portfolio: { isPublished: true, deletedAt: null } },
      include: { asset: true },
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });
    if (featured.length === 0) return demoFeatured().slice(0, limit);
    return featured.map(toImageView);
  } catch {
    return demoFeatured().slice(0, limit);
  }
}

/** Slugs of published portfolios for static params / sitemap. */
export async function getPortfolioSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.portfolio.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { slug: true },
    });
    if (rows.length === 0) return demoPortfolioSummaries().map((p) => p.slug);
    return rows.map((r) => r.slug);
  } catch {
    return demoPortfolioSummaries().map((p) => p.slug);
  }
}
