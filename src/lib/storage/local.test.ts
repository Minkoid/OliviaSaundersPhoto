import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalStorageService } from './local';

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'os-storage-'));
  process.env.AUTH_SECRET = 'test-secret-value-1234567890';
  process.env.DATABASE_URL = 'postgresql://localhost/test';
  process.env.LOCAL_STORAGE_DIR = tmpDir;
  process.env.SIGNED_URL_TTL_SECONDS = '300';
  process.env.STORAGE_DRIVER = 'local';
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('LocalStorageService', () => {
  it('uploads, reads back and deletes an object', async () => {
    const storage = new LocalStorageService();
    const body = Buffer.from('hello world');
    await storage.uploadOriginal({ key: 'originals/x/original.jpg', body, contentType: 'image/jpeg' });
    const read = await storage.getObjectBytes('private', 'originals/x/original.jpg');
    expect(read.toString()).toBe('hello world');
    await storage.deleteFile('private', 'originals/x/original.jpg');
    // Deleting a missing object should not throw.
    await expect(storage.deleteFile('private', 'originals/x/original.jpg')).resolves.toBeUndefined();
  });

  it('produces signed view URLs that verify, and rejects tampering/expiry', async () => {
    const storage = new LocalStorageService();
    const url = await storage.getSignedViewUrl('private', 'variants/y/display.webp');
    const params = new URL(url).searchParams;
    const expires = Number(params.get('expires'));
    const sig = params.get('sig')!;

    expect(storage.verify('private', 'variants/y/display.webp', expires, sig)).toBe(true);
    // Tampered signature
    expect(storage.verify('private', 'variants/y/display.webp', expires, 'deadbeef')).toBe(false);
    // Tampered key
    expect(storage.verify('private', 'variants/other/display.webp', expires, sig)).toBe(false);
    // Expired
    expect(storage.verify('private', 'variants/y/display.webp', Date.now() - 1000, sig)).toBe(false);
  });

  it('binds the download filename into the signature', async () => {
    const storage = new LocalStorageService();
    const url = await storage.getSignedDownloadUrl('private', 'variants/z/large.webp', 'photo.webp');
    const params = new URL(url).searchParams;
    const expires = Number(params.get('expires'));
    const sig = params.get('sig')!;
    expect(storage.verify('private', 'variants/z/large.webp', expires, sig, 'photo.webp')).toBe(true);
    // A different filename must not verify against the same signature.
    expect(storage.verify('private', 'variants/z/large.webp', expires, sig, 'evil.webp')).toBe(false);
  });
});
