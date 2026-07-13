'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/admin/ui';
import {
  toggleGalleryPublish,
  toggleGalleryDisabled,
  deleteGallery,
  notifyGalleryClients,
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
  const [notice, setNotice] = useState<string | null>(null);
  const run = (fn: () => Promise<void>) => startTransition(async () => {
    await fn();
    router.refresh();
  });

  return (
    <div className="flex flex-wrap items-center gap-3 border border-hairline bg-parchment/20 px-5 py-4">
      <Badge tone={isDisabled ? 'danger' : isPublished ? 'success' : 'neutral'}>
        {isDisabled ? 'Disabled' : isPublished ? 'Live' : 'Draft'}
      </Badge>
      {notice && <span className="font-sans text-xs text-olive">{notice}</span>}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await notifyGalleryClients(id);
              setNotice(`Notified ${res.sent} client${res.sent === 1 ? '' : 's'}.`);
            })
          }
          className="btn-outline"
        >
          Notify clients
        </button>
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
