import { describe, it, expect } from 'vitest';
import { enquirySchema, loginSchema, setPasswordSchema, gallerySchema } from './validation';

describe('enquirySchema', () => {
  it('accepts a valid enquiry', () => {
    const result = enquirySchema.safeParse({
      name: 'Charlotte',
      email: 'c@example.com',
      type: 'WEDDING',
      message: 'We would love to talk about coverage for next summer.',
    });
    expect(result.success).toBe(true);
  });
  it('rejects an invalid email', () => {
    const result = enquirySchema.safeParse({ name: 'A', email: 'nope', message: 'x'.repeat(20) });
    expect(result.success).toBe(false);
  });
  it('rejects a short message', () => {
    const result = enquirySchema.safeParse({ name: 'Ann', email: 'a@b.co', message: 'hi' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires an email and password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('setPasswordSchema', () => {
  it('enforces password strength and matching confirmation', () => {
    const good = setPasswordSchema.safeParse({
      token: 'a'.repeat(12),
      password: 'Str0ngPassword',
      confirm: 'Str0ngPassword',
    });
    expect(good.success).toBe(true);

    const mismatch = setPasswordSchema.safeParse({
      token: 'a'.repeat(12),
      password: 'Str0ngPassword',
      confirm: 'Different1X',
    });
    expect(mismatch.success).toBe(false);

    const weak = setPasswordSchema.safeParse({
      token: 'a'.repeat(12),
      password: 'weak',
      confirm: 'weak',
    });
    expect(weak.success).toBe(false);
  });
});

describe('gallerySchema', () => {
  it('coerces permission booleans and requires a title/client', () => {
    const result = gallerySchema.safeParse({
      title: 'Eleanor & James',
      clientName: 'Eleanor & James',
      allowImageDownload: true,
    });
    expect(result.success).toBe(true);
  });
  it('rejects an invalid slug', () => {
    const result = gallerySchema.safeParse({
      title: 'A',
      clientName: 'B',
      slug: 'Not A Slug',
    });
    expect(result.success).toBe(false);
  });
});
