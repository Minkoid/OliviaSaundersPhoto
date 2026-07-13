'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { toggleFavourite } from '@/app/(client)/gallery/[slug]/actions';
import type { GalleryDetailView, GalleryImageView } from '@/lib/gallery';

/**
 * Interactive client gallery: an editorial masonry grid with a full-screen
 * lightbox. Supports keyboard navigation, mobile swipe, favourites (persisted
 * via a server action with authorisation) and permitted downloads.
 */
export function GalleryExperience({ gallery }: { gallery: GalleryDetailView }) {
  const [images, setImages] = useState<GalleryImageView[]>(gallery.images);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showFavesOnly, setShowFavesOnly] = useState(false);
  const [, startTransition] = useTransition();

  const favouriteCount = images.filter((i) => i.isFavourite).length;
  const visible = showFavesOnly ? images.filter((i) => i.isFavourite) : images;

  const onToggleFavourite = useCallback((id: string) => {
    // Optimistic update; reconcile with server result.
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isFavourite: !img.isFavourite } : img)),
    );
    startTransition(async () => {
      const res = await toggleFavourite(id);
      if (!res.ok) {
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, isFavourite: !img.isFavourite } : img)),
        );
      } else if (typeof res.favourite === 'boolean') {
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, isFavourite: res.favourite! } : img)),
        );
      }
    });
  }, []);

  const openAt = (id: string) => {
    const idx = visible.findIndex((i) => i.id === id);
    if (idx >= 0) setActiveIndex(idx);
  };
  const close = () => setActiveIndex(null);
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? i : (i + 1) % visible.length)),
    [visible.length],
  );
  const prev = useCallback(
    () => setActiveIndex((i) => (i === null ? i : (i - 1 + visible.length) % visible.length)),
    [visible.length],
  );

  if (images.length === 0) {
    return (
      <div className="container-shell py-section text-center">
        <p className="font-serif text-2xl text-stone-deep">
          Your photographs are being prepared and will appear here soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="container-shell mb-10 flex flex-wrap items-center justify-between gap-4">
        <p className="font-sans text-xs uppercase tracking-widest text-stone-deep">
          {images.length} photographs
          {favouriteCount > 0 && ` · ${favouriteCount} favourite${favouriteCount === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center gap-3">
          {favouriteCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFavesOnly((v) => !v)}
              className={cn(
                'border px-4 py-2 font-sans text-xs uppercase tracking-widest transition-colors',
                showFavesOnly
                  ? 'border-olive bg-olive text-ivory'
                  : 'border-charcoal/40 text-charcoal hover:border-charcoal',
              )}
              aria-pressed={showFavesOnly}
            >
              {showFavesOnly ? 'Showing favourites' : 'Favourites only'}
            </button>
          )}
          {gallery.allowGalleryDownload && (
            <a
              href={`/api/download/gallery/${gallery.slug}?res=web`}
              className="border border-charcoal/40 px-4 py-2 font-sans text-xs uppercase tracking-widest text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Download all
            </a>
          )}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="container-shell">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {visible.map((image) => (
            <GalleryTile
              key={image.id}
              image={image}
              showNumber={gallery.showImageNumbers}
              onOpen={() => openAt(image.id)}
              onToggleFavourite={() => onToggleFavourite(image.id)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null && visible[activeIndex] && (
        <Lightbox
          image={visible[activeIndex]!}
          index={activeIndex}
          total={visible.length}
          gallery={gallery}
          onClose={close}
          onNext={next}
          onPrev={prev}
          onToggleFavourite={() => onToggleFavourite(visible[activeIndex]!.id)}
        />
      )}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 20.5s-7.5-4.7-9.6-9.2C1 8.4 2.4 5.5 5.3 5.1c1.9-.3 3.6.8 4.7 2.2C11.1 5.9 12.8 4.8 14.7 5.1c2.9.4 4.3 3.3 2.9 6.2C19.5 15.8 12 20.5 12 20.5z" />
    </svg>
  );
}

function GalleryTile({
  image,
  showNumber,
  onOpen,
  onToggleFavourite,
}: {
  image: GalleryImageView;
  showNumber: boolean;
  onOpen: () => void;
  onToggleFavourite: () => void;
}) {
  return (
    <div className="group relative break-inside-avoid overflow-hidden bg-stone-soft/40">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full"
        aria-label={`View ${image.alt || 'photograph'}${showNumber ? ` (number ${image.number})` : ''}`}
      >
        <img
          src={image.thumb}
          srcSet={image.srcSet}
          sizes="(min-width: 1024px) 30rem, (min-width: 640px) 45vw, 100vw"
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          style={{
            aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
            backgroundImage: image.blurDataUrl ? `url(${image.blurDataUrl})` : undefined,
            backgroundSize: 'cover',
          }}
        />
      </button>

      {showNumber && (
        <span className="pointer-events-none absolute left-3 top-3 bg-ink/50 px-2 py-1 font-sans text-[10px] tracking-widest text-ivory">
          {String(image.number).padStart(2, '0')}
        </span>
      )}

      <button
        type="button"
        onClick={onToggleFavourite}
        aria-pressed={image.isFavourite}
        aria-label={image.isFavourite ? 'Remove favourite' : 'Add favourite'}
        className={cn(
          'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/80 backdrop-blur transition',
          image.isFavourite ? 'text-burgundy' : 'text-charcoal opacity-0 group-hover:opacity-100',
          'focus-visible:opacity-100',
        )}
      >
        <HeartIcon filled={image.isFavourite} />
      </button>
    </div>
  );
}

function Lightbox({
  image,
  index,
  total,
  gallery,
  onClose,
  onNext,
  onPrev,
  onToggleFavourite,
}: {
  image: GalleryImageView;
  index: number;
  total: number;
  gallery: GalleryDetailView;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavourite: () => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNext, onPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) onNext();
      else onPrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${total}`}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95 animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-6 py-4 text-ivory">
        <span className="font-sans text-xs uppercase tracking-widest text-ivory/70">
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-pressed={image.isFavourite}
            aria-label={image.isFavourite ? 'Remove favourite' : 'Add favourite'}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-ivory/10',
              image.isFavourite ? 'text-burgundy' : 'text-ivory',
            )}
          >
            <HeartIcon filled={image.isFavourite} />
          </button>
          {image.canDownload && (
            <a
              href={`/api/download/image/${image.id}?res=web`}
              className="rounded-full px-4 py-2 font-sans text-xs uppercase tracking-widest text-ivory transition hover:bg-ivory/10"
            >
              Download
            </a>
          )}
          {image.canDownload && gallery.allowFullResolution && (
            <a
              href={`/api/download/image/${image.id}?res=full`}
              className="rounded-full px-4 py-2 font-sans text-xs uppercase tracking-widest text-ivory transition hover:bg-ivory/10"
            >
              Full resolution
            </a>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ivory transition hover:bg-ivory/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous photograph"
          className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-ivory transition hover:bg-ivory/10 md:left-6"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <figure className="flex max-h-full max-w-6xl flex-col items-center">
          <img
            src={image.display}
            srcSet={image.srcSet}
            sizes="100vw"
            alt={image.alt}
            className="max-h-[78vh] w-auto object-contain"
          />
          {image.caption && (
            <figcaption className="mt-4 text-center font-sans text-xs uppercase tracking-widest text-ivory/70">
              {image.caption}
            </figcaption>
          )}
        </figure>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next photograph"
          className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-ivory transition hover:bg-ivory/10 md:right-6"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
