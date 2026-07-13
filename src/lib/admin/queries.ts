import 'server-only';
import { prisma } from '@/lib/prisma';

/** Aggregated statistics and recent activity for the admin dashboard. */
export async function getDashboardData() {
  const now = new Date();
  const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    publicPortfolios,
    activeGalleries,
    expiringGalleries,
    recentUploads,
    recentEnquiries,
    newEnquiryCount,
    recentDownloads,
  ] = await Promise.all([
    prisma.portfolio.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.gallery.count({
      where: {
        deletedAt: null,
        isPublished: true,
        isDisabled: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.gallery.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        isDisabled: false,
        expiresAt: { gte: now, lte: soon },
      },
      orderBy: { expiresAt: 'asc' },
      take: 5,
      select: { id: true, slug: true, title: true, clientName: true, expiresAt: true },
    }),
    prisma.imageAsset.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, type: true, status: true, createdAt: true },
    }),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
    prisma.downloadEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        kind: true,
        createdAt: true,
        gallery: { select: { title: true } },
      },
    }),
  ]);

  return {
    publicPortfolios,
    activeGalleries,
    expiringGalleries,
    recentUploads,
    recentEnquiries,
    newEnquiryCount,
    recentDownloads,
  };
}
