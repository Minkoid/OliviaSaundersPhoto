import { describe, it, expect } from 'vitest';
import { slugify, formatFileSize, isExpired, daysUntil, formatDate } from './utils';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Country Life')).toBe('country-life');
  });
  it('strips accents and punctuation', () => {
    expect(slugify('Éléonore & James!')).toBe('eleonore-james');
  });
  it('collapses whitespace and trims hyphens', () => {
    expect(slugify('  a   b  ')).toBe('a-b');
  });
});

describe('formatFileSize', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('isExpired', () => {
  it('is false for null/future and true for past', () => {
    expect(isExpired(null)).toBe(false);
    expect(isExpired(new Date(Date.now() + 10_000))).toBe(false);
    expect(isExpired(new Date(Date.now() - 10_000))).toBe(true);
  });
});

describe('daysUntil', () => {
  it('returns null for no date and a positive number for the future', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))).toBeGreaterThanOrEqual(2);
  });
});

describe('formatDate', () => {
  it('formats a date in en-GB long form', () => {
    expect(formatDate(new Date('2025-06-14T12:00:00Z'))).toContain('June');
    expect(formatDate(null)).toBe('');
  });
});
