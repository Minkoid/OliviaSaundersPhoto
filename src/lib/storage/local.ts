import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { getServerEnv, getAppUrl } from '@/lib/env';
import type {
  CompletedPart,
  MultipartPartUrl,
  MultipartUpload,
  PutObjectInput,
  SignedUrlOptions,
  StorageScope,
  StorageService,
} from './types';

/**
 * Local filesystem storage driver for development.
 *
 * Files are written under LOCAL_STORAGE_DIR/{scope}/{key}. "Signed" URLs are
 * HMAC-signed links to an internal route (`/api/storage/local`) that verifies the
 * signature and expiry before streaming the file — mirroring the security model
 * of real signed URLs so gallery authorisation code paths are exercised locally.
 */
export class LocalStorageService implements StorageService {
  readonly driver = 'local' as const;
  private readonly root: string;

  constructor() {
    const env = getServerEnv();
    this.root = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  }

  private fullPath(scope: StorageScope, key: string): string {
    // Prevent path traversal escaping the storage root.
    const safeKey = key.replace(/\.\.(\/|\\|$)/g, '');
    return path.join(this.root, scope, safeKey);
  }

  private async writeObject(input: PutObjectInput): Promise<{ key: string }> {
    const target = this.fullPath(input.scope, input.key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.body);
    return { key: input.key };
  }

  uploadOriginal(input: Omit<PutObjectInput, 'scope'>) {
    return this.writeObject({ ...input, scope: 'private' });
  }

  uploadVariant(input: PutObjectInput) {
    return this.writeObject(input);
  }

  async deleteFile(scope: StorageScope, key: string): Promise<void> {
    try {
      await fs.unlink(this.fullPath(scope, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async getObjectBytes(scope: StorageScope, key: string): Promise<Buffer> {
    return fs.readFile(this.fullPath(scope, key));
  }

  private sign(scope: StorageScope, key: string, expires: number, filename?: string): string {
    const env = getServerEnv();
    const payload = `${scope}:${key}:${expires}:${filename ?? ''}`;
    return createHmac('sha256', env.AUTH_SECRET).update(payload).digest('hex');
  }

  /** Verify a local signed URL (used by the streaming route). */
  verify(
    scope: StorageScope,
    key: string,
    expires: number,
    signature: string,
    filename?: string,
  ): boolean {
    if (Number.isNaN(expires) || expires < Date.now()) return false;
    const expected = this.sign(scope, key, expires, filename);
    // Constant-time-ish comparison.
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  }

  private buildSignedUrl(
    scope: StorageScope,
    key: string,
    options?: SignedUrlOptions,
  ): string {
    const env = getServerEnv();
    const ttl = options?.expiresInSeconds ?? env.SIGNED_URL_TTL_SECONDS;
    const expires = Date.now() + ttl * 1000;
    const filename = options?.downloadFilename;
    const signature = this.sign(scope, key, expires, filename);
    const params = new URLSearchParams({
      scope,
      key,
      expires: String(expires),
      sig: signature,
    });
    if (filename) params.set('download', filename);
    return `${getAppUrl()}/api/storage/local?${params.toString()}`;
  }

  async getSignedViewUrl(scope: StorageScope, key: string, options?: SignedUrlOptions) {
    return this.buildSignedUrl(scope, key, options);
  }

  async getSignedDownloadUrl(
    scope: StorageScope,
    key: string,
    filename: string,
    options?: SignedUrlOptions,
  ) {
    return this.buildSignedUrl(scope, key, { ...options, downloadFilename: filename });
  }

  getPublicUrl(key: string): string {
    return `${getAppUrl()}/api/storage/local?scope=public&key=${encodeURIComponent(key)}&public=1`;
  }

  async createUploadUrl(scope: StorageScope, key: string) {
    // Local dev uploads go through the app's upload action rather than direct PUT.
    return { url: `${getAppUrl()}/api/storage/local-upload`, key };
  }

  async createMultipartUpload(scope: StorageScope, key: string): Promise<MultipartUpload> {
    return { uploadId: `local-${Date.now()}`, key, scope };
  }

  async getMultipartPartUrl(
    upload: MultipartUpload,
    partNumber: number,
  ): Promise<MultipartPartUrl> {
    return {
      partNumber,
      url: `${getAppUrl()}/api/storage/local-upload?key=${encodeURIComponent(upload.key)}&part=${partNumber}`,
    };
  }

  async completeMultipartUpload(upload: MultipartUpload, _parts: CompletedPart[]) {
    return { key: upload.key };
  }

  async abortMultipartUpload(_upload: MultipartUpload): Promise<void> {
    // No-op for local driver.
  }
}
