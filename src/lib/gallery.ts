import 'server-only';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getServerEnv } from '@/lib/env';
import { resolvePrivateImage } from '@/lib/images/urls';
import { isExpired } from '@/lib/utils';
import type { SessionUser } from '@/lib/auth/authorization';

/**
 * Client gallery read model. All image URLs are short-lived signed URLs
 * generated only after the caller's access has been authorised.
 */

export interface GalleryImageView {
  id: string;
  thumb: string;
  display: string;
  large: string;
  srcSet: string;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  blurDataUrl: string | null;
  isFavourite: boolean;
  canDownload: boolean;
  number: number;
}

export interface GalleryDetailView {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  shootDate: Date | null;
  message: string | null;
  expiresAt: Date | null;
  cover: { display: string; blurDataUrl: string | null } | null;
  allowImageDownload: boolean;
  allowGalleryDownload: boolean;
  allowFullResolution: boolean;
  showImageNumbers: boolean;
  watermarkEnabled: boolean;
  images: GalleryImageView[];
}

export interface GallerySummaryView {
  slug: string;
  title: string;
  shootDate: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  imageCount: number;
  cover: { display: string; blurDataUrl: string | null } | null;
}

/** Galleries a client (or admin) may currently access. */
export async function getGalleriesForUser(user: SessionUser): Promise<GallerySummaryView[]> {
  const galleries =
    user.role === 'ADMIN'
      ? await prisma.gallery.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { coverImage: { include: { asset: true } }, _count: { select: { images: true } } },
        })
      : await prisma.gallery.findMany({
          where: {
            deletedAt: null,
            isPublished: true,
            isDisabled: false,
            access: { some: { userId: user.id, revokedAt: null } },
          },
          orderBy: { createdAt: 'desc' },
          include: { coverImage: { include: { asset: true } }, _count: { select: { images: true } } },
        });

  return Promise.all(
    galleries.map(async (g) => {
      let cover: GallerySummaryView['cover'] = null;
      if (g.coverImage) {
        const resolved = await resolvePrivateImage(g.coverImage.asset, {
          watermark: g.watermarkEnabled,
        });
        cover = { display: resolved.small, blurDataUrl: resolved.blurDataUrl };
      }
      return {
        slug: g.slug,
        title: g.title,
        shootDate: g.shootDate,
        expiresAt: g.expiresAt,
        isExpired: isExpired(g.expiresAt),
        imageCount: g._count.images,
        cover,
      };
    }),
  );
}

/**
 * Build the full, authorised gallery view (cover + all images with signed URLs
 * and the user's favourites). Caller MUST have already passed
 * `authorizeGalleryAccess`.
 */
export async function buildGalleryView(
  galleryId: string,
  user: SessionUser,
): Promise<GalleryDetailView> {
  const gallery = await prisma.gallery.findUniqueOrThrow({
    where: { id: galleryId },
    include: {
      coverImage: { include: { asset: true } },
      images: { include: { asset: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  const favourites = await prisma.favourite.findMany({
    where: { userId: user.id, galleryId },
    select: { galleryImageId: true },
  });
  const favSet = new Set(favourites.map((f) => f.galleryImageId));

  const images: GalleryImageView[] = await Promise.all(
    gallery.images.map(async (gi, index) => {
      const resolved = await resolvePrivateImage(gi.asset, { watermark: gallery.watermarkEnabled });
      const canDownload = (gi.allowDownload ?? gallery.allowImageDownload) === true;
      return {
        id: gi.id,
        thumb: resolved.thumb,
        display: resolved.display,
        large: resolved.large,
        srcSet: resolved.srcSet,
        width: gi.asset.width,
        height: gi.asset.height,
        alt: gi.asset.altText ?? gi.caption ?? `${gallery.title} — image ${index + 1}`,
        caption: gi.caption,
        blurDataUrl: gi.asset.blurDataUrl,
        isFavourite: favSet.has(gi.id),
        canDownload,
        number: index + 1,
      };
    }),
  );

  let cover: GalleryDetailView['cover'] = null;
  if (gallery.coverImage) {
    const resolved = await resolvePrivateImage(gallery.coverImage.asset, {
      watermark: gallery.watermarkEnabled,
    });
    cover = { display: resolved.large, blurDataUrl: resolved.blurDataUrl };
  } else if (images[0]) {
    cover = { display: images[0].large, blurDataUrl: images[0].blurDataUrl };
  }

  return {
    id: gallery.id,
    slug: gallery.slug,
    title: gallery.title,
    clientName: gallery.clientName,
    shootDate: gallery.shootDate,
    message: gallery.message,
    expiresAt: gallery.expiresAt,
    cover,
    allowImageDownload: gallery.allowImageDownload,
    allowGalleryDownload: gallery.allowGalleryDownload,
    allowFullResolution: gallery.allowFullResolution,
    showImageNumbers: gallery.showImageNumbers,
    watermarkEnabled: gallery.watermarkEnabled,
    images,
  };
}

// ----------------------------------------------------------------------------
// Optional per-gallery password gate (in addition to user login)
// ----------------------------------------------------------------------------

function unlockCookieName(galleryId: string): string {
  return `gp_${galleryId}`;
}

function unlockToken(galleryId: string, passwordHash: string): string {
  const env = getServerEnv();
  // Bind the token to the current password hash so changing the password
  // invalidates existing unlock cookies.
  return createHmac('sha256', env.AUTH_SECRET)
    .update(`${galleryId}:${passwordHash}`)
    .digest('hex');
}

/** Whether the current request has satisfied the gallery password gate. */
export function isGalleryUnlocked(galleryId: string, passwordHash: string | null): boolean {
  if (!passwordHash) return true;
  const cookie = cookies().get(unlockCookieName(galleryId))?.value;
  if (!cookie) return false;
  return cookie === unlockToken(galleryId, passwordHash);
}

export function setGalleryUnlockCookie(galleryId: string, passwordHash: string): void {
  cookies().set(unlockCookieName(galleryId), unlockToken(galleryId, passwordHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}
