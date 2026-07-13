'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { requestReset, type ResetRequestState } from './actions';

const initialState: ResetRequestState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  );
}

export function ResetForm() {
  const [state, formAction] = useFormState(requestReset, initialState);

  if (state.status === 'sent') {
    return (
      <div className="border border-hairline bg-parchment/50 p-8 text-center">
        <p className="font-serif text-2xl text-ink">Check your inbox</p>
        <p className="mx-auto mt-3 max-w-measure font-sans text-sm text-stone-deep">
          {state.message}
        </p>
        <Link href="/login" className="mt-6 inline-block btn-quiet">
          Back to sign in
        </Link>
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
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input" />
      </div>
      <SubmitButton />
      <Link href="/login" className="block pt-2 text-center btn-quiet">
        Back to sign in
      </Link>
    </form>
  );
}
