'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface ManagedImage {
  id: string;
  url: string;
  caption: string | null;
  altText: string | null;
  isFeatured?: boolean;
  isCover?: boolean;
}

export interface ImageManagerActions {
  onReorder: (ids: string[]) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onSaveMeta: (imageId: string, formData: FormData) => Promise<unknown>;
  onSetCover?: (imageId: string) => Promise<void>;
  onToggleFeatured?: (imageId: string, featured: boolean) => Promise<void>;
}

/**
 * Grid manager for portfolio/gallery images: reorder (move up/down), set cover,
 * toggle featured, edit caption/alt text, and delete. Reordering is applied
 * locally then persisted with "Save order".
 */
export function ImageManager({
  images: initial,
  showFeatured = false,
  showCover = true,
  actions,
}: {
  images: ManagedImage[];
  showFeatured?: boolean;
  showCover?: boolean;
  actions: ImageManagerActions;
}) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    setImages(next);
    setDirty(true);
  };

  const saveOrder = () => {
    startTransition(async () => {
      await actions.onReorder(images.map((i) => i.id));
      setDirty(false);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm('Delete this photograph? This cannot be undone.')) return;
    startTransition(async () => {
      await actions.onDelete(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    });
  };

  const saveMeta = (id: string, form: HTMLFormElement) => {
    const formData = new FormData(form);
    startTransition(async () => {
      await actions.onSaveMeta(id, formData);
      setEditing(null);
      router.refresh();
    });
  };

  if (images.length === 0) {
    return (
      <p className="border border-dashed border-hairline p-8 text-center font-sans text-sm text-stone-deep">
        No photographs yet. Upload some above to begin.
      </p>
    );
  }

  return (
    <div>
      {dirty && (
        <div className="mb-4 flex items-center justify-between border border-olive/40 bg-olive/5 px-4 py-3">
          <p className="font-sans text-sm text-olive">You have reordered images.</p>
          <button type="button" onClick={saveOrder} disabled={pending} className="btn-primary">
            {pending ? 'Saving…' : 'Save order'}
          </button>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="group border border-hairline bg-white/40">
            <div className="relative aspect-square overflow-hidden bg-stone-soft/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText ?? ''} className="h-full w-full object-cover" />
              {image.isCover && (
                <span className="absolute left-2 top-2 bg-charcoal px-2 py-1 font-sans text-[10px] uppercase tracking-widest text-ivory">
                  Cover
                </span>
              )}
              {image.isFeatured && (
                <span className="absolute right-2 top-2 bg-olive px-2 py-1 font-sans text-[10px] uppercase tracking-widest text-ivory">
                  Featured
                </span>
              )}
            </div>

            <div className="p-3">
              {editing === image.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMeta(image.id, e.currentTarget);
                  }}
                  className="space-y-2"
                >
                  <input
                    name="caption"
                    defaultValue={image.caption ?? ''}
                    placeholder="Caption"
                    className="field-input !py-2 !text-xs"
                  />
                  <input
                    name="altText"
                    defaultValue={image.altText ?? ''}
                    placeholder="Alt text (accessibility)"
                    className="field-input !py-2 !text-xs"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary !px-3 !py-1.5 !text-[10px]">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="btn-quiet !text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="truncate font-sans text-xs text-charcoal" title={image.caption ?? ''}>
                    {image.caption || <span className="text-stone">No caption</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="text-stone-deep hover:text-charcoal disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label="Move down"
                      className="text-stone-deep hover:text-charcoal disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(image.id)}
                      className="font-sans text-[10px] uppercase tracking-widest text-stone-deep hover:text-charcoal"
                    >
                      Edit
                    </button>
                    {showCover && actions.onSetCover && (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await actions.onSetCover!(image.id);
                            router.refresh();
                          })
                        }
                        className={cn(
                          'font-sans text-[10px] uppercase tracking-widest hover:text-charcoal',
                          image.isCover ? 'text-olive' : 'text-stone-deep',
                        )}
                      >
                        Cover
                      </button>
                    )}
                    {showFeatured && actions.onToggleFeatured && (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await actions.onToggleFeatured!(image.id, !image.isFeatured);
                            router.refresh();
                          })
                        }
                        className={cn(
                          'font-sans text-[10px] uppercase tracking-widest hover:text-charcoal',
                          image.isFeatured ? 'text-olive' : 'text-stone-deep',
                        )}
                      >
                        Feature
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(image.id)}
                      className="font-sans text-[10px] uppercase tracking-widest text-burgundy hover:text-ink"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
