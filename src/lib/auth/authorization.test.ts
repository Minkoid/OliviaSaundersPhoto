import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth session provider and Prisma before importing the module.
// `vi.hoisted` ensures these are initialised before the hoisted vi.mock factories run.
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    gallery: { findFirst: vi.fn(), findUniqueOrThrow: vi.fn() },
    galleryAccess: { findFirst: vi.fn() },
    galleryImage: { findUnique: vi.fn() },
  },
}));
vi.mock('./index', () => ({ auth: () => authMock() }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import {
  authorizeGalleryAccess,
  authorizeGalleryImage,
  AuthorizationError,
} from './authorization';

const CLIENT_SESSION = {
  user: { id: 'user-1', email: 'c@example.com', role: 'CLIENT', isActive: true },
};
const ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'a@example.com', role: 'ADMIN', isActive: true },
};

function baseGallery(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gal-1',
    slug: 'eleanor',
    isPublished: true,
    isDisabled: false,
    expiresAt: null,
    deletedAt: null,
    allowImageDownload: false,
    allowFullResolution: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(CLIENT_SESSION);
});

describe('authorizeGalleryAccess', () => {
  it('throws UNAUTHENTICATED when not signed in', async () => {
    authMock.mockResolvedValue(null);
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('throws NOT_FOUND when the gallery does not exist', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(null);
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('hides unpublished galleries from clients as NOT_FOUND', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(baseGallery({ isPublished: false }));
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws DISABLED for a disabled gallery', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(baseGallery({ isDisabled: true }));
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'DISABLED' });
  });

  it('throws EXPIRED for an expired gallery', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(
      baseGallery({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'EXPIRED' });
  });

  it('throws FORBIDDEN when the client has no access grant', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(baseGallery());
    prismaMock.galleryAccess.findFirst.mockResolvedValue(null);
    await expect(authorizeGalleryAccess('eleanor')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns the gallery when the client has an access grant', async () => {
    prismaMock.gallery.findFirst.mockResolvedValue(baseGallery());
    prismaMock.galleryAccess.findFirst.mockResolvedValue({ id: 'acc-1' });
    const result = await authorizeGalleryAccess('eleanor');
    expect(result.gallery.id).toBe('gal-1');
  });

  it('allows an admin to bypass the per-user access grant', async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.gallery.findFirst.mockResolvedValue(baseGallery({ isPublished: false }));
    const result = await authorizeGalleryAccess('eleanor');
    expect(result.gallery.id).toBe('gal-1');
    expect(prismaMock.galleryAccess.findFirst).not.toHaveBeenCalled();
  });
});

describe('authorizeGalleryImage (IDOR protection)', () => {
  function galleryImage(overrides: Record<string, unknown> = {}) {
    return {
      id: 'gi-1',
      allowDownload: null,
      gallery: baseGallery(),
      asset: { id: 'asset-1', originalKey: 'k', largeKey: null, displayKey: 'd' },
      ...overrides,
    };
  }

  it('throws NOT_FOUND when the image does not exist', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(null);
    await expect(authorizeGalleryImage('gi-x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('blocks a client from another gallery (no access grant)', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(galleryImage());
    prismaMock.galleryAccess.findFirst.mockResolvedValue(null);
    await expect(authorizeGalleryImage('gi-1')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('blocks download when downloads are disabled', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(galleryImage());
    prismaMock.galleryAccess.findFirst.mockResolvedValue({ id: 'acc-1' });
    await expect(
      authorizeGalleryImage('gi-1', { forDownload: true }),
    ).rejects.toMatchObject({ code: 'DOWNLOAD_DISABLED' });
  });

  it('blocks full-resolution when only web downloads are enabled', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(
      galleryImage({ gallery: baseGallery({ allowImageDownload: true, allowFullResolution: false }) }),
    );
    prismaMock.galleryAccess.findFirst.mockResolvedValue({ id: 'acc-1' });
    await expect(
      authorizeGalleryImage('gi-1', { forDownload: true, resolution: 'FULL' }),
    ).rejects.toMatchObject({ code: 'DOWNLOAD_DISABLED' });
  });

  it('permits a web download when the gallery allows it', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(
      galleryImage({ gallery: baseGallery({ allowImageDownload: true }) }),
    );
    prismaMock.galleryAccess.findFirst.mockResolvedValue({ id: 'acc-1' });
    const result = await authorizeGalleryImage('gi-1', { forDownload: true, resolution: 'WEB' });
    expect(result.galleryImage.id).toBe('gi-1');
  });

  it('respects a per-image download override', async () => {
    prismaMock.galleryImage.findUnique.mockResolvedValue(
      galleryImage({ allowDownload: true, gallery: baseGallery({ allowImageDownload: false }) }),
    );
    prismaMock.galleryAccess.findFirst.mockResolvedValue({ id: 'acc-1' });
    const result = await authorizeGalleryImage('gi-1', { forDownload: true });
    expect(result.galleryImage.id).toBe('gi-1');
  });
});

describe('AuthorizationError', () => {
  it('carries a machine-readable code', () => {
    const err = new AuthorizationError('nope', 'FORBIDDEN');
    expect(err.code).toBe('FORBIDDEN');
    expect(err).toBeInstanceOf(Error);
  });
});
