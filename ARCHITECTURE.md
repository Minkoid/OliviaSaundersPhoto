# Architecture

This document describes the architecture, data model, route map, storage model
and security model for the Olivia Saunders platform.

## 1. Repository assessment

The project began as an empty repository (a bare README). Everything here was
built from scratch as a single Next.js (App Router) application that serves the
public marketing site, the authenticated client galleries and the administration
area from one deployable unit, backed by PostgreSQL and S3-compatible storage.

## 2. Key technology choices

- **Next.js App Router + Server Components** — server-rendered, SEO-friendly
  public pages with minimal client JavaScript; server actions and route handlers
  keep all authorisation and data access on the server.
- **TypeScript (strict, `noUncheckedIndexedAccess`)** — end-to-end type safety.
- **Prisma + PostgreSQL** — a clear relational domain model with migrations,
  referential integrity and indexing.
- **Auth.js (NextAuth v5)** — credentials auth with JWT sessions (works well on
  serverless), extensible to OAuth/magic links. Split edge-safe config so
  middleware can gate routes without importing Node-only code.
- **Storage abstraction** — a single `StorageService` interface with local and
  S3 drivers, so the provider is swappable and private media never leaks.
- **sharp** — high-quality, aspect-preserving responsive variants.
- **Zod** — one set of validation schemas shared by server actions, route
  handlers and forms.

## 3. Data model

See [`prisma/schema.prisma`](./prisma/schema.prisma). Summary:

```
User ──1:1── ClientProfile
User ──1:N── GalleryAccess ──N:1── Gallery         (many-to-many client↔gallery)
User ──1:N── Favourite ──N:1── GalleryImage
User ──1:N── Account / Session / VerificationToken (Auth.js + tokens)
User ──1:N── AuditLog (actor)

Portfolio ──1:N── PortfolioImage ──1:1── ImageAsset
Portfolio ──cover──> PortfolioImage

Gallery ──1:N── GalleryImage ──1:1── ImageAsset
Gallery ──cover──> GalleryImage
Gallery ──1:N── GalleryFile         (extra downloadable files)
Gallery ──1:N── GalleryAccess / Favourite / DownloadEvent

ImageAsset  (one uploaded image + its variant storage keys, dimensions, blur,
             visibility, processing status) — reused by portfolio OR gallery.

Enquiry, SiteSettings (singleton), PageContent (keyed blocks), AuditLog.
```

Design notes:

- **`ImageAsset` is the single media record**; a `PortfolioImage` or
  `GalleryImage` links it to a context with per-context caption/order/flags. This
  keeps storage keys, dimensions and processing state in one place without
  over-generalising.
- **Access is a join table** (`GalleryAccess`) supporting many clients per gallery
  and many galleries per client, with soft revocation (`revokedAt`).
- **Soft deletion** (`deletedAt`) on Portfolio and Gallery; publication flags on
  portfolios, galleries and page content.
- **Indexes** on frequent queries (published/sort order, expiry, access by user,
  images by sort order, enquiries/audit by time) and **unique constraints**
  (slugs, one asset per portfolio/gallery image, one favourite per user+image,
  one access row per gallery+user).
- **Privacy**: raw client IPs are never stored — only salted hashes (`ipHash`).

## 4. Route map

Public (`src/app/(site)`):

```
/                     Homepage
/portfolio            Portfolio index
/portfolio/[slug]     Portfolio detail (editorial layout)
/about                About
/contact              Contact + enquiry form
/privacy /cookies /terms /gallery-terms /image-usage   Legal
```

Auth (`src/app/(auth)`, noindex):

```
/login                Client/admin sign-in
/reset-password       Request a reset
/set-password         Consume invite/reset token, set password
```

Client area (`src/app/(client)`, auth-gated, noindex):

```
/account              List of galleries assigned to the signed-in client
/gallery/[slug]       Private gallery experience
```

Admin (`src/app/admin`, admin-gated, noindex):

```
/admin                            Dashboard
/admin/portfolios[/new|/[id]]     Portfolio management
/admin/galleries[/new|/[id]]      Gallery management
/admin/clients[/new|/[id]]        Client management
/admin/enquiries                  Enquiries
/admin/settings                   Site content & settings
```

API route handlers (`src/app/api`):

```
/api/auth/[...nextauth]           Auth.js
/api/storage/local                Dev signed-media streamer (local driver)
/api/admin/upload                 Admin image ingestion (multipart)
/api/download/image/[id]          Authorised single-image download
/api/download/gallery/[slug]      Authorised full-gallery ZIP (streamed)
```

Metadata routes: `/sitemap.xml`, `/robots.txt`, `/opengraph-image`.

## 5. Storage model

- Logical scopes: **private** (originals + all gallery media) and **public**
  (portfolio display variants).
- Key layout is provider-agnostic (`storageKeys` in `src/lib/storage/index.ts`):
  `originals/{assetId}/…`, `variants/{assetId}/{variant}.webp` (private),
  `portfolio/{assetId}/{variant}.webp` (public).
- **Public** variants are served by stable URLs (direct or CDN).
- **Private** variants are served only through **short-lived signed URLs**
  minted after a successful server-side authorisation check. The local driver
  reproduces this with HMAC-signed, expiring links verified by an internal route.
- Uploads: inline processing by default; presigned single-PUT and multipart
  upload primitives are available for direct-to-storage of very large files.

## 6. Security model

Defence in depth:

1. **Middleware** (`src/middleware.ts`) coarse-gates `/admin`, `/account`,
   `/gallery` using the edge-safe session.
2. **Authoritative server checks** (`src/lib/auth/authorization.ts`) are the
   source of truth. `requireUser` / `requireAdmin` guard actions and routes;
   `authorizeGalleryAccess` and `authorizeGalleryImage` enforce the full
   private-gallery rule set and prevent insecure direct object references (a
   client cannot reach another client's image by changing an ID).
3. **No client-side-only security** — UI affordances never gate access; every
   download and mutation re-checks permission server-side.
4. **Secrets & data hygiene** — passwords hashed (bcrypt); tokens stored hashed;
   IPs hashed; private URLs are ephemeral; private surfaces are `noindex`.

See [`SECURITY.md`](./SECURITY.md) for the full checklist.

## 7. Assumptions

- A single studio brand (one administrator persona; multiple admins supported by
  role but not a full team-permission matrix).
- Galleries are shared with named client accounts (optionally plus a gallery
  password); there is no anonymous "link-only" access by default.
- Moderate gallery sizes are handled by inline processing and streamed ZIPs; very
  large volumes should adopt the documented background-processing and
  object-storage-archive approaches.
- Email and object storage are configured via environment; the app runs fully
  locally with the `local` storage and `console` email drivers.
