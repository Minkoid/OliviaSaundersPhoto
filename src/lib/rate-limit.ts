import { getServerEnv } from '@/lib/env';

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for a single instance / development. For multi-instance production,
 * swap the store for Upstash Redis or similar (the interface is intentionally
 * small — see README). Fails open only when rate limiting is disabled via env.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically clear expired buckets to avoid unbounded growth.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Unique key, e.g. `login:${ipHash}`. */
  key: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const env = getServerEnv();
  if (!env.RATE_LIMIT_ENABLED) {
    return { success: true, remaining: limit, resetAt: Date.now() + windowMs };
  }

  sweep();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Common presets.
export const RATE_LIMITS = {
  login: { limit: 8, windowMs: 15 * 60_000 },
  passwordReset: { limit: 5, windowMs: 30 * 60_000 },
  enquiry: { limit: 6, windowMs: 60 * 60_000 },
  galleryPassword: { limit: 10, windowMs: 15 * 60_000 },
} as const;
