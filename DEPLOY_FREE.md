# Deploy for free

A complete, no-cost setup using free tiers:

| Piece | Provider (free tier) |
| ----- | -------------------- |
| Web app | **Vercel** (Hobby) |
| Database | **Neon** Postgres (free) |
| Photo storage | **Cloudflare R2** (10 GB, no egress fees) |
| Email (optional) | **Resend** (100 emails/day) |

Everything is behind abstractions, so you can swap any piece later. Total cost: £0
for a typical small studio.

> You'll do this once. Have the repo on GitHub (it already is) and create free
> accounts at vercel.com, neon.tech, dash.cloudflare.com and (optional) resend.com.

---

## 1. Database — Neon (free)

1. Create a project at [neon.tech]. Choose a region near your clients.
2. Copy the connection string. You'll use it for **both** `DATABASE_URL` and
   `DIRECT_URL` (Neon's pooled string is fine for both on Hobby). It looks like:
   `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`

## 2. Photo storage — Cloudflare R2 (free)

1. In the Cloudflare dashboard → **R2** → create **two buckets**:
   - `olivia-private` (originals + client galleries — keep private)
   - `olivia-public` (public portfolio images)
2. R2 → **Manage R2 API Tokens** → create a token with **Object Read & Write**.
   Note the **Access Key ID**, **Secret Access Key**, and your **Account ID**.
   Your S3 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
3. Make the **public** bucket web-readable: open `olivia-public` → **Settings** →
   enable the **Public Development URL** (gives an `https://pub-xxxx.r2.dev` URL),
   or connect a custom domain. Copy that URL — it becomes `S3_PUBLIC_BASE_URL`.
   **Do not** enable public access on the private bucket.
4. (Recommended) On both buckets → **Settings → CORS**, allow `GET` from your
   site origin, e.g.:
   ```json
   [{ "AllowedOrigins": ["https://your-domain.com"], "AllowedMethods": ["GET"], "AllowedHeaders": ["*"] }]
   ```

## 3. Email — Resend (optional but recommended)

Client invitations and password resets are emailed, so this matters if you want
clients to self-serve. Create a Resend API key and verify a sending domain. If you
skip this, set `EMAIL_DRIVER=console` (no emails are sent; you'd share client
set-up links manually).

## 4. Deploy the app — Vercel (free)

1. Go to [vercel.com] → **Add New… → Project** → import this GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings as-is —
   the repo ships a `vercel-build` script that runs database migrations
   automatically on each deploy.
3. Add **Environment Variables** (Settings → Environment Variables), for
   Production (and Preview):

   ```
   NEXT_PUBLIC_APP_URL   = https://<your-project>.vercel.app   (update after first deploy / custom domain)
   AUTH_SECRET           = <run: openssl rand -base64 32>
   AUTH_TRUST_HOST       = true

   DATABASE_URL          = <Neon connection string>
   DIRECT_URL            = <Neon connection string>

   STORAGE_DRIVER        = s3
   S3_ENDPOINT           = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   S3_REGION             = auto
   S3_ACCESS_KEY_ID      = <R2 access key id>
   S3_SECRET_ACCESS_KEY  = <R2 secret access key>
   S3_PRIVATE_BUCKET     = olivia-private
   S3_PUBLIC_BUCKET      = olivia-public
   S3_FORCE_PATH_STYLE   = true
   S3_PUBLIC_BASE_URL    = https://pub-xxxx.r2.dev      (the R2 public URL from step 2.3)
   SIGNED_URL_TTL_SECONDS= 300

   EMAIL_DRIVER          = resend        (or: console)
   EMAIL_FROM            = Olivia Saunders <studio@your-domain.com>
   ADMIN_NOTIFICATION_EMAIL = you@your-domain.com
   RESEND_API_KEY        = <resend key, if using resend>
   ```

4. Click **Deploy**. The build runs `prisma migrate deploy`, so your Neon database
   gets all the tables automatically. When it finishes, note your
   `https://<project>.vercel.app` URL and update `NEXT_PUBLIC_APP_URL` to match,
   then redeploy (Deployments → ⋯ → Redeploy) so links/emails use the right URL.

## 5. Create your admin login

The deploy creates the schema but no accounts. Create your admin **once** — the
easiest way is from your own machine, pointed at the Neon database:

```bash
# in a local checkout of the repo
npm install
DATABASE_URL="<Neon string>" \
ADMIN_EMAIL="you@your-domain.com" \
ADMIN_PASSWORD="a-long-strong-password" \
npm run create:admin
```

(Prefer to explore with demo content instead? Run `npm run db:seed` with
`DATABASE_URL` set — it adds sample portfolios, galleries and clients you can
later delete.)

Now sign in at `https://<project>.vercel.app/login`.

## 6. Add your content (all from the admin area)

Everything below is managed at `/admin` — no code needed:

- **Portfolios** → *New portfolio* → drag-and-drop photos, set a cover, reorder,
  add captions/alt text, mark images **featured** (featured images appear in the
  homepage "Selected work" section), then **Publish**.
- **Galleries** → *New gallery* → set client, shoot date, expiry, download
  permissions and optional password → drag-and-drop photos → assign the client →
  **Publish** → *Notify clients*.
- **Clients** → *New client* → sends an email invitation to set their password.
- **Site content** → edit studio name, contact details, social links, homepage &
  about copy, and SEO defaults.

Uploaded photos are processed into responsive WebP sizes and stored in R2;
originals stay in the private bucket. Public portfolio images are served from the
public R2 URL; client-gallery images are served only through short-lived signed
URLs after login.

## Free-tier notes & limits

- **Upload in modest batches** (e.g. 10–30 photos at a time). Vercel Hobby caps a
  request at 60s; large single batches of very large files can exceed that. It
  never loses successful uploads — just retry any that fail.
- **Full-gallery ZIP** also runs within the 60s Hobby limit. It's fine for
  typical galleries; for very large ones, upgrade to Vercel Pro (300s) or use the
  async archive approach in `DEPLOYMENT.md`.
- **R2 free tier**: 10 GB storage and generous free operations, no egress fees —
  ample for a small studio. Watch usage as your catalogue grows.
- **Neon free tier**: fine for this workload; enable its backups.
- **Custom domain**: add it in Vercel → Domains, then update `NEXT_PUBLIC_APP_URL`
  (and `EMAIL_FROM` domain in Resend) and redeploy.

## Security reminders before going live

See `SECURITY.md`. In short: strong `AUTH_SECRET`, private bucket truly private,
change any demo passwords, and review the placeholder legal pages.
