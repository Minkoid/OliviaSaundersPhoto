'use server';

import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { signIn } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { hashIp } from '@/lib/crypto';
import { recordAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export interface LoginState {
  status: 'idle' | 'error';
  message?: string;
}

/**
 * Credentials sign-in. Rate-limited per IP. Returns a single generic error for
 * all failure modes to avoid user enumeration. On success, Auth.js issues a
 * redirect (surfaced as a thrown redirect error, which we re-throw).
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter your email and password.' };
  }
  const { email, password, callbackUrl } = parsed.data;

  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ipHash = hashIp(ip);

  const limited = rateLimit({ key: `login:${ipHash ?? 'unknown'}`, ...RATE_LIMITS.login });
  if (!limited.success) {
    return {
      status: 'error',
      message: 'Too many attempts. Please wait a few minutes and try again.',
    };
  }

  // Resolve a safe post-login destination based on the account role.
  let redirectTo = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/account';

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, role: true },
    });
    if (user && !callbackUrl) {
      redirectTo = user.role === 'ADMIN' ? '/admin' : '/account';
    }

    await signIn('credentials', { email, password, redirectTo });
    return { status: 'idle' };
  } catch (error) {
    if (isRedirectError(error)) {
      // Successful sign-in — record and let the redirect propagate.
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      await recordAudit({ action: 'USER_LOGIN', actorId: user?.id, ipHash });
      throw error;
    }
    if (error instanceof AuthError) {
      await recordAudit({ action: 'USER_LOGIN_FAILED', target: `email:${email}`, ipHash });
      return { status: 'error', message: 'Invalid email or password.' };
    }
    console.error('[login] unexpected error', error);
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}
