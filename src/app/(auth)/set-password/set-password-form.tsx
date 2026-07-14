'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { setPassword, type SetPasswordState } from './actions';

const initialState: SetPasswordState = { status: 'idle' };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function SetPasswordForm({ token, mode }: { token: string; mode: 'reset' | 'invite' }) {
  const [state, formAction] = useFormState(setPassword, initialState);

  if (state.status === 'success') {
    return (
      <div className="border border-hairline bg-parchment/50 p-8 text-center">
        <p className="font-serif text-2xl text-ink">All set</p>
        <p className="mx-auto mt-3 max-w-measure font-sans text-sm text-stone-deep">{state.message}</p>
        <Link href="/login" className="mt-6 inline-block btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && state.message && (
        <p role="alert" className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="password" className="field-label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="field-input"
        />
        {state.fieldErrors?.password && <p className="field-error">{state.fieldErrors.password}</p>}
        <p className="mt-2 font-sans text-xs text-stone-deep">
          At least 10 characters, with upper and lower case letters and a number.
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="field-input"
        />
        {state.fieldErrors?.confirm && <p className="field-error">{state.fieldErrors.confirm}</p>}
      </div>
      <SubmitButton label={mode === 'invite' ? 'Set password' : 'Update password'} />
    </form>
  );
}
