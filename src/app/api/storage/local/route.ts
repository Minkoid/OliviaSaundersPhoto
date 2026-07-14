import { NextResponse, type NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getServerEnv } from '@/lib/env';
import { LocalStorageService } from '@/lib/storage/local';
import type { StorageScope } from '@/lib/storage/types';

/**
 * Development-only file streamer for the local storage driver.
 *
 * Public-scope objects are served directly (they are intended to be public).
 * Private-scope objects require a valid, unexpired HMAC signature — mirroring the
 * short-lived signed-URL model used by S3/R2 in production, so authorisation code
 * paths behave identically in development.
 */
function contentTypeFor(key: string): string {
  const ext = path.extname(key).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.tiff': 'image/tiff',
    '.zip': 'application/zip',
    '.pdf': 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}

export async function GET(req: NextRequest) {
  const env = getServerEnv();
  if (env.STORAGE_DRIVER !== 'local') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const scope = (params.get('scope') as StorageScope) ?? 'public';
  const key = params.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

  const isPublic = params.get('public') === '1' && scope === 'public';

  if (!isPublic) {
    const expires = Number(params.get('expires'));
    const sig = params.get('sig') ?? '';
    const download = params.get('download') ?? undefined;
    const storage = new LocalStorageService();
    if (!storage.verify(scope, key, expires, sig, download)) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 403 });
    }
  }

  const root = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  const safeKey = key.replace(/\.\.(\/|\\|$)/g, '');
  const filePath = path.join(root, scope, safeKey);

  try {
    const data = await fs.readFile(filePath);
    const download = params.get('download');
    const headers = new Headers({
      'Content-Type': contentTypeFor(key),
      'Content-Length': String(data.byteLength),
      'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
    });
    if (download) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(download)}"`);
    }
    return new NextResponse(new Uint8Array(data), { status: 200, headers });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
