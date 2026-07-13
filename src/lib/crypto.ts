import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/**
 * Server-only cryptographic helpers. Kept out of `utils.ts` so client bundles
 * never pull in `node:crypto`.
 */

/**
 * One-way hash of an IP address for privacy-conscious logging. We never store
 * raw client IPs; only a salted digest for coarse abuse detection.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? 'olivia-saunders-fallback-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Cryptographically strong random token (raw, url-safe). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Deterministic hash of a token for storage (never store raw tokens). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
