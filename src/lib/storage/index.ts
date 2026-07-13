import { getServerEnv } from '@/lib/env';
import { LocalStorageService } from './local';
import { S3StorageService } from './s3';
import type { StorageService } from './types';

export * from './types';

let cached: StorageService | null = null;

/** Return the configured storage service (singleton). */
export function getStorage(): StorageService {
  if (cached) return cached;
  const env = getServerEnv();
  cached = env.STORAGE_DRIVER === 's3' ? new S3StorageService() : new LocalStorageService();
  return cached;
}

// Storage key helpers — a consistent, provider-agnostic key layout.
export const storageKeys = {
  original: (assetId: string, ext: string) => `originals/${assetId}/original.${ext}`,
  variant: (assetId: string, variant: string, ext: string) =>
    `variants/${assetId}/${variant}.${ext}`,
  galleryFile: (galleryId: string, fileId: string, filename: string) =>
    `gallery-files/${galleryId}/${fileId}/${filename}`,
  publicVariant: (assetId: string, variant: string, ext: string) =>
    `portfolio/${assetId}/${variant}.${ext}`,
};
