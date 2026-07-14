/**
 * Storage abstraction.
 *
 * All object-storage access in the application goes through the `StorageService`
 * interface so the underlying provider (local disk, AWS S3, Cloudflare R2, MinIO)
 * can be swapped without touching business logic.
 *
 * "Buckets" are modelled as two logical scopes:
 *  - `private`: originals and client gallery media. Never publicly readable.
 *  - `public`:  optimised public portfolio display assets (may be CDN-fronted).
 */

export type StorageScope = 'private' | 'public';

export interface PutObjectInput {
  scope: StorageScope;
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  /** Cache-Control header to persist with the object. */
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  /** Time-to-live in seconds. Defaults to the configured TTL. */
  expiresInSeconds?: number;
  /** Force a download with the given filename (Content-Disposition: attachment). */
  downloadFilename?: string;
  contentType?: string;
}

export interface MultipartUpload {
  uploadId: string;
  key: string;
  scope: StorageScope;
}

export interface MultipartPartUrl {
  partNumber: number;
  url: string;
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

export interface StorageService {
  readonly driver: 'local' | 's3';

  /** Upload an original (private) file. */
  uploadOriginal(input: Omit<PutObjectInput, 'scope'>): Promise<{ key: string }>;

  /** Upload a processed variant to the given scope. */
  uploadVariant(input: PutObjectInput): Promise<{ key: string }>;

  /** Delete an object. Missing objects resolve without error. */
  deleteFile(scope: StorageScope, key: string): Promise<void>;

  /** Read an object's bytes (server-side use, e.g. ZIP building). */
  getObjectBytes(scope: StorageScope, key: string): Promise<Buffer>;

  /** A short-lived URL to view a private object. */
  getSignedViewUrl(scope: StorageScope, key: string, options?: SignedUrlOptions): Promise<string>;

  /** A short-lived URL to download a private object as an attachment. */
  getSignedDownloadUrl(
    scope: StorageScope,
    key: string,
    filename: string,
    options?: SignedUrlOptions,
  ): Promise<string>;

  /** Stable public URL for a public-scope object (CDN or direct). */
  getPublicUrl(key: string): string;

  /** Presigned single-PUT upload URL for direct-to-storage browser uploads. */
  createUploadUrl(
    scope: StorageScope,
    key: string,
    contentType: string,
    options?: SignedUrlOptions,
  ): Promise<{ url: string; key: string }>;

  /** Begin a multipart upload for very large files. */
  createMultipartUpload(
    scope: StorageScope,
    key: string,
    contentType: string,
  ): Promise<MultipartUpload>;

  /** Presigned URL for a single multipart part. */
  getMultipartPartUrl(
    upload: MultipartUpload,
    partNumber: number,
    options?: SignedUrlOptions,
  ): Promise<MultipartPartUrl>;

  /** Finalise a multipart upload. */
  completeMultipartUpload(
    upload: MultipartUpload,
    parts: CompletedPart[],
  ): Promise<{ key: string }>;

  /** Abort an in-progress multipart upload. */
  abortMultipartUpload(upload: MultipartUpload): Promise<void>;
}
