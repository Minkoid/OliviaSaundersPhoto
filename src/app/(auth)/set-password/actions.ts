'use server';

import { prisma } from '@/lib/prisma';
import { setPasswordSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/password';
import { verifyToken, consumeToken } from '@/lib/auth/tokens';
import { recordAudit } from '@/lib/audit';

export interface SetPasswordState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Consume an INVITE or RESET token and set a new password. The token is verified
 * and consumed atomically; on success the account is activated and its email
 * marked verified.
 */
export async function setPassword(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: 'error', message: 'Please review the fields below.', fieldErrors };
  }

  const { token, password } = parsed.data;

  // Accept either an invite or a reset token.
  const verified =
    (await verifyToken(token, 'RESET')) ?? (await verifyToken(token, 'INVITE'));
  if (!verified || !verified.userId) {
    return {
      status: 'error',
      message: 'This link is invalid or has expired. Please request a new one.',
    };
  }

  const consumed = await consumeToken(verified.id);
  if (!consumed) {
    return { status: 'error', message: 'This link has already been used.' };
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: verified.userId },
      data: { passwordHash, emailVerified: new Date(), isActive: true },
    });
    await recordAudit({
      action: verified.purpose === 'INVITE' ? 'CLIENT_ACCESS_RESET' : 'PASSWORD_RESET_COMPLETED',
      actorId: verified.userId,
    });
  } catch (err) {
    console.error('[set-password] error', err);
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }

  return {
    status: 'success',
    message: 'Your password has been set. You can now sign in.',
  };
}
