# Backup, restore & resilience

Original photographs are business-critical and irreplaceable. Treat storage and
database backups as first-class operational concerns.

## What to back up

| Asset | Where | Strategy |
| ----- | ----- | -------- |
| PostgreSQL data | managed DB | Automated daily backups + PITR |
| Original photographs | private bucket (`originals/…`) | Versioning + cross-region/secondary copy |
| Processed variants | private/public buckets | Reproducible from originals; version anyway |
| Configuration | env / secret store | Documented, stored in a secret manager |
| Client access records | PostgreSQL | Covered by DB backups |

## PostgreSQL

- Enable your provider's **automated backups** and **point-in-time recovery**
  (Neon and Supabase both offer this).
- Additionally, take periodic **logical dumps** for portability:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump
  # restore:
  pg_restore --clean --if-exists -d "$DATABASE_URL" backup-YYYY-MM-DD.dump
  ```
- Store dumps off-provider (e.g. an encrypted bucket) for provider-failure
  resilience.

## Object storage (photographs)

- **Enable object versioning** on the private bucket so overwrites/deletes are
  recoverable.
- **Lifecycle rules**: retain non-current versions for a defined window; avoid
  auto-deleting originals.
- **Secondary copy**: replicate the private bucket to a second region or a
  different provider (e.g. R2 → S3) on a schedule. Originals must not depend on a
  single unprotected location.
- Consider an **Object Lock / immutability** window for originals to protect
  against accidental or malicious deletion.

## Configuration

- Keep all environment variables in your host's secret manager; never in git.
- Document any provider-console settings (bucket policies, CORS, DNS) so they can
  be recreated.

## Restore procedure (outline)

1. Provision a database and restore the latest dump / PITR snapshot.
2. Point `DATABASE_URL` / `DIRECT_URL` at it and run `prisma migrate deploy` (if
   restoring a schema-only environment).
3. Ensure the storage buckets exist and contain (or are restored from) the
   originals; regenerate variants if needed by re-running processing.
4. Set environment variables and deploy.
5. Verify: admin login, a client gallery loads, signed URLs work, a download
   succeeds.

## Restore testing

- Schedule a **quarterly restore drill** into a staging environment and record
  the outcome. A backup is only as good as its last successful restore.

## Resilience recommendations

- Object **versioning** on the private bucket (required).
- **Managed database backups** + PITR (required).
- **Cross-region or secondary** backup storage for originals (strongly
  recommended).
- **Periodic restore testing** (recommended).
- Monitor storage/database errors and backup-job success.
