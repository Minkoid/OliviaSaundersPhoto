import { Reveal } from '@/components/ui/reveal';
import { EditorialImage } from './editorial-image';
import type { ImageView } from '@/lib/view-models';

/**
 * Editorial layout engine for portfolio detail pages.
 *
 * Rather than a uniform grid, images are arranged into varied "movements" driven
 * by each image's layoutHint (full-bleed, wide, tall pair, or a curated pair),
 * producing a magazine-like rhythm that stays consistent across portfolios while
 * never looking identical.
 */

interface Block {
  type: 'full' | 'wide' | 'pair';
  images: ImageView[];
}

function planLayout(images: ImageView[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  let cursor = 0;
  const pattern: Block['type'][] = ['full', 'pair', 'wide', 'pair'];

  while (i < images.length) {
    const type = pattern[cursor % pattern.length]!;
    cursor += 1;
    if (type === 'pair') {
      const pair = images.slice(i, i + 2);
      if (pair.length === 2) {
        blocks.push({ type: 'pair', images: pair });
        i += 2;
        continue;
      }
      blocks.push({ type: 'wide', images: [pair[0]!] });
      i += 1;
      continue;
    }
    blocks.push({ type, images: [images[i]!] });
    i += 1;
  }
  return blocks;
}

function Caption({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <figcaption className="mt-3 font-sans text-xs uppercase tracking-widest text-stone-deep">
      {text}
    </figcaption>
  );
}

export function EditorialLayout({ images }: { images: ImageView[] }) {
  if (images.length === 0) {
    return (
      <p className="container-shell py-section text-center font-serif text-2xl text-stone-deep">
        Photographs for this collection are being prepared.
      </p>
    );
  }

  const blocks = planLayout(images);

  return (
    <div className="space-y-16 md:space-y-24">
      {blocks.map((block, index) => {
        if (block.type === 'full') {
          const image = block.images[0]!;
          return (
            <Reveal key={image.id} as="figure">
              <EditorialImage
                image={image}
                sizes="100vw"
                priority={index === 0}
                className="w-full"
              />
              <div className="container-shell">
                <Caption text={image.caption} />
              </div>
            </Reveal>
          );
        }

        if (block.type === 'wide') {
          const image = block.images[0]!;
          return (
            <Reveal key={image.id} as="figure" className="container-shell">
              <div className="mx-auto max-w-5xl">
                <EditorialImage image={image} sizes="(min-width: 1024px) 64rem, 100vw" />
                <Caption text={image.caption} />
              </div>
            </Reveal>
          );
        }

        return (
          <div key={block.images[0]!.id} className="container-shell">
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              {block.images.map((image) => (
                <Reveal key={image.id} as="figure">
                  <EditorialImage image={image} sizes="(min-width: 768px) 45rem, 100vw" />
                  <Caption text={image.caption} />
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
