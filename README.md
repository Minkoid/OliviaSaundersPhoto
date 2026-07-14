# Olivia Saunders — Photography Portfolio & Private Client Galleries

A production-oriented, bespoke platform for a luxury photography studio: a refined
public portfolio and a secure private client gallery system with a full
administration area.

The visual identity is warm, editorial and understated — restrained heritage
tones, an elegant serif paired with a quiet sans, generous whitespace and large
photography — built to feel like a considered British studio brand rather than a
generic photographer template.

> **Placeholders:** All business details, copy and imagery are clearly-marked
> placeholders. See [`CONTENT_CHECKLIST.md`](./CONTENT_CHECKLIST.md) before launch.

---

## Contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Quick start (local)](#quick-start-local)
- [Environment configuration](#environment-configuration)
- [Database & migrations](#database--migrations)
- [Seed data](#seed-data)
- [Object storage](#object-storage)
- [Image processing](#image-processing)
- [Email](#email)
- [Authentication & roles](#authentication--roles)
- [Uploads](#uploads)
- [Downloads](#downloads)
- [Testing](#testing)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Further documentation](#further-documentation)

---

## Feature overview

**Public site**

- Editorial homepage (hero, brand statement, selected work, portfolio previews,
  about intro, testimonials, call to action).
- Portfolio index and detail pages with a **varied editorial layout engine**
  (full-bleed, wide and paired "movements") so no two portfolios look identical.
- About and Contact (validated enquiry form → database + emails).
- Branded client login, password reset and invitation set-up.
- Legal placeholders: privacy, cookies, terms, gallery terms, image usage.
- SEO: per-page metadata, Open Graph, dynamic OG image, sitemap, robots, JSON-LD.

**Private client galleries**

- Sign-in-protected galleries visible only to explicitly assigned clients.
- Full-width cover, editorial masonry grid, full-screen lightbox with keyboard
  navigation, mobile swipe, previous/next, favourites and permitted downloads.
- Optional per-gallery password (in addition to login), image numbering and
  watermarked previews.
- Expiry dates with a clear expired-gallery message; graceful empty states.
- Lazy loading, responsive images and blur placeholders.

**Administration**

- Dashboard (portfolios, active/expiring galleries, uploads, enquiries, activity).
- Portfolio, gallery, client and enquiry management.
- Drag-and-drop multi-file upload with per-file progress, retry and validation.
- Image reordering, cover selection, featuring, captions and alt text.
- Client invitations, access reset, disable/enable, gallery assignment.
- Editable site content, contact details, social links and SEO defaults.
- Audit logging of important administrative actions.

## Tech stack

| Concern            | Choice |
| ------------------ | ------ |
| Framework          | Next.js 14 (App Router) + React 18 |
| Language           | TypeScript (strict) |
| Styling            | Tailwind CSS with design tokens |
| Database           | PostgreSQL + Prisma ORM |
| Auth               | Auth.js (NextAuth v5), JWT sessions, RBAC |
| Object storage     | S3-compatible (AWS S3 / Cloudflare R2 / MinIO) via a storage abstraction, plus a local dev driver |
| Image processing   | sharp (responsive WebP variants, blur placeholders, watermarks) |
| Validation         | Zod (shared schemas) + React Hook Form patterns |
| Email              | Resend / console driver behind a mailer abstraction |
| Testing            | Vitest + React Testing Library, Playwright (e2e) |

## Quick start (local)

Prerequisites: **Node 20+**, a **PostgreSQL** database, and (optionally) an
S3-compatible store. The default configuration uses a **local storage driver** and
a **console email driver**, so you can run everything with only Node + Postgres.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL (and DIRECT_URL) to your Postgres instance
#   - set AUTH_SECRET   (openssl rand -base64 32)

# 3. Prepare storage directories (local driver)
npm run storage:setup

# 4. Create the schema and seed demo data
npm run prisma:deploy      # or: npm run prisma:migrate  (dev)
npm run db:seed

# 5. Run the app
npm run dev                # http://localhost:3000
```

Seed logins are printed at the end of `npm run db:seed` (defaults:
`admin@example.com` / `ChangeMe!Admin123`, `eleanor@example.com` /
`ChangeMe!Client123`). Change these before any real deployment.

No local Postgres? Any managed provider works — see
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for Neon/Supabase setup.

## Environment configuration

All variables are documented in [`.env.example`](./.env.example). Highlights:

- `DATABASE_URL` / `DIRECT_URL` — Postgres connection (pooled + direct).
- `AUTH_SECRET` — session/JWT signing secret.
- `NEXT_PUBLIC_APP_URL` — canonical site URL.
- `STORAGE_DRIVER` — `local` (dev) or `s3`.
- `S3_*` — endpoint, region, keys and bucket names for S3/R2/MinIO.
- `EMAIL_DRIVER` — `console` (dev), `resend` or `smtp-noop`.
- `SIGNED_URL_TTL_SECONDS` — lifetime of signed private-media URLs.

Environment is validated at runtime via `src/lib/env.ts`; a missing required
variable fails fast with a clear message.

## Database & migrations

Prisma schema: [`prisma/schema.prisma`](./prisma/schema.prisma). Models cover
users/accounts/sessions, client profiles, portfolios and images, galleries with
per-user access, favourites, download events, enquiries, site settings, page
content, verification tokens and audit logs — with timestamps, publication flags,
soft deletion, indexes, unique constraints and referential integrity.

```bash
npm run prisma:migrate     # create/apply a dev migration
npm run prisma:deploy      # apply committed migrations (CI/production)
npm run prisma:studio      # inspect data
```

The initial migration is committed under `prisma/migrations/0001_init`.

## Seed data

`npm run db:seed` creates one administrator, two clients, four public portfolios
(with images), two active galleries, one expired gallery, sample favourites and
sample enquiries. Photographs are the generated placeholder plates in
`public/placeholders` (original gradient studies — **not** real photography and
**not** any third-party/brand imagery).

## Object storage

All storage goes through the `StorageService` abstraction
(`src/lib/storage`). Two logical scopes are used:

- **private** — originals and all client-gallery media; never publicly readable.
- **public** — optimised public portfolio variants (optionally CDN-fronted).

Drivers:

- **local** (default): writes under `LOCAL_STORAGE_DIR`. "Signed" URLs are
  HMAC-signed links to an internal route that verifies signature + expiry, so the
  private-media authorisation path is exercised exactly as in production.
- **s3**: AWS S3, Cloudflare R2 or MinIO. Private media is served only via
  short-lived presigned URLs generated after server-side authorisation. The
  service also exposes presigned single-PUT and multipart primitives for
  direct-to-storage uploads of very large files.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for bucket/CORS setup and `npm run
storage:setup` to create buckets.

## Image processing

`src/lib/images/processor.ts` (sharp) generates responsive WebP variants
(thumb/small/display/large — never upscaled), a tiny blur placeholder, and an
optional watermarked preview, preserving aspect ratio and photographic quality
(high WebP quality; no aggressive compression). Originals are stored untouched in
private storage; derived variants have metadata stripped.

Processing runs inline on upload by default. The pipeline (`ingestImage`) is
decoupled from the request, so it can also be driven by a background worker or a
serverless job for high volumes — the recommended production approach for large
batches is presigned direct uploads + a queue/worker calling the same
`ingestImage` function.

## Email

Branded, email-client-safe templates (`src/lib/email/templates.ts`) for: client
invitation, gallery available, password reset, gallery expiry reminder, enquiry
acknowledgement and new-enquiry admin notification. Delivery is abstracted
(`src/lib/email/mailer.ts`): `console` for development, `resend` for production.

## Authentication & roles

- Credentials auth with bcrypt password hashing; JWT sessions in http-only
  cookies; CSRF handled by Auth.js.
- Roles: **ADMIN**, **CLIENT** — enforced by middleware **and** by authoritative
  server-side checks (`src/lib/auth/authorization.ts`).
- Anti-enumeration: login and password-reset responses are generic; login timing
  is kept consistent.
- Rate limiting on login, password reset, enquiries and gallery-password entry.
- Invitation and reset flows use single-use, expiring, hashed tokens.

Every private-gallery request verifies: authenticated → gallery active →
published → not expired → user has access → (for images) the image belongs to
that gallery → download permitted. See [`SECURITY.md`](./SECURITY.md).

## Uploads

Admin drag-and-drop uploader (`src/components/admin/uploader.tsx`): multiple
files, per-file progress, retry, type/size validation and clear per-file errors
that never lose successful uploads. Files are validated, processed and linked to
the target portfolio/gallery via `POST /api/admin/upload`.

## Downloads

- Individual downloads via `GET /api/download/image/[id]` — authorised, logged,
  then redirected to a short-lived signed URL (web or, if permitted, full-res).
- Full-gallery ZIP via `GET /api/download/gallery/[slug]` — streamed with
  `archiver` (never buffered fully in memory). For very large galleries, prefer an
  asynchronous archive job / object-storage archive (documented in
  [`DEPLOYMENT.md`](./DEPLOYMENT.md)).
- All downloads check permissions server-side and are recorded as
  `DownloadEvent`s.

## Testing

```bash
npm run test        # Vitest unit/integration tests
npm run test:watch  # watch mode
npm run test:e2e    # Playwright (requires a built, seeded, running app)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

Unit tests cover utilities, validation schemas, password hashing, the storage
signing model, image processing, rate limiting, admin UI components and — most
importantly — the gallery **authorisation** logic including IDOR and download
permission cases. Playwright specs cover the public site and the client login /
gallery journey.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / serve |
| `npm run prisma:migrate` / `prisma:deploy` | Migrations |
| `npm run db:seed` | Seed demo data |
| `npm run storage:setup` | Create local dirs / S3 buckets |
| `npm run test` / `test:e2e` | Unit / e2e tests |
| `npx tsx scripts/generate-placeholders.ts` | Regenerate placeholder plates |
| `npx tsx --env-file=.env scripts/send-expiry-reminders.ts` | Email expiry reminders (cron) |

## Project structure

```
src/
  app/
    (site)/        Public pages (home, portfolio, about, contact, legal)
    (auth)/        Login, reset-password, set-password
    (client)/      Authenticated client area (account, gallery)
    admin/         Administration area
    api/           Auth, storage, upload and download route handlers
  components/      UI, media, forms, gallery, admin, site chrome
  lib/
    auth/          Auth.js config, authorization helpers, password, tokens
    storage/       Storage abstraction (local + s3)
    images/        Processing + ingestion + URL resolution
    email/         Mailer + templates
    ...            env, prisma, validation, content, portfolio, gallery, utils
prisma/            schema, migrations, seed
scripts/           placeholders, storage setup, expiry reminders
tests/             e2e specs + test stubs
public/placeholders/  generated placeholder plates
```

## Further documentation

- [`DEPLOY_FREE.md`](./DEPLOY_FREE.md) — **step-by-step free deployment** (Vercel + Neon + Cloudflare R2 + Resend).
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architecture, data model, routes, storage & security model.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — production deployment (Vercel + Neon/Supabase + R2/S3 + Resend), DNS, monitoring.
- [`SECURITY.md`](./SECURITY.md) — security model and pre-launch checklist.
- [`BACKUP.md`](./BACKUP.md) — backup, restore and resilience.
- [`CONTENT_CHECKLIST.md`](./CONTENT_CHECKLIST.md) — everything to replace before launch.
