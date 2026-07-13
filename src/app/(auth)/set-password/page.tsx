import type { Metadata } from 'next';
import Link from 'next/link';
import { SetPasswordForm } from './set-password-form';

export const metadata: Metadata = {
  title: 'Set Password',
  robots: { index: false, follow: false },
};

export default function SetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; mode?: string };
}) {
  const token = searchParams.token;
  const mode = searchParams.mode === 'reset' ? 'reset' : 'invite';

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-display-md">Invalid link</h1>
        <p className="mt-4 font-sans text-sm text-stone-deep">
          This link is missing its token. Please use the link from your email, or request a new one.
        </p>
        <Link href="/reset-password" className="mt-6 inline-block btn-outline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">{mode === 'invite' ? 'Welcome' : 'Account'}</p>
      <h1 className="mt-4 text-display-md">
        {mode === 'invite' ? 'Set your password' : 'Choose a new password'}
      </h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-stone-deep">
        {mode === 'invite'
          ? 'Create a password to access the galleries prepared for you.'
          : 'Enter a new password for your account.'}
      </p>
      <div className="mt-8">
        <SetPasswordForm token={token} mode={mode} />
      </div>
    </div>
  );
}
