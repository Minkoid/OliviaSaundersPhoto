import 'server-only';
import sharp from 'sharp';

/**
 * Image processing pipeline.
 *
 * Generates responsive WebP variants plus a tiny blurred placeholder while
 * preserving aspect ratio and photographic quality. The original upload is never
 * mutated — variants are derived from an in-memory copy.
 *
 * Quality is intentionally kept high (premium photography must not look poor).
 * EXIF/metadata is stripped from derived public variants; the original retains
 * its metadata in private storage.
 */

export type VariantName = 'thumb' | 'small' | 'display' | 'large';

export interface VariantSpec {
  name: VariantName;
  width: number;
  quality: number;
}

// Responsive breakpoints tuned for editorial, photography-heavy layouts.
export const VARIANT_SPECS: VariantSpec[] = [
  { name: 'thumb', width: 400, quality: 72 },
  { name: 'small', width: 800, quality: 78 },
  { name: 'display', width: 1600, quality: 82 },
  { name: 'large', width: 2400, quality: 84 },
];

export interface ProcessedVariant {
  name: VariantName;
  buffer: Buffer;
  width: number;
  height: number;
  contentType: 'image/webp';
  ext: 'webp';
}

export interface ProcessedImage {
  width: number;
  height: number;
  orientation: number;
  format: string;
  variants: ProcessedVariant[];
  blurDataUrl: string;
}

export interface WatermarkOptions {
  text: string;
  opacity?: number;
}

/**
 * Read intrinsic metadata from an image buffer.
 */
export async function readImageMetadata(input: Buffer) {
  const meta = await sharp(input, { failOn: 'none' }).metadata();
  return {
    width: meta.width ?? null,
    height: meta.height ?? null,
    format: meta.format ?? null,
    orientation: meta.orientation ?? 1,
    size: meta.size ?? input.byteLength,
  };
}

/**
 * Generate a small blurred placeholder (base64 data URL) to prevent layout
 * shift and give a refined loading experience.
 */
export async function generateBlurPlaceholder(input: Buffer): Promise<string> {
  const buffer = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(16, 16, { fit: 'inside' })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * Produce all responsive variants for an uploaded image. Variants larger than
 * the source are skipped (never upscale) but at least one variant is always
 * produced.
 */
export async function processImage(
  input: Buffer,
  options?: { specs?: VariantSpec[] },
): Promise<ProcessedImage> {
  const specs = options?.specs ?? VARIANT_SPECS;
  const base = sharp(input, { failOn: 'none' }).rotate(); // normalise orientation
  const meta = await base.metadata();
  const sourceWidth = meta.width ?? 0;
  const sourceHeight = meta.height ?? 0;

  const applicable = specs.filter((s) => s.width <= sourceWidth || s.name === 'thumb');
  const chosen = applicable.length > 0 ? applicable : [specs[0]!];

  const variants: ProcessedVariant[] = [];
  for (const spec of chosen) {
    const pipeline = sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: Math.min(spec.width, sourceWidth || spec.width), withoutEnlargement: true })
      .webp({ quality: spec.quality, effort: 4 });
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    variants.push({
      name: spec.name,
      buffer: data,
      width: info.width,
      height: info.height,
      contentType: 'image/webp',
      ext: 'webp',
    });
  }

  const blurDataUrl = await generateBlurPlaceholder(input);

  return {
    width: sourceWidth,
    height: sourceHeight,
    orientation: meta.orientation ?? 1,
    format: meta.format ?? 'unknown',
    variants,
    blurDataUrl,
  };
}

/**
 * Create a watermarked preview from an image buffer. Uses an SVG text overlay
 * so no font files are required. Returns a WebP display-sized image.
 */
export async function createWatermarkedVariant(
  input: Buffer,
  options: WatermarkOptions,
): Promise<ProcessedVariant> {
  const base = sharp(input, { failOn: 'none' }).rotate().resize({
    width: 1600,
    withoutEnlargement: true,
  });
  const { data, info } = await base.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

  const opacity = options.opacity ?? 0.28;
  const fontSize = Math.round(info.width / 22);
  const escaped = options.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = Buffer.from(
    `<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { fill: #ffffff; fill-opacity: ${opacity}; font-family: Georgia, serif;
              font-size: ${fontSize}px; letter-spacing: ${Math.round(fontSize / 8)}px; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(-30 ${info.width / 2} ${info.height / 2})" class="wm">${escaped}</text>
    </svg>`,
  );

  const composed = await sharp(data)
    .composite([{ input: svg, gravity: 'center' }])
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    name: 'display',
    buffer: composed.data,
    width: composed.info.width,
    height: composed.info.height,
    contentType: 'image/webp',
    ext: 'webp',
  };
}

/** Accepted upload MIME types. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/avif',
] as const;

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024; // 60 MB per file
export const MIN_IMAGE_DIMENSION = 200;

export function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/tiff':
      return 'tiff';
    case 'image/avif':
      return 'avif';
    default:
      return 'bin';
  }
}
