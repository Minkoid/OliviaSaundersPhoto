/**
 * Create or update a single administrator account — a clean production bootstrap
 * that does NOT insert any demo content (unlike the full seed).
 *
 * Usage:
 *   ADMIN_EMAIL=you@studio.com ADMIN_PASSWORD='a-strong-password' npm run create:admin
 *
 * Also ensures a SiteSettings row exists so the admin "Site content" screen has
 * something to edit.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword, passwordSchema } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME ?? 'Studio Administrator';

  if (!email) {
    throw new Error('ADMIN_EMAIL is required (e.g. ADMIN_EMAIL=you@studio.com).');
  }
  const pw = passwordSchema.safeParse(password);
  if (!pw.success) {
    throw new Error(
      `ADMIN_PASSWORD does not meet the policy: ${pw.error.issues.map((i) => i.message).join('; ')}`,
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', isActive: true, passwordHash, name },
    create: {
      email,
      name,
      role: 'ADMIN',
      isActive: true,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', studioName: 'Olivia Saunders' },
  });

  console.log(`✓ Administrator ready: ${user.email}`);
  console.log('  You can now sign in at /login and manage the site.');
}

main()
  .catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
