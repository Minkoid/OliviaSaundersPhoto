import { describe, it, expect, beforeAll } from 'vitest';
import { rateLimit } from './rate-limit';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-value-1234567890';
  process.env.DATABASE_URL = 'postgresql://localhost/test';
  process.env.RATE_LIMIT_ENABLED = 'true';
});

describe('rateLimit', () => {
  it('allows requests up to the limit then blocks', () => {
    const key = `test-${Math.random()}`;
    const opts = { key, limit: 3, windowMs: 60_000 };
    expect(rateLimit(opts).success).toBe(true);
    expect(rateLimit(opts).success).toBe(true);
    const third = rateLimit(opts);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
    expect(rateLimit(opts).success).toBe(false);
  });

  it('tracks separate keys independently', () => {
    const a = rateLimit({ key: `a-${Math.random()}`, limit: 1, windowMs: 60_000 });
    const b = rateLimit({ key: `b-${Math.random()}`, limit: 1, windowMs: 60_000 });
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});
