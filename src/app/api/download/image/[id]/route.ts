import { NextResponse, type NextRequest } from 'next/server';
import {
  authorizeGalleryImage,
  AuthorizationError,
} from '@/lib/auth/authorization';
import { getStorage } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { hashIp } from '@/lib/crypto';

/**
 * Authorised single-image download.
 *
 * Verifies gallery access AND download permission server-side, records a
 * DownloadEvent, then redirects to a short-lived signed download URL. The URL is
 * never exposed until authorisation succeeds, preventing insecure direct object
 * references.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const resolution = req.nextUrl.searchParams.get('res') === 'full' ? 'FULL' : 'WEB';

  try {
    const { galleryImage, gallery, user } = await authorizeGalleryImage(params.id, {
      forDownload: true,
      resolution,
    });

    const asset = galleryImage.asset;
    const key =
      resolution === 'FULL'
        ? asset.originalKey
        : asset.largeKey ?? asset.displayKey ?? asset.originalKey;

    const ext = (key.split('.').pop() ?? 'jpg').toLowerCase();
    const base = (asset.displayFilename ?? asset.originalFilename ?? 'photograph')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${base}${resolution === 'FULL' ? '' : '-web'}.${ext}`;

    const storage = getStorage();
    const url = await storage.getSignedDownloadUrl('private', key, filename);

    const ipHash = hashIp(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null);
    await prisma.downloadEvent.create({
      data: {
        userId: user.id,
        galleryId: gallery.id,
        galleryImageId: galleryImage.id,
        resolution,
        kind: 'image',
        ipHash,
        userAgent: req.headers.get('user-agent')?.slice(0, 255) ?? null,
      },
    });
    await recordAudit({
      action: 'IMAGE_DOWNLOADED',
      actorId: user.id,
      target: `galleryImage:${galleryImage.id}`,
      metadata: { resolution },
      ipHash,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const status =
        error.code === 'UNAUTHENTICATED' ? 401 : error.code === 'NOT_FOUND' ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error('[download:image] error', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
