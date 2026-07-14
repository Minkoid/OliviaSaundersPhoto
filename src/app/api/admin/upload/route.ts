import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthorizationError } from '@/lib/auth/authorization';
import { prisma } from '@/lib/prisma';
import { ingestImage, ImageValidationError } from '@/lib/images/ingest';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Admin image upload endpoint.
 *
 * Accepts multipart form-data with `target` (portfolio|gallery), `targetId`, and
 * one or more `files`. Each file is validated, processed into responsive variants
 * and stored (originals private; portfolio variants public, gallery variants
 * private), then linked to the target with the next sort order.
 *
 * For very large files or high volumes, presigned direct-to-storage uploads with
 * background processing are recommended (the StorageService exposes the multipart
 * primitives); see README "Upload experience".
 */
export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    throw error;
  }

  const form = await req.formData();
  const target = form.get('target');
  const targetId = form.get('targetId');
  const files = form.getAll('files').filter((f): f is File => f instanceof File);

  if ((target !== 'portfolio' && target !== 'gallery') || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  // Confirm the target exists and read gallery watermark preference.
  let watermark = false;
  let watermarkText = 'Preview';
  if (target === 'gallery') {
    const gallery = await prisma.gallery.findUnique({
      where: { id: targetId },
      select: { id: true, watermarkEnabled: true, title: true },
    });
    if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    watermark = gallery.watermarkEnabled;
    watermarkText = gallery.title;
  } else {
    const portfolio = await prisma.portfolio.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
  }

  const results: Array<{ filename: string; ok: boolean; id?: string; error?: string }> = [];

  // Determine the starting sort order.
  const existingCount =
    target === 'gallery'
      ? await prisma.galleryImage.count({ where: { galleryId: targetId } })
      : await prisma.portfolioImage.count({ where: { portfolioId: targetId } });

  let order = existingCount;

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await ingestImage({
        buffer,
        filename: file.name,
        mimeType: file.type,
        visibility: target === 'portfolio' ? 'PUBLIC' : 'PRIVATE',
        watermark,
        watermarkText,
      });

      if (target === 'gallery') {
        const gi = await prisma.galleryImage.create({
          data: { galleryId: targetId, assetId: asset.id, sortOrder: order },
        });
        results.push({ filename: file.name, ok: true, id: gi.id });
      } else {
        const pi = await prisma.portfolioImage.create({
          data: { portfolioId: targetId, assetId: asset.id, sortOrder: order, visibility: 'PUBLIC' },
        });
        results.push({ filename: file.name, ok: true, id: pi.id });
      }
      order += 1;
    } catch (err) {
      const message =
        err instanceof ImageValidationError ? err.message : 'Processing failed';
      console.error('[upload] file failed', file.name, err);
      results.push({ filename: file.name, ok: false, error: message });
    }
  }

  await recordAudit({
    action: 'IMAGE_UPLOADED',
    actorId: admin.id,
    target: `${target}:${targetId}`,
    metadata: { count: results.filter((r) => r.ok).length },
  });

  return NextResponse.json({ results });
}
