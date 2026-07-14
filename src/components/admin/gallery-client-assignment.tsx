'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignClientToGallery, revokeClientFromGallery } from '@/app/admin/galleries/actions';

interface ClientOption {
  id: string;
  name: string;
  email: string;
}

export function GalleryClientAssignment({
  galleryId,
  assigned,
  allClients,
}: {
  galleryId: string;
  assigned: ClientOption[];
  allClients: ClientOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assigned.map((a) => a.id));
  const available = allClients.filter((c) => !assignedIds.has(c.id));

  const assign = () => {
    if (!selected) return;
    startTransition(async () => {
      await assignClientToGallery(galleryId, selected);
      setSelected('');
      router.refresh();
    });
  };

  const revoke = (userId: string) => {
    startTransition(async () => {
      await revokeClientFromGallery(galleryId, userId);
      router.refresh();
    });
  };

  return (
    <div>
      {assigned.length === 0 ? (
        <p className="font-sans text-sm text-stone-deep">No clients assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {assigned.map((client) => (
            <li
              key={client.id}
              className="flex items-center justify-between border border-hairline bg-white/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-sans text-sm text-charcoal">{client.name}</p>
                <p className="truncate font-sans text-xs text-stone-deep">{client.email}</p>
              </div>
              <button
                type="button"
                onClick={() => revoke(client.id)}
                disabled={pending}
                className="font-sans text-xs uppercase tracking-widest text-burgundy hover:text-ink"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="field-input flex-1"
          aria-label="Select a client to assign"
        >
          <option value="">Select a client…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
        <button type="button" onClick={assign} disabled={pending || !selected} className="btn-outline">
          Assign
        </button>
      </div>
      {available.length === 0 && allClients.length > 0 && (
        <p className="mt-2 font-sans text-xs text-stone-deep">All clients are already assigned.</p>
      )}
      {allClients.length === 0 && (
        <p className="mt-2 font-sans text-xs text-stone-deep">
          No client accounts yet. Create one under Clients first.
        </p>
      )}
    </div>
  );
}
