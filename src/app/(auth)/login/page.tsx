import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { getCurrentUser } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Client Login',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/account');

  return (
    <div>
      <p className="eyebrow">Client access</p>
      <h1 className="mt-4 text-display-md">Welcome back</h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-stone-deep">
        Sign in to view the galleries prepared for you.
      </p>

      {searchParams.error === 'disabled' && (
        <p className="mt-6 border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          This account is not currently active. Please contact the studio.
        </p>
      )}

      <div className="mt-8">
        <LoginForm callbackUrl={searchParams.callbackUrl} />
      </div>
    </div>
  );
}
