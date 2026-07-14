import 'server-only';
import { prisma } from '@/lib/prisma';
import { generateToken, hashToken } from '@/lib/crypto';

/**
 * Single-use, expiring tokens for invitations, password resets and magic links.
 *
 * Only a HASH of the token is persisted; the raw token is embedded in the emailed
 * link. Tokens are consumed atomically to prevent reuse.
 */

export type TokenPurpose = 'RESET' | 'INVITE' | 'MAGIC' | 'VERIFY';

const TTL_MS: Record<TokenPurpose, number> = {
  RESET: 60 * 60 * 1000, // 1 hour
  INVITE: 72 * 60 * 60 * 1000, // 72 hours
  MAGIC: 15 * 60 * 1000, // 15 minutes
  VERIFY: 24 * 60 * 60 * 1000, // 24 hours
};

/** Create a token for a user and return the RAW token (for the emailed link). */
export async function createUserToken(params: {
  userId: string;
  email: string;
  purpose: TokenPurpose;
}): Promise<string> {
  const raw = generateToken(32);
  const hashed = hashToken(raw);
  const expires = new Date(Date.now() + TTL_MS[params.purpose]);

  // Invalidate any outstanding tokens of the same purpose for this identity.
  await prisma.verificationToken.deleteMany({
    where: { identifier: params.email.toLowerCase(), purpose: params.purpose, consumedAt: null },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: params.email.toLowerCase(),
      token: hashed,
      purpose: params.purpose,
      expires,
      userId: params.userId,
    },
  });

  return raw;
}

export interface VerifiedToken {
  id: string;
  userId: string | null;
  identifier: string;
  purpose: string;
}

/** Verify a raw token without consuming it. Returns null if invalid/expired. */
export async function verifyToken(raw: string, purpose: TokenPurpose): Promise<VerifiedToken | null> {
  const hashed = hashToken(raw);
  const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });
  if (!record) return null;
  if (record.purpose !== purpose) return null;
  if (record.consumedAt) return null;
  if (record.expires.getTime() < Date.now()) return null;
  return {
    id: record.id,
    userId: record.userId,
    identifier: record.identifier,
    purpose: record.purpose,
  };
}

/** Atomically consume a token. Returns false if it was already consumed. */
export async function consumeToken(id: string): Promise<boolean> {
  const result = await prisma.verificationToken.updateMany({
    where: { id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return result.count === 1;
}
