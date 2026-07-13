/**
 * Generates original, tastefully toned placeholder "photographic plates" for
 * development and design. These are NOT photographs — they are warm gradient
 * studies with film-like grain and a soft vignette, used purely as placeholders
 * until real photography is supplied. No third-party or copyrighted assets are
 * used. Output: /public/placeholders/*.jpg
 *
 * Run: `npx tsx scripts/generate-placeholders.ts`
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

interface Plate {
  name: string;
  width: number;
  height: number;
  from: [number, number, number];
  to: [number, number, number];
}

// Heritage-palette duotone pairs (top -> bottom).
const PLATES: Plate[] = [
  { name: 'hero', width: 2400, height: 1350, from: [58, 52, 42], to: [120, 108, 88] },
  { name: 'feature-1', width: 1600, height: 2000, from: [78, 70, 52], to: [156, 142, 118] },
  { name: 'feature-2', width: 2000, height: 1333, from: [46, 44, 40], to: [110, 100, 82] },
  { name: 'feature-3', width: 1600, height: 2000, from: [92, 60, 58], to: [168, 138, 120] },
  { name: 'weddings', width: 1600, height: 1200, from: [70, 66, 54], to: [176, 164, 138] },
  { name: 'portraits', width: 1600, height: 1200, from: [60, 52, 48], to: [150, 130, 112] },
  { name: 'families', width: 1600, height: 1200, from: [82, 78, 60], to: [182, 170, 140] },
  { name: 'country-life', width: 1600, height: 1200, from: [64, 72, 52], to: [150, 156, 118] },
  { name: 'events', width: 1600, height: 1200, from: [50, 46, 44], to: [128, 116, 100] },
  { name: 'editorial', width: 1600, height: 1200, from: [44, 42, 40], to: [116, 108, 96] },
  { name: 'equine', width: 1600, height: 1200, from: [72, 60, 48], to: [158, 138, 112] },
  { name: 'commercial', width: 1600, height: 1200, from: [56, 56, 52], to: [140, 138, 126] },
  { name: 'about', width: 1600, height: 2000, from: [66, 58, 48], to: [150, 136, 114] },
  { name: 'gallery-1', width: 1600, height: 1067, from: [60, 54, 46], to: [148, 134, 112] },
  { name: 'gallery-2', width: 1400, height: 1750, from: [74, 64, 56], to: [160, 142, 122] },
  { name: 'gallery-3', width: 1600, height: 1067, from: [52, 50, 44], to: [132, 122, 104] },
];

function gradientSvg(w: number, h: number, from: number[], to: number[], seed: number): string {
  const f = `rgb(${from.join(',')})`;
  const t = `rgb(${to.join(',')})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${f}"/>
        <stop offset="1" stop-color="${t}"/>
      </linearGradient>
      <radialGradient id="v" cx="50%" cy="42%" r="75%">
        <stop offset="55%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
        <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0.42"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <ellipse cx="${w * (0.3 + (seed % 5) * 0.1)}" cy="${h * 0.35}" rx="${w * 0.5}" ry="${h * 0.5}"
      fill="rgb(${to.join(',')})" fill-opacity="0.18"/>
    <rect width="${w}" height="${h}" fill="url(#v)"/>
  </svg>`;
}

async function noiseBuffer(w: number, h: number): Promise<Buffer> {
  const channels = 3;
  const buf = Buffer.alloc(w * h * channels);
  for (let i = 0; i < buf.length; i += 1) {
    buf[i] = 110 + Math.floor(Math.random() * 36);
  }
  return sharp(buf, { raw: { width: w, height: h, channels } }).png().toBuffer();
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'public/placeholders');
  await fs.mkdir(outDir, { recursive: true });

  for (let i = 0; i < PLATES.length; i += 1) {
    const plate = PLATES[i]!;
    const { name, width, height, from, to } = plate;
    const base = Buffer.from(gradientSvg(width, height, from, to, i));
    const grain = await noiseBuffer(width, height);

    await sharp(base)
      .composite([{ input: grain, blend: 'soft-light' }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(outDir, `${name}.jpg`));

    process.stdout.write(`  ✓ ${name}.jpg (${width}×${height})\n`);
  }

  // A small manifest documenting these are placeholders.
  await fs.writeFile(
    path.join(outDir, 'README.txt'),
    'These are generated placeholder plates (warm gradient studies), NOT photographs.\n' +
      'Replace with real, licensed photography before launch. See CONTENT_CHECKLIST.md.\n',
  );

  process.stdout.write(`Generated ${PLATES.length} placeholder plates in public/placeholders\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
