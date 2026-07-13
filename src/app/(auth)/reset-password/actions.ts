'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { requestResetSchema } from '@/lib/validation';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { hashIp } from '@/lib/crypto';
import { createUserToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/email/mailer';
import { passwordResetEmail } from '@/lib/email/templates';
import { getAppUrl } from '@/lib/env';
import { recordAudit } from '@/lib/audit';

export interface ResetRequestState {
  status: 'idle' | 'sent' | 'error';
  message?: string;
}

/**
 * Request a password reset. Always returns the same neutral "sent" response
 * whether or not the account exists (no user enumeration). Rate-limited per IP.
 */
export async function requestReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = requestResetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }
  const email = parsed.data.email.toLowerCase();

  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ipHash = hashIp(ip);
  const limited = rateLimit({ key: `reset:${ipHash ?? 'unknown'}`, ...RATE_LIMITS.passwordReset });
  if (!limited.success) {
    return { status: 'error', message: 'Too many requests. Please try again later.' };
  }

  const neutral: ResetRequestState = {
    status: 'sent',
    message:
      'If an account exists for that address, a reset link has been sent. Please check your inbox.',
  };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive && !user.deletedAt) {
      const raw = await createUserToken({ userId: user.id, email, purpose: 'RESET' });
      const resetUrl = `${getAppUrl()}/set-password?token=${raw}&mode=reset`;
      await sendEmail({ to: email, ...passwordResetEmail({ resetUrl }) });
      await recordAudit({ action: 'PASSWORD_RESET_REQUESTED', actorId: user.id, ipHash });
    }
  } catch (err) {
    console.error('[reset] error', err);
  }

  return neutral;
}
