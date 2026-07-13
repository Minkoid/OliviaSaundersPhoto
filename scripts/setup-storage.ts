/**
 * Storage bootstrap helper.
 *
 * - local driver: ensures the storage directories exist.
 * - s3 driver:    ensures the configured buckets exist (creates them if missing).
 *                 Works with AWS S3, Cloudflare R2 and MinIO.
 *
 * Run: `npm run storage:setup`
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getServerEnv } from '../src/lib/env';

async function ensureLocal() {
  const env = getServerEnv();
  const root = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  for (const scope of ['private', 'public']) {
    await fs.mkdir(path.join(root, scope), { recursive: true });
  }
  console.log(`Local storage ready at ${root} (private, public).`);
}

async function ensureS3() {
  const env = getServerEnv();
  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials:
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined,
  });

  for (const bucket of [env.S3_PRIVATE_BUCKET, env.S3_PUBLIC_BUCKET]) {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`Bucket exists: ${bucket}`);
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Created bucket: ${bucket}`);
    }
  }
  console.log(
    '\nReminder: the PRIVATE bucket must NOT be publicly readable. Configure a bucket ' +
      'policy / CORS as documented in the README before going live.',
  );
}

async function main() {
  const env = getServerEnv();
  if (env.STORAGE_DRIVER === 's3') {
    await ensureS3();
  } else {
    await ensureLocal();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
