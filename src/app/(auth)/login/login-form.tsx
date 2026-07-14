'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { login, type LoginState } from './actions';

const initialState: LoginState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      {state.status === 'error' && state.message && (
        <p
          role="alert"
          className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field-input"
        />
      </div>

      <SubmitButton />

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/reset-password"
          className="font-sans text-xs uppercase tracking-widest text-stone-deep hover:text-charcoal"
        >
          Forgotten password?
        </Link>
      </div>
    </form>
  );
}
