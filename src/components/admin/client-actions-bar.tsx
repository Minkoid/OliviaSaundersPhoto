'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/admin/ui';
import {
  resendInvitation,
  resetClientAccess,
  toggleClientActive,
} from '@/app/admin/clients/actions';

export function ClientActionsBar({
  id,
  isActive,
  hasPassword,
}: {
  id: string;
  isActive: boolean;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const run = (fn: () => Promise<void>, message: string) =>
    startTransition(async () => {
      await fn();
      setNotice(message);
      router.refresh();
    });

  return (
    <div className="border border-hairline bg-parchment/20 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={isActive ? 'success' : 'neutral'}>
          {isActive ? 'Active' : hasPassword ? 'Disabled' : 'Invited'}
        </Badge>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {!hasPassword && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => resendInvitation(id), 'Invitation re-sent.')}
              className="btn-outline"
            >
              Resend invitation
            </button>
          )}
          {hasPassword && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => resetClientAccess(id), 'A password reset link has been sent.')}
              className="btn-outline"
            >
              Reset access
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => toggleClientActive(id, !isActive),
                isActive ? 'Access disabled.' : 'Access enabled.',
              )
            }
            className="btn-quiet"
          >
            {isActive ? 'Disable access' : 'Enable access'}
          </button>
        </div>
      </div>
      {notice && <p className="mt-3 font-sans text-xs text-olive">{notice}</p>}
    </div>
  );
}
