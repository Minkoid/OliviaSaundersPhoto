/**
 * Gallery expiry reminder job.
 *
 * Emails assigned clients when their gallery is due to expire within a window
 * (default 7 days). Intended to be run on a schedule (cron, Vercel Cron, or a
 * scheduled GitHub Action). Idempotency for a given day is left to the scheduler
 * cadence; extend with a "reminderSentAt" column if exact-once delivery matters.
 *
 * Run: `npx tsx --env-file=.env scripts/send-expiry-reminders.ts [days]`
 */
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../src/lib/email/mailer';
import { galleryExpiryReminderEmail } from '../src/lib/email/templates';
import { formatDate } from '../src/lib/utils';

const prisma = new PrismaClient();

async function main() {
  const windowDays = Number(process.argv[2] ?? '7');
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();
  const until = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const galleries = await prisma.gallery.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      isDisabled: false,
      expiresAt: { gte: now, lte: until },
    },
    include: {
      access: { where: { revokedAt: null }, include: { user: { include: { clientProfile: true } } } },
    },
  });

  let sent = 0;
  for (const gallery of galleries) {
    if (!gallery.expiresAt) continue;
    for (const access of gallery.access) {
      if (!access.user.isActive) continue;
      const ok = await sendEmail({
        to: access.user.email,
        ...galleryExpiryReminderEmail({
          displayName: access.user.clientProfile?.displayName ?? access.user.name ?? 'there',
          galleryTitle: gallery.title,
          galleryUrl: `${appUrl}/gallery/${gallery.slug}`,
          expiresAt: formatDate(gallery.expiresAt),
        }),
      });
      if (ok) sent += 1;
    }
  }

  console.log(`Expiry reminders processed: ${galleries.length} galleries, ${sent} emails sent.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
