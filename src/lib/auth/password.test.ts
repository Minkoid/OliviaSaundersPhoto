import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, passwordSchema } from './password';

describe('password hashing', () => {
  it('hashes and verifies correctly', async () => {
    const hash = await hashPassword('Str0ngPassword');
    expect(hash).not.toBe('Str0ngPassword');
    expect(await verifyPassword('Str0ngPassword', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for a malformed hash rather than throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts strong passwords and rejects weak ones', () => {
    expect(passwordSchema.safeParse('Str0ngPassword').success).toBe(true);
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('alllowercase123').success).toBe(false);
    expect(passwordSchema.safeParse('NoNumbersHere').success).toBe(false);
  });
});
