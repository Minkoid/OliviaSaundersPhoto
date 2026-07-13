# Security model & checklist

## Principles

- **Server-authoritative**: every mutation and every media access re-checks
  authorisation on the server. UI affordances are never the security boundary.
- **Defence in depth**: edge middleware gates protected areas; server helpers
  make the authoritative decision.
- **Least exposure**: private media is served only via short-lived signed URLs;
  private surfaces are `noindex`; personal data collection is minimised.

## Authentication

- Passwords hashed with **bcrypt** (cost 12). For a single self-hosted target,
  argon2id is an excellent alternative.
- **JWT sessions** in **http-only**, `SameSite=Lax`, `Secure` (in production)
  cookies. CSRF is handled by Auth.js for the credentials flow.
- **No user enumeration**: login and password-reset return generic outcomes;
  login performs a dummy hash comparison to keep timing consistent.
- **Rate limiting** on login, password reset, enquiries and gallery-password
  entry (`src/lib/rate-limit.ts`). Swap the in-memory store for Redis in
  multi-instance deployments.
- **Invitations & resets** use single-use, expiring tokens; only a **hash** of
  the token is stored.

## Authorisation (private galleries)

`authorizeGalleryAccess` verifies, in order: authenticated → active account →
gallery exists (not soft-deleted) → published → not disabled → not expired → user
has an un-revoked access grant (admins bypass the grant only).

`authorizeGalleryImage` additionally verifies the image **belongs to** an
accessible gallery and that **download permission** (and full-resolution
permission) is enabled — preventing insecure direct object references (IDOR).
These are covered by unit tests in `src/lib/auth/authorization.test.ts`.

Optional **per-gallery password** adds a second factor beyond login; the unlock
token is bound to the current password hash (changing it invalidates unlocks).

## Media & data protection

- Originals and gallery media live in the **private** scope and are never public.
- Signed URLs are short-lived (`SIGNED_URL_TTL_SECONDS`, default 5 minutes).
- Client IP addresses are **hashed** (`ipHash`), never stored raw.
- Public display variants have metadata stripped; originals are preserved intact.
- Download events are recorded for accountability.

## HTTP hardening

Security headers are set in `next.config.mjs`: `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and
`X-Robots-Tag: noindex` on private/admin/auth/api paths. The `X-Powered-By`
header is disabled.

## Audit logging

Important administrative and security actions (logins, invitations, access
grants/revocations, publish/delete, uploads, downloads, settings changes) are
written to `AuditLog` with an actor and hashed IP.

## Pre-launch security checklist

- [ ] `AUTH_SECRET` is a strong, unique, secret value (not the example).
- [ ] All seed/default passwords changed; unused seed accounts removed.
- [ ] Private bucket is **not** publicly readable; no public policy/ACL.
- [ ] CORS on buckets restricted to the site origin.
- [ ] `NEXT_PUBLIC_APP_URL` and `AUTH_TRUST_HOST` set correctly (HTTPS).
- [ ] TLS enforced end-to-end; HSTS enabled at the edge/host.
- [ ] Signed-URL TTL is appropriate for your workflow.
- [ ] Rate limiting backed by a shared store if running multiple instances.
- [ ] Error monitoring enabled; alerts configured.
- [ ] Database backups enabled and a restore tested (`BACKUP.md`).
- [ ] Object versioning enabled on the private bucket.
- [ ] Reviewed `robots.txt`/metadata: no private surface is indexable.
- [ ] Legal pages reviewed by a qualified professional.
- [ ] Dependency audit run (`npm audit`) and criticals addressed.

## Reporting

Add a security contact and a `SECURITY.txt` / responsible-disclosure address for
your organisation before launch.
