import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Card } from '@/components/admin/ui';
import { PortfolioForm } from '@/components/admin/portfolio-form';
import { Uploader } from '@/components/admin/uploader';
import { ImageManager, type ManagedImage } from '@/components/admin/image-manager';
import { PortfolioActionsBar } from '@/components/admin/portfolio-actions-bar';
import { prisma } from '@/lib/prisma';
import { resolvePublicImage } from '@/lib/images/urls';
import {
  reorderPortfolioImages,
  deletePortfolioImage,
  setPortfolioCover,
  togglePortfolioImageFeatured,
  updatePortfolioImageMeta,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditPortfolioPage({ params }: { params: { id: string } }) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: params.id },
    include: {
      images: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!portfolio || portfolio.deletedAt) notFound();

  const managed: ManagedImage[] = portfolio.images.map((pi) => ({
    id: pi.id,
    url: resolvePublicImage(pi.asset).thumb,
    caption: pi.caption,
    altText: pi.asset.altText,
    isFeatured: pi.isFeatured,
    isCover: portfolio.coverImageId === pi.id,
  }));

  return (
    <>
      <PageHeader
        title={portfolio.title}
        description={`/portfolio/${portfolio.slug}`}
        action={
          <div className="flex items-center gap-3">
            <Link href={`/portfolio/${portfolio.slug}`} target="_blank" className="btn-quiet">
              Preview
            </Link>
            <Link href="/admin/portfolios" className="btn-quiet">
              ← Back
            </Link>
          </div>
        }
      />

      <PortfolioActionsBar id={portfolio.id} isPublished={portfolio.isPublished} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="mb-6 font-serif text-2xl text-ink">Details</h2>
          <PortfolioForm
            portfolio={{
              id: portfolio.id,
              title: portfolio.title,
              slug: portfolio.slug,
              category: portfolio.category,
              intro: portfolio.intro ?? '',
              description: portfolio.description ?? '',
              isPublished: portfolio.isPublished,
              sortOrder: portfolio.sortOrder,
            }}
          />
        </Card>

        <div className="space-y-8">
          <Card>
            <h2 className="mb-6 font-serif text-2xl text-ink">Upload photographs</h2>
            <Uploader target="portfolio" targetId={portfolio.id} />
          </Card>

          <Card>
            <h2 className="mb-6 font-serif text-2xl text-ink">
              Photographs ({portfolio.images.length})
            </h2>
            <ImageManager
              images={managed}
              showFeatured
              showCover
              actions={{
                onReorder: reorderPortfolioImages.bind(null, portfolio.id),
                onDelete: deletePortfolioImage.bind(null, portfolio.id),
                onSetCover: setPortfolioCover.bind(null, portfolio.id),
                onToggleFeatured: togglePortfolioImageFeatured.bind(null, portfolio.id),
                onSaveMeta: updatePortfolioImageMeta.bind(null, portfolio.id),
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
