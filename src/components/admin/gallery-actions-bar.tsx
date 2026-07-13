'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/admin/ui';
import {
  toggleGalleryPublish,
  toggleGalleryDisabled,
  deleteGallery,
} from '@/app/admin/galleries/actions';

export function GalleryActionsBar({
  id,
  isPublished,
  isDisabled,
}: {
  id: string;
  isPublished: boolean;
  isDisabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(async () => {
    await fn();
    router.refresh();
  });

  return (
    <div className="flex flex-wrap items-center gap-3 border border-hairline bg-parchment/20 px-5 py-4">
      <Badge tone={isDisabled ? 'danger' : isPublished ? 'success' : 'neutral'}>
        {isDisabled ? 'Disabled' : isPublished ? 'Live' : 'Draft'}
      </Badge>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleGalleryPublish(id, !isPublished))}
          className="btn-outline"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleGalleryDisabled(id, !isDisabled))}
          className="btn-outline"
        >
          {isDisabled ? 'Enable access' : 'Disable access'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm('Delete this gallery? Clients will lose access.')) {
              startTransition(async () => {
                await deleteGallery(id);
              });
            }
          }}
          className="btn-quiet text-burgundy"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
