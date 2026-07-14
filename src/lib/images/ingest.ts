import type { ImageAsset, ImageVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStorage, storageKeys } from '@/lib/storage';
import {
  processImage,
  createWatermarkedVariant,
  readImageMetadata,
  extensionForMime,
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_DIMENSION,
} from './processor';

export interface IngestInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  visibility: ImageVisibility;
  altText?: string | null;
  /** Generate a watermarked preview variant (private galleries). */
  watermark?: boolean;
  watermarkText?: string;
}

export class ImageValidationError extends Error {}

/**
 * Validate, process and store an uploaded image, returning the created
 * ImageAsset. This is the single ingestion path used by all upload routes.
 *
 * - Originals ALWAYS go to the private bucket (never public), preserving the
 *   untouched upload.
 * - Public (portfolio) variants go to the public bucket; private (gallery)
 *   variants stay in the private bucket and are only ever served via signed URLs.
 */
export async function ingestImage(input: IngestInput): Promise<ImageAsset> {
  if (!ACCEPTED_IMAGE_TYPES.includes(input.mimeType as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new ImageValidationError(`Unsupported file type: ${input.mimeType}`);
  }
  if (input.buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError('File exceeds the maximum allowed size.');
  }

  const meta = await readImageMetadata(input.buffer);
  if (!meta.width || !meta.height) {
    throw new ImageValidationError('Could not read image dimensions.');
  }
  if (meta.width < MIN_IMAGE_DIMENSION || meta.height < MIN_IMAGE_DIMENSION) {
    throw new ImageValidationError(
      `Image is too small (minimum ${MIN_IMAGE_DIMENSION}px on each side).`,
    );
  }

  const storage = getStorage();
  const isPublic = input.visibility === 'PUBLIC';
  const scope = isPublic ? 'public' : 'private';

  const asset = await prisma.imageAsset.create({
    data: {
      originalKey: 'pending',
      originalFilename: input.filename,
      displayFilename: input.filename,
      mimeType: input.mimeType,
      visibility: input.visibility,
      altText: input.altText ?? null,
      processingStatus: 'processing',
      width: meta.width,
      height: meta.height,
      fileSize: input.buffer.byteLength,
      orientation: meta.orientation,
    },
  });

  try {
    const originalExt = extensionForMime(input.mimeType);
    const originalKey = storageKeys.original(asset.id, originalExt);
    await storage.uploadOriginal({
      key: originalKey,
      body: input.buffer,
      contentType: input.mimeType,
      cacheControl: 'private, max-age=31536000, immutable',
    });

    const processed = await processImage(input.buffer);
    const variantKeys: Record<string, string | null> = {
      thumbKey: null,
      smallKey: null,
      displayKey: null,
      largeKey: null,
      watermarkKey: null,
    };

    for (const variant of processed.variants) {
      const key = isPublic
        ? storageKeys.publicVariant(asset.id, variant.name, variant.ext)
        : storageKeys.variant(asset.id, variant.name, variant.ext);
      await storage.uploadVariant({
        scope,
        key,
        body: variant.buffer,
        contentType: variant.contentType,
        cacheControl: isPublic
          ? 'public, max-age=31536000, immutable'
          : 'private, max-age=86400',
      });
      variantKeys[`${variant.name}Key`] = key;
    }

    if (input.watermark) {
      const wm = await createWatermarkedVariant(input.buffer, {
        text: input.watermarkText ?? 'Preview',
      });
      const key = storageKeys.variant(asset.id, 'watermark', wm.ext);
      await storage.uploadVariant({
        scope: 'private',
        key,
        body: wm.buffer,
        contentType: wm.contentType,
        cacheControl: 'private, max-age=86400',
      });
      variantKeys.watermarkKey = key;
    }

    return prisma.imageAsset.update({
      where: { id: asset.id },
      data: {
        originalKey,
        thumbKey: variantKeys.thumbKey,
        smallKey: variantKeys.smallKey,
        displayKey: variantKeys.displayKey,
        largeKey: variantKeys.largeKey,
        watermarkKey: variantKeys.watermarkKey,
        blurDataUrl: processed.blurDataUrl,
        processingStatus: 'ready',
      },
    });
  } catch (err) {
    await prisma.imageAsset.update({
      where: { id: asset.id },
      data: { processingStatus: 'failed' },
    });
    throw err;
  }
}

/** Delete an asset and all its stored objects. */
export async function deleteAsset(assetId: string): Promise<void> {
  const asset = await prisma.imageAsset.findUnique({ where: { id: assetId } });
  if (!asset) return;
  const storage = getStorage();
  const publicScope = asset.visibility === 'PUBLIC';

  const deletions: Promise<unknown>[] = [
    storage.deleteFile('private', asset.originalKey).catch(() => {}),
  ];
  for (const key of [asset.thumbKey, asset.smallKey, asset.displayKey, asset.largeKey]) {
    if (key) deletions.push(storage.deleteFile(publicScope ? 'public' : 'private', key).catch(() => {}));
  }
  if (asset.watermarkKey) {
    deletions.push(storage.deleteFile('private', asset.watermarkKey).catch(() => {}));
  }
  await Promise.all(deletions);
  await prisma.imageAsset.delete({ where: { id: assetId } });
}
