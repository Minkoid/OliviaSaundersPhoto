import bcrypt from 'bcryptjs';
import { z } from 'zod';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password. bcrypt is used for broad portability across
 * serverless runtimes. For a single self-hosted deployment, argon2id is an
 * excellent alternative (see README security notes).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Password policy: at least 10 characters with a mix of character classes.
 * Applied to admin and client account creation / reset flows.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(200, 'Password is too long')
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v), {
    message: 'Use upper and lower case letters and at least one number',
  });
