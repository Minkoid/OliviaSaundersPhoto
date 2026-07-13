# Deployment guide

A sensible default production setup: **Vercel** (web) + **Neon** or **Supabase**
(PostgreSQL) + **Cloudflare R2** or **AWS S3** (object storage) + **Resend**
(email). Any equivalent providers work — everything is behind abstractions.

## 1. Prerequisites

- A production domain.
- Accounts for your chosen database, storage and email providers.
- The repository connected to Vercel (or another Node host).

## 2. Database (Neon or Supabase)

1. Create a Postgres database.
2. Copy the **pooled** connection string into `DATABASE_URL` and the **direct**
   connection string into `DIRECT_URL` (Prisma uses the direct URL for
   migrations). Ensure `sslmode=require`.
3. Apply migrations against production:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```
4. (Optional) seed baseline content, or create the first admin manually. To
   create an admin without the seed, insert a `User` with `role = ADMIN` and a
   bcrypt `passwordHash`, or run the seed once and then change credentials.

## 3. Object storage (Cloudflare R2 or AWS S3)

Create **two buckets**: a private one (`S3_PRIVATE_BUCKET`) and a public one
(`S3_PUBLIC_BUCKET`).

- **Private bucket** — block all public access. No public bucket policy. Access is
  granted only through the app's short-lived presigned URLs.
- **Public bucket** — may be public-read or, preferably, fronted by a CDN. Set
  `S3_PUBLIC_BASE_URL` to the CDN domain if used.
- **CORS** — allow `GET` (and `PUT` if you enable direct browser uploads) from
  your site origin.
- **Cloudflare R2**: set `S3_ENDPOINT` to your R2 S3 API endpoint, `S3_REGION=auto`.
- **AWS S3**: leave `S3_ENDPOINT` blank and set the real `S3_REGION`.
- **MinIO** (self-host): set `S3_ENDPOINT` and `S3_FORCE_PATH_STYLE=true`.

Create buckets with `npm run storage:setup` (uses your env), or via the provider
console. **Enable object versioning on the private bucket** (see `BACKUP.md`).

Set `STORAGE_DRIVER=s3`.

## 4. Email (Resend)

1. Create a Resend API key → `RESEND_API_KEY`; set `EMAIL_DRIVER=resend`.
2. Verify your sending domain and set `EMAIL_FROM` to an address on it.
3. Set `ADMIN_NOTIFICATION_EMAIL` for new-enquiry alerts.

## 5. Vercel

1. Import the repo. Framework preset: Next.js. Build command `npm run build`
   (runs `prisma generate` then `next build`).
2. Add all environment variables from `.env.example` in Project Settings →
   Environment Variables (Production + Preview). Generate `AUTH_SECRET` with
   `openssl rand -base64 32`. Set `NEXT_PUBLIC_APP_URL` to your domain and
   `AUTH_TRUST_HOST=true`.
3. Deploy. Migrations are **not** run automatically — run `prisma migrate deploy`
   from CI or locally against production, or add it to your pipeline.

### Scheduled jobs (expiry reminders)

Add a Vercel Cron (or GitHub Action) that runs
`scripts/send-expiry-reminders.ts` daily, e.g. a small route or a scheduled job
invoking `npx tsx --env-file=.env scripts/send-expiry-reminders.ts 7`.

## 6. Domain & DNS

1. Add your domain in Vercel and follow its DNS instructions (A/ALIAS or CNAME).
2. If using a CDN for the public bucket, create the CNAME and set
   `S3_PUBLIC_BASE_URL`.
3. Confirm HTTPS is active (automatic on Vercel) and update `NEXT_PUBLIC_APP_URL`.

## 7. Large downloads (production approach)

The built-in full-gallery ZIP endpoint **streams** the archive (never buffering
it fully in memory), which is fine for small-to-moderate galleries within the
serverless timeout (`maxDuration`). For very large galleries:

- Generate the archive **asynchronously** in a worker/queue and store it in the
  object store, then email/serve a signed link when ready; **or**
- Use an object-storage-native batch/archive feature; **or**
- Run the ZIP endpoint on a longer-lived Node runtime (e.g. a dedicated worker
  service) rather than a short serverless function.

## 8. Large uploads (production approach)

For very large files or high volume, switch from inline upload processing to
**presigned direct-to-storage uploads**: the browser uploads straight to the
bucket using `createUploadUrl` / multipart primitives on `StorageService`, and a
background worker calls `ingestImage` to produce variants. This keeps big files
off the application server.

## 9. Recommended monitoring

- **Error monitoring**: set `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` and wire your
  Sentry SDK (hooks are present in env; add the SDK when enabling).
- **Analytics** (optional, privacy-first): set
  `NEXT_PUBLIC_ANALYTICS_DRIVER=plausible` and `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
- **Logs**: the app logs upload failures, storage errors and auth events; ship
  Vercel/host logs to your log platform.
- **Uptime**: add an external uptime check on `/` and `/login`.
- **Audit**: review the `AuditLog` table for administrative and security events.

## 10. Post-deploy checklist

- [ ] `prisma migrate deploy` applied.
- [ ] Admin account created; seed/default passwords changed.
- [ ] Private bucket confirmed non-public; public bucket/CDN reachable.
- [ ] A test enquiry arrives by email; invitation and reset emails deliver.
- [ ] A client can log in, view a gallery, favourite and download (if enabled).
- [ ] Private image URLs expire; another client cannot access someone else's images.
- [ ] `robots.txt` / `sitemap.xml` correct; private surfaces are `noindex`.
- [ ] Content replaced per `CONTENT_CHECKLIST.md`.
