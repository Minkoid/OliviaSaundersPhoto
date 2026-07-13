'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitEnquiry, type EnquiryActionState } from '@/app/(site)/contact/actions';

const ENQUIRY_TYPES: { value: string; label: string }[] = [
  { value: 'WEDDING', label: 'Wedding' },
  { value: 'PORTRAIT', label: 'Portrait' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'EVENT', label: 'Event' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'EDITORIAL', label: 'Editorial' },
  { value: 'OTHER', label: 'Other' },
];

const initialState: EnquiryActionState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? 'Sending…' : 'Send enquiry'}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(submitEnquiry, initialState);

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="border border-hairline bg-parchment/60 p-10 text-center"
      >
        <p className="font-serif text-2xl text-ink">Thank you</p>
        <p className="mx-auto mt-4 max-w-measure font-sans text-sm leading-relaxed text-stone-deep">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === 'error' && state.message && (
        <p role="alert" className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          {state.message}
        </p>
      )}

      {/* Honeypot — visually hidden, not focusable */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input id="name" name="name" type="text" required className="field-input" autoComplete="name" />
          {state.fieldErrors?.name && <p className="field-error">{state.fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="field-input"
            autoComplete="email"
          />
          {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="field-label">
            Telephone <span className="normal-case tracking-normal text-stone">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className="field-input" autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="type" className="field-label">
            Enquiry type
          </label>
          <select id="type" name="type" className="field-input" defaultValue="WEDDING">
            {ENQUIRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="eventDate" className="field-label">
            Date <span className="normal-case tracking-normal text-stone">(if known)</span>
          </label>
          <input id="eventDate" name="eventDate" type="date" className="field-input" />
        </div>
        <div>
          <label htmlFor="location" className="field-label">
            Location <span className="normal-case tracking-normal text-stone">(optional)</span>
          </label>
          <input id="location" name="location" type="text" className="field-input" />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="field-label">
          Your message
        </label>
        <textarea id="message" name="message" required rows={6} className="field-input resize-y" />
        {state.fieldErrors?.message && <p className="field-error">{state.fieldErrors.message}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="font-sans text-xs text-stone-deep">
          Your details are used only to reply to your enquiry.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
