import 'server-only';
import { redirect } from 'next/navigation';
import type { Gallery } from '@prisma/client';
import { auth } from './index';
import { prisma } from '@/lib/prisma';
import { isExpired } from '@/lib/utils';

/**
 * Reusable server-side authorisation helpers.
 *
 * These are the single source of truth for access decisions. UI affordances
 * (hidden buttons, etc.) are never relied upon for security — every protected
 * server action, route handler and page uses one of these helpers.
 */

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'UNAUTHENTICATED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'EXPIRED'
      | 'DISABLED'
      | 'DOWNLOAD_DISABLED',
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  isActive: boolean;
}

/** Return the current session user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    role: session.user.role,
    isActive: session.user.isActive,
  };
}

/** Require any authenticated user. Throws if not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError('Authentication required', 'UNAUTHENTICATED');
  if (!user.isActive) throw new AuthorizationError('Account disabled', 'DISABLED');
  return user;
}

/** Require an administrator. Throws if not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new AuthorizationError('Administrator access required', 'FORBIDDEN');
  return user;
}

/** Redirect-based guard for admin pages (Server Components). */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=/admin');
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}

/** Redirect-based guard for authenticated client pages. */
export async function requireUserPage(callbackUrl = '/account'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (!user.isActive) redirect('/login?error=disabled');
  return user;
}

export interface GalleryAccessResult {
  gallery: Gallery;
  user: SessionUser;
}

/**
 * The central private-gallery authorisation check.
 *
 * Verifies, in order:
 *  1. The user is authenticated (and active).
 *  2. The gallery exists and is not soft-deleted.
 *  3. The gallery is published and not disabled.
 *  4. The gallery has not expired.
 *  5. The user has an (un-revoked) access grant — unless they are an admin.
 *
 * Admins bypass the per-user access grant but still respect existence checks.
 * Throws AuthorizationError with a specific code on any failure so callers can
 * render the appropriate message (expired vs. forbidden vs. not found).
 */
export async function authorizeGalleryAccess(
  gallerySlug: string,
  options?: { allowAdminBypass?: boolean; ignoreExpiry?: boolean },
): Promise<GalleryAccessResult> {
  const allowAdminBypass = options?.allowAdminBypass ?? true;
  const user = await requireUser();

  const gallery = await prisma.gallery.findFirst({
    where: { slug: gallerySlug, deletedAt: null },
  });

  if (!gallery) throw new AuthorizationError('Gallery not found', 'NOT_FOUND');

  const isAdmin = user.role === 'ADMIN' && allowAdminBypass;

  if (!isAdmin) {
    if (!gallery.isPublished) throw new AuthorizationError('Gallery not found', 'NOT_FOUND');
    if (gallery.isDisabled) throw new AuthorizationError('Gallery access disabled', 'DISABLED');
    if (!options?.ignoreExpiry && isExpired(gallery.expiresAt)) {
      throw new AuthorizationError('Gallery expired', 'EXPIRED');
    }

    const access = await prisma.galleryAccess.findFirst({
      where: { galleryId: gallery.id, userId: user.id, revokedAt: null },
    });
    if (!access) throw new AuthorizationError('No access to this gallery', 'FORBIDDEN');
  }

  return { gallery, user };
}

/**
 * Verify a specific gallery image belongs to a gallery the user may access, and
 * (optionally) that downloading is permitted. Prevents insecure direct object
 * references — a client cannot fetch another gallery's image by guessing IDs.
 */
export async function authorizeGalleryImage(
  galleryImageId: string,
  options?: { forDownload?: boolean; resolution?: 'WEB' | 'FULL' },
) {
  const user = await requireUser();

  const galleryImage = await prisma.galleryImage.findUnique({
    where: { id: galleryImageId },
    include: { gallery: true, asset: true },
  });

  if (!galleryImage || galleryImage.gallery.deletedAt) {
    throw new AuthorizationError('Image not found', 'NOT_FOUND');
  }

  const gallery = galleryImage.gallery;
  const isAdmin = user.role === 'ADMIN';

  if (!isAdmin) {
    if (!gallery.isPublished) throw new AuthorizationError('Image not found', 'NOT_FOUND');
    if (gallery.isDisabled) throw new AuthorizationError('Gallery access disabled', 'DISABLED');
    if (isExpired(gallery.expiresAt)) throw new AuthorizationError('Gallery expired', 'EXPIRED');

    const access = await prisma.galleryAccess.findFirst({
      where: { galleryId: gallery.id, userId: user.id, revokedAt: null },
    });
    if (!access) throw new AuthorizationError('No access to this gallery', 'FORBIDDEN');

    if (options?.forDownload) {
      const perImage = galleryImage.allowDownload;
      const allowed = perImage ?? gallery.allowImageDownload;
      if (!allowed) {
        throw new AuthorizationError('Downloads are not enabled', 'DOWNLOAD_DISABLED');
      }
      if (options.resolution === 'FULL' && !gallery.allowFullResolution) {
        throw new AuthorizationError('Full-resolution downloads are not enabled', 'DOWNLOAD_DISABLED');
      }
    }
  }

  return { galleryImage, gallery, user };
}
