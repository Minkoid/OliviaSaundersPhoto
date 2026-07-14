'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { unlockGallery, type UnlockState } from '@/app/(client)/gallery/[slug]/actions';

const initialState: UnlockState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Unlocking…' : 'Enter gallery'}
    </button>
  );
}

export function UnlockForm({ slug, title }: { slug: string; title: string }) {
  const action = unlockGallery.bind(null, slug);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div className="mx-auto max-w-md py-24">
      <div className="text-center">
        <p className="eyebrow">Protected gallery</p>
        <h1 className="mt-4 text-display-md">{title}</h1>
        <p className="mt-4 font-sans text-sm leading-relaxed text-stone-deep">
          This gallery is protected with an additional password. Please enter it to continue.
        </p>
      </div>
      <form action={formAction} className="mt-10 space-y-5" noValidate>
        {state.status === 'error' && state.message && (
          <p role="alert" className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
            {state.message}
          </p>
        )}
        <div>
          <label htmlFor="password" className="field-label">
            Gallery password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="off"
            className="field-input"
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
