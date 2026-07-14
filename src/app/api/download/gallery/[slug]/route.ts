import { type NextRequest } from 'next/server';
import archiver from 'archiver';
import { PassThrough, Readable } from 'node:stream';
import {
  authorizeGalleryAccess,
  AuthorizationError,
} from '@/lib/auth/authorization';
import { getStorage } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { hashIp } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
// 60s is the max on Vercel's free (Hobby) plan (Pro allows up to 300). The ZIP is
// streamed, not buffered; for very large galleries use the async archive approach
// documented in DEPLOYMENT.md. See DEPLOY_FREE.md.
export const maxDuration = 60;

/**
 * Full-gallery ZIP download.
 *
 * Streams a ZIP archive so files are never fully buffered in memory. This suits
 * small-to-moderate galleries within a serverless timeout. For very large
 * galleries, an asynchronous, object-storage-based archive job is recommended
 * (see README "Download handling").
 *
 * Web-resolution variants are archived by default; full-resolution is included
 * only when the gallery explicitly permits it and ?res=full is requested.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const wantFull = req.nextUrl.searchParams.get('res') === 'full';

  try {
    const { gallery, user } = await authorizeGalleryAccess(params.slug);

    if (!gallery.allowGalleryDownload && user.role !== 'ADMIN') {
      return Response.json({ error: 'Gallery download is not enabled' }, { status: 403 });
    }
    const useFull = wantFull && (gallery.allowFullResolution || user.role === 'ADMIN');

    const images = await prisma.galleryImage.findMany({
      where: { galleryId: gallery.id },
      include: { asset: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (images.length === 0) {
      return Response.json({ error: 'This gallery has no photographs' }, { status: 404 });
    }

    const storage = getStorage();
    const archive = archiver('zip', { zlib: { level: 6 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    archive.on('warning', (err) => console.warn('[download:zip] warning', err));
    archive.on('error', (err) => {
      console.error('[download:zip] error', err);
      passthrough.destroy(err);
    });

    // Append files sequentially, then finalise. Errors on a single object are
    // logged and skipped so one bad file does not fail the whole archive.
    (async () => {
      for (let i = 0; i < images.length; i += 1) {
        const gi = images[i]!;
        const asset = gi.asset;
        const key = useFull
          ? asset.originalKey
          : asset.largeKey ?? asset.displayKey ?? asset.originalKey;
        try {
          const bytes = await storage.getObjectBytes('private', key);
          const ext = (key.split('.').pop() ?? 'jpg').toLowerCase();
          const name = `${String(i + 1).padStart(3, '0')}.${ext}`;
          archive.append(bytes, { name });
        } catch (err) {
          console.error('[download:zip] skipping object', key, err);
        }
      }
      await archive.finalize();
    })();

    const ipHash = hashIp(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null);
    await prisma.downloadEvent.create({
      data: {
        userId: user.id,
        galleryId: gallery.id,
        resolution: useFull ? 'FULL' : 'WEB',
        kind: 'gallery-zip',
        ipHash,
        userAgent: req.headers.get('user-agent')?.slice(0, 255) ?? null,
      },
    });
    await recordAudit({
      action: 'GALLERY_DOWNLOADED',
      actorId: user.id,
      target: `gallery:${gallery.id}`,
      metadata: { resolution: useFull ? 'FULL' : 'WEB', count: images.length },
      ipHash,
    });

    const safeName = gallery.slug.replace(/[^a-zA-Z0-9-_]/g, '_');
    const webStream = Readable.toWeb(passthrough) as unknown as ReadableStream;
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}.zip"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const status =
        error.code === 'UNAUTHENTICATED' ? 401 : error.code === 'NOT_FOUND' ? 404 : 403;
      return Response.json({ error: error.message }, { status });
    }
    console.error('[download:gallery] error', error);
    return Response.json({ error: 'Download failed' }, { status: 500 });
  }
}
