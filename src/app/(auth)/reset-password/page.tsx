import type { Metadata } from 'next';
import { ResetForm } from './reset-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 text-display-md">Reset your password</h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-stone-deep">
        Enter the email address associated with your account and we will send you a link to choose a
        new password.
      </p>
      <div className="mt-8">
        <ResetForm />
      </div>
    </div>
  );
}
