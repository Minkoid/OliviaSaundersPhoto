import 'server-only';
import type { ImageAsset } from '@prisma/client';
import { getStorage } from '@/lib/storage';

/**
 * Resolve display URLs for image assets.
 *
 * Public portfolio variants are served from the public bucket (optionally
 * CDN-fronted). Private gallery variants are served ONLY via short-lived signed
 * URLs generated after server-side authorisation — never as permanent public
 * links.
 */

export type VariantKey = 'thumbKey' | 'smallKey' | 'displayKey' | 'largeKey' | 'watermarkKey';

function pickKey(asset: ImageAsset, preferred: VariantKey): string {
  return (
    asset[preferred] ??
    asset.displayKey ??
    asset.smallKey ??
    asset.largeKey ??
    asset.thumbKey ??
    asset.originalKey
  );
}

export interface ResolvedImage {
  thumb: string;
  small: string;
  display: string;
  large: string;
  srcSet: string;
  width: number | null;
  height: number | null;
  alt: string;
  blurDataUrl: string | null;
}

/** Public portfolio image URLs (stable, cacheable). */
export function resolvePublicImage(asset: ImageAsset): ResolvedImage {
  const storage = getStorage();
  const url = (key: string) => storage.getPublicUrl(key);
  const thumb = url(pickKey(asset, 'thumbKey'));
  const small = url(pickKey(asset, 'smallKey'));
  const display = url(pickKey(asset, 'displayKey'));
  const large = url(pickKey(asset, 'largeKey'));
  return {
    thumb,
    small,
    display,
    large,
    srcSet: buildSrcSet([
      [small, 800],
      [display, 1600],
      [large, 2400],
    ]),
    width: asset.width,
    height: asset.height,
    alt: asset.altText ?? '',
    blurDataUrl: asset.blurDataUrl,
  };
}

/**
 * Private gallery image URLs (signed, short-lived). If the gallery has
 * watermarking enabled, the watermarked variant is used for display.
 */
export async function resolvePrivateImage(
  asset: ImageAsset,
  options?: { watermark?: boolean },
): Promise<ResolvedImage> {
  const storage = getStorage();
  const sign = (key: string) => storage.getSignedViewUrl('private', key);

  const displayKey = options?.watermark && asset.watermarkKey ? asset.watermarkKey : pickKey(asset, 'displayKey');

  const [thumb, small, display, large] = await Promise.all([
    sign(pickKey(asset, 'thumbKey')),
    sign(pickKey(asset, 'smallKey')),
    sign(displayKey),
    sign(options?.watermark && asset.watermarkKey ? asset.watermarkKey : pickKey(asset, 'largeKey')),
  ]);

  return {
    thumb,
    small,
    display,
    large,
    srcSet: buildSrcSet([
      [small, 800],
      [display, 1600],
    ]),
    width: asset.width,
    height: asset.height,
    alt: asset.altText ?? '',
    blurDataUrl: asset.blurDataUrl,
  };
}

function buildSrcSet(entries: Array<[string, number]>): string {
  return entries.map(([url, w]) => `${url} ${w}w`).join(', ');
}
