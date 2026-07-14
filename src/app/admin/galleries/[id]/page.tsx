import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Card } from '@/components/admin/ui';
import { GalleryForm } from '@/components/admin/gallery-form';
import { GalleryActionsBar } from '@/components/admin/gallery-actions-bar';
import { GalleryClientAssignment } from '@/components/admin/gallery-client-assignment';
import { Uploader } from '@/components/admin/uploader';
import { ImageManager, type ManagedImage } from '@/components/admin/image-manager';
import { prisma } from '@/lib/prisma';
import { resolvePrivateImage } from '@/lib/images/urls';
import {
  reorderGalleryImages,
  deleteGalleryImage,
  setGalleryCover,
  updateGalleryImageMeta,
} from '../actions';

export const dynamic = 'force-dynamic';

function toDateInput(d: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : '';
}

export default async function EditGalleryPage({ params }: { params: { id: string } }) {
  const gallery = await prisma.gallery.findUnique({
    where: { id: params.id },
    include: {
      images: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
      access: {
        where: { revokedAt: null },
        include: { user: { include: { clientProfile: true } } },
      },
    },
  });
  if (!gallery || gallery.deletedAt) notFound();

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT', isActive: true, deletedAt: null },
    include: { clientProfile: true },
    orderBy: { createdAt: 'desc' },
  });

  const managed: ManagedImage[] = await Promise.all(
    gallery.images.map(async (gi) => {
      const resolved = await resolvePrivateImage(gi.asset, { watermark: gallery.watermarkEnabled });
      return {
        id: gi.id,
        url: resolved.thumb,
        caption: gi.caption,
        altText: gi.asset.altText,
        isCover: gallery.coverImageId === gi.id,
      };
    }),
  );

  return (
    <>
      <PageHeader
        title={gallery.title}
        description={`Client: ${gallery.clientName}`}
        action={
          <Link href="/admin/galleries" className="btn-quiet">
            ← Back
          </Link>
        }
      />

      <GalleryActionsBar
        id={gallery.id}
        isPublished={gallery.isPublished}
        isDisabled={gallery.isDisabled}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          <Card>
            <h2 className="mb-6 font-serif text-2xl text-ink">Details</h2>
            <GalleryForm
              gallery={{
                id: gallery.id,
                title: gallery.title,
                slug: gallery.slug,
                clientName: gallery.clientName,
                shootDate: toDateInput(gallery.shootDate),
                message: gallery.message ?? '',
                expiresAt: toDateInput(gallery.expiresAt),
                isPublished: gallery.isPublished,
                isDisabled: gallery.isDisabled,
                hasPassword: Boolean(gallery.passwordHash),
                allowImageDownload: gallery.allowImageDownload,
                allowGalleryDownload: gallery.allowGalleryDownload,
                allowFullResolution: gallery.allowFullResolution,
                showImageNumbers: gallery.showImageNumbers,
                watermarkEnabled: gallery.watermarkEnabled,
              }}
            />
          </Card>

          <Card>
            <h2 className="mb-2 font-serif text-2xl text-ink">Clients</h2>
            <p className="mb-5 font-sans text-xs text-stone-deep">
              Only assigned clients can open this gallery.
            </p>
            <GalleryClientAssignment
              galleryId={gallery.id}
              assigned={gallery.access.map((a) => ({
                id: a.userId,
                name: a.user.clientProfile?.displayName ?? a.user.name ?? a.user.email,
                email: a.user.email,
              }))}
              allClients={clients.map((c) => ({
                id: c.id,
                name: c.clientProfile?.displayName ?? c.name ?? c.email,
                email: c.email,
              }))}
            />
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <h2 className="mb-6 font-serif text-2xl text-ink">Upload photographs</h2>
            <Uploader target="gallery" targetId={gallery.id} />
          </Card>

          <Card>
            <h2 className="mb-6 font-serif text-2xl text-ink">
              Photographs ({gallery.images.length})
            </h2>
            <ImageManager
              images={managed}
              showCover
              actions={{
                onReorder: reorderGalleryImages.bind(null, gallery.id),
                onDelete: deleteGalleryImage.bind(null, gallery.id),
                onSetCover: setGalleryCover.bind(null, gallery.id),
                onSaveMeta: updateGalleryImageMeta.bind(null, gallery.id),
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
