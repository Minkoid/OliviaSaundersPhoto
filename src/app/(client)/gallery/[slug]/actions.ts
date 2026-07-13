'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  authorizeGalleryAccess,
  authorizeGalleryImage,
  AuthorizationError,
} from '@/lib/auth/authorization';
import { verifyPassword } from '@/lib/auth/password';
import { setGalleryUnlockCookie } from '@/lib/gallery';
import { galleryPasswordSchema } from '@/lib/validation';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { hashIp } from '@/lib/crypto';

export interface ToggleFavouriteResult {
  ok: boolean;
  favourite?: boolean;
  error?: string;
}

/**
 * Toggle a favourite for the current user on a specific gallery image.
 * Authorisation is enforced server-side via `authorizeGalleryImage` — the client
 * cannot favourite an image it may not access.
 */
export async function toggleFavourite(galleryImageId: string): Promise<ToggleFavouriteResult> {
  try {
    const { galleryImage, gallery, user } = await authorizeGalleryImage(galleryImageId);

    const existing = await prisma.favourite.findUnique({
      where: { userId_galleryImageId: { userId: user.id, galleryImageId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return { ok: true, favourite: false };
    }

    await prisma.favourite.create({
      data: { userId: user.id, galleryId: gallery.id, galleryImageId: galleryImage.id },
    });
    return { ok: true, favourite: true };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, error: 'You do not have access to this image.' };
    }
    console.error('[favourite] error', error);
    return { ok: false, error: 'Something went wrong.' };
  }
}

export interface UnlockState {
  status: 'idle' | 'error';
  message?: string;
}

/**
 * Verify an optional per-gallery password (in addition to user login). On
 * success sets a short-lived, http-only unlock cookie bound to the current
 * password hash. Rate-limited per IP + gallery.
 */
export async function unlockGallery(
  slug: string,
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const parsed = galleryPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter the gallery password.' };
  }

  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ipHash = hashIp(ip);
  const limited = rateLimit({
    key: `gpw:${ipHash ?? 'unknown'}:${slug}`,
    ...RATE_LIMITS.galleryPassword,
  });
  if (!limited.success) {
    return { status: 'error', message: 'Too many attempts. Please wait a few minutes.' };
  }

  try {
    // Confirms the user is authenticated and permitted before checking the password.
    const { gallery } = await authorizeGalleryAccess(slug);
    if (!gallery.passwordHash) {
      return { status: 'idle' };
    }
    const valid = await verifyPassword(parsed.data.password, gallery.passwordHash);
    if (!valid) {
      return { status: 'error', message: 'That password is not correct.' };
    }
    setGalleryUnlockCookie(gallery.id, gallery.passwordHash);
    revalidatePath(`/gallery/${slug}`);
    return { status: 'idle' };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: 'You do not have access to this gallery.' };
    }
    console.error('[unlock] error', error);
    return { status: 'error', message: 'Something went wrong.' };
  }
}
