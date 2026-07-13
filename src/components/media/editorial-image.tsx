import { cn } from '@/lib/utils';
import type { ImageView } from '@/lib/view-models';

/**
 * Editorial image renderer.
 *
 * Uses a native <img> with responsive srcSet and lazy loading so it works
 * uniformly for static placeholders, public CDN variants and short-lived signed
 * URLs (which next/image cannot cache well). Aspect ratio is reserved up front
 * to avoid cumulative layout shift, with a soft tone/blur placeholder behind.
 */
export function EditorialImage({
  image,
  sizes = '100vw',
  priority = false,
  className,
  imgClassName,
  rounded = false,
}: {
  image: ImageView;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  rounded?: boolean;
}) {
  const ratio =
    image.width && image.height ? `${image.width} / ${image.height}` : '3 / 2';

  return (
    <div
      className={cn('relative overflow-hidden bg-stone-soft/50', rounded && 'rounded-sm', className)}
      style={{
        aspectRatio: ratio,
        backgroundImage: image.blurDataUrl ? `url(${image.blurDataUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        alt={image.alt}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        // eslint-disable-next-line @next/next/no-img-element
        // @ts-expect-error fetchpriority is valid HTML but not yet in React types
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
        className={cn(
          'h-full w-full object-cover transition-transform duration-700 ease-editorial',
          imgClassName,
        )}
      />
    </div>
  );
}
