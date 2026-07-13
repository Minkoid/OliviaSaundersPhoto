import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  processImage,
  readImageMetadata,
  generateBlurPlaceholder,
  createWatermarkedVariant,
  extensionForMime,
} from './processor';

async function makeImage(width = 2000, height = 1333): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 110, b: 90 } },
  })
    .jpeg()
    .toBuffer();
}

describe('processImage', () => {
  it('generates responsive WebP variants without upscaling', async () => {
    const input = await makeImage(2000, 1333);
    const result = await processImage(input);
    expect(result.width).toBe(2000);
    expect(result.height).toBe(1333);
    expect(result.variants.length).toBeGreaterThan(0);
    // Every variant is WebP and no wider than the source.
    for (const v of result.variants) {
      expect(v.contentType).toBe('image/webp');
      expect(v.width).toBeLessThanOrEqual(2000);
    }
    // A 'large' (2400w) variant should be skipped for a 2000px source.
    expect(result.variants.find((v) => v.name === 'large')).toBeUndefined();
    expect(result.blurDataUrl.startsWith('data:image/webp;base64,')).toBe(true);
  });

  it('always produces at least a thumbnail for small images', async () => {
    const input = await makeImage(300, 300);
    const result = await processImage(input);
    expect(result.variants.length).toBeGreaterThan(0);
  });
});

describe('readImageMetadata', () => {
  it('reads dimensions', async () => {
    const meta = await readImageMetadata(await makeImage(800, 600));
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });
});

describe('generateBlurPlaceholder', () => {
  it('returns a small data URL', async () => {
    const blur = await generateBlurPlaceholder(await makeImage());
    expect(blur).toMatch(/^data:image\/webp;base64,/);
  });
});

describe('createWatermarkedVariant', () => {
  it('produces a watermarked webp of similar dimensions', async () => {
    const wm = await createWatermarkedVariant(await makeImage(1600, 1067), { text: 'Preview' });
    expect(wm.contentType).toBe('image/webp');
    expect(wm.width).toBeLessThanOrEqual(1600);
  });
});

describe('extensionForMime', () => {
  it('maps common mime types', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/webp')).toBe('webp');
    expect(extensionForMime('application/octet-stream')).toBe('bin');
  });
});
