'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/admin/ui';
import { togglePortfolioPublish, deletePortfolio } from '@/app/admin/portfolios/actions';

export function PortfolioActionsBar({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-4 border border-hairline bg-parchment/20 px-5 py-4">
      <Badge tone={isPublished ? 'success' : 'neutral'}>{isPublished ? 'Published' : 'Draft'}</Badge>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await togglePortfolioPublish(id, !isPublished);
              router.refresh();
            })
          }
          className="btn-outline"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm('Delete this portfolio? It will be removed from the site.')) {
              startTransition(async () => {
                await deletePortfolio(id);
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
