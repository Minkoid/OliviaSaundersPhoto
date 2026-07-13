'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/admin/ui';
import { updateEnquiryStatus } from '@/app/admin/enquiries/actions';
import { formatDate } from '@/lib/utils';

export interface EnquiryView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: string;
  eventDate: string | null;
  location: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export function EnquiryRow({ enquiry }: { enquiry: EnquiryView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const setStatus = (status: string) =>
    startTransition(async () => {
      await updateEnquiryStatus(enquiry.id, status);
      router.refresh();
    });

  const tone = enquiry.status === 'NEW' ? 'danger' : enquiry.status === 'READ' ? 'warning' : 'neutral';

  return (
    <div className="border border-hairline bg-white/40">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && enquiry.status === 'NEW') setStatus('READ');
        }}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-serif text-lg text-ink">{enquiry.name}</p>
          <p className="truncate font-sans text-xs text-stone-deep">
            {enquiry.type.toLowerCase()} · {formatDate(enquiry.createdAt)}
          </p>
        </div>
        <Badge tone={tone}>{enquiry.status.toLowerCase()}</Badge>
      </button>

      {open && (
        <div className="border-t border-hairline px-5 py-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="field-label">Email</dt>
              <dd>
                <a href={`mailto:${enquiry.email}`} className="link-underline font-sans text-sm">
                  {enquiry.email}
                </a>
              </dd>
            </div>
            {enquiry.phone && (
              <div>
                <dt className="field-label">Phone</dt>
                <dd className="font-sans text-sm text-charcoal">{enquiry.phone}</dd>
              </div>
            )}
            {enquiry.eventDate && (
              <div>
                <dt className="field-label">Date</dt>
                <dd className="font-sans text-sm text-charcoal">{formatDate(enquiry.eventDate)}</dd>
              </div>
            )}
            {enquiry.location && (
              <div>
                <dt className="field-label">Location</dt>
                <dd className="font-sans text-sm text-charcoal">{enquiry.location}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            <dt className="field-label">Message</dt>
            <p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-charcoal">
              {enquiry.message}
            </p>
          </div>
          <div className="mt-5 flex gap-3">
            <a href={`mailto:${enquiry.email}`} className="btn-outline">
              Reply
            </a>
            {enquiry.status !== 'ARCHIVED' ? (
              <button type="button" onClick={() => setStatus('ARCHIVED')} disabled={pending} className="btn-quiet">
                Archive
              </button>
            ) : (
              <button type="button" onClick={() => setStatus('READ')} disabled={pending} className="btn-quiet">
                Unarchive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
