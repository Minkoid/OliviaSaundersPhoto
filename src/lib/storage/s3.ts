import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerEnv } from '@/lib/env';
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
 * S3-compatible storage driver. Works with AWS S3, Cloudflare R2 and MinIO.
 *
 * Private objects are never made public; access is granted exclusively through
 * short-lived presigned URLs generated after server-side authorisation.
 */
export class S3StorageService implements StorageService {
  readonly driver = 's3' as const;
  private readonly client: S3Client;

  constructor() {
    const env = getServerEnv();
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  private bucket(scope: StorageScope): string {
    const env = getServerEnv();
    return scope === 'private' ? env.S3_PRIVATE_BUCKET : env.S3_PUBLIC_BUCKET;
  }

  private ttl(options?: SignedUrlOptions): number {
    return options?.expiresInSeconds ?? getServerEnv().SIGNED_URL_TTL_SECONDS;
  }

  private async put(input: PutObjectInput): Promise<{ key: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket(input.scope),
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        Metadata: input.metadata,
      }),
    );
    return { key: input.key };
  }

  uploadOriginal(input: Omit<PutObjectInput, 'scope'>) {
    return this.put({ ...input, scope: 'private' });
  }

  uploadVariant(input: PutObjectInput) {
    return this.put(input);
  }

  async deleteFile(scope: StorageScope, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket(scope), Key: key }),
    );
  }

  async getObjectBytes(scope: StorageScope, key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket(scope), Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Object not found: ${scope}/${key}`);
    return Buffer.from(bytes);
  }

  async getSignedViewUrl(scope: StorageScope, key: string, options?: SignedUrlOptions) {
    const command = new GetObjectCommand({
      Bucket: this.bucket(scope),
      Key: key,
      ResponseContentType: options?.contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: this.ttl(options) });
  }

  async getSignedDownloadUrl(
    scope: StorageScope,
    key: string,
    filename: string,
    options?: SignedUrlOptions,
  ) {
    const command = new GetObjectCommand({
      Bucket: this.bucket(scope),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return getSignedUrl(this.client, command, { expiresIn: this.ttl(options) });
  }

  getPublicUrl(key: string): string {
    const env = getServerEnv();
    if (env.S3_PUBLIC_BASE_URL) {
      return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    }
    if (env.S3_ENDPOINT) {
      return `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_PUBLIC_BUCKET}/${key}`;
    }
    return `https://${env.S3_PUBLIC_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }

  async createUploadUrl(
    scope: StorageScope,
    key: string,
    contentType: string,
    options?: SignedUrlOptions,
  ) {
    const command = new PutObjectCommand({
      Bucket: this.bucket(scope),
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: this.ttl(options) });
    return { url, key };
  }

  async createMultipartUpload(
    scope: StorageScope,
    key: string,
    contentType: string,
  ): Promise<MultipartUpload> {
    const res = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket(scope),
        Key: key,
        ContentType: contentType,
      }),
    );
    if (!res.UploadId) throw new Error('Failed to create multipart upload');
    return { uploadId: res.UploadId, key, scope };
  }

  async getMultipartPartUrl(
    upload: MultipartUpload,
    partNumber: number,
    options?: SignedUrlOptions,
  ): Promise<MultipartPartUrl> {
    const command = new UploadPartCommand({
      Bucket: this.bucket(upload.scope),
      Key: upload.key,
      UploadId: upload.uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: this.ttl(options) });
    return { partNumber, url };
  }

  async completeMultipartUpload(upload: MultipartUpload, parts: CompletedPart[]) {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket(upload.scope),
        Key: upload.key,
        UploadId: upload.uploadId,
        MultipartUpload: {
          Parts: parts
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
        },
      }),
    );
    return { key: upload.key };
  }

  async abortMultipartUpload(upload: MultipartUpload): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket(upload.scope),
        Key: upload.key,
        UploadId: upload.uploadId,
      }),
    );
  }
}
