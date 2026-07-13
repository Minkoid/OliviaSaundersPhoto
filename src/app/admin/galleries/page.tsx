import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';
import { formatDate, isExpired } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminGalleriesPage() {
  const galleries = await prisma.gallery.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { images: true, access: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Galleries"
        description="Private client galleries."
        action={
          <Link href="/admin/galleries/new" className="btn-primary">
            New gallery
          </Link>
        }
      />

      {galleries.length === 0 ? (
        <EmptyState
          title="No galleries yet"
          body="Create a private gallery and assign it to a client."
        />
      ) : (
        <div className="overflow-hidden border border-hairline">
          <table className="w-full border-collapse text-left">
            <thead className="bg-parchment/40">
              <tr className="font-sans text-xs uppercase tracking-widest text-stone-deep">
                <th className="px-5 py-3 font-normal">Gallery</th>
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Images</th>
                <th className="px-5 py-3 font-normal">Expiry</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {galleries.map((g) => {
                const expired = isExpired(g.expiresAt);
                return (
                  <tr key={g.id} className="border-t border-hairline hover:bg-parchment/20">
                    <td className="px-5 py-4">
                      <Link href={`/admin/galleries/${g.id}`} className="font-serif text-lg text-ink hover:text-olive">
                        {g.title}
                      </Link>
                      <p className="font-sans text-xs text-stone-deep">
                        {g._count.access} client{g._count.access === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-sans text-sm text-charcoal">{g.clientName}</td>
                    <td className="px-5 py-4 font-sans text-sm text-charcoal">{g._count.images}</td>
                    <td className="px-5 py-4 font-sans text-sm text-charcoal">
                      {g.expiresAt ? formatDate(g.expiresAt) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {g.isDisabled ? (
                          <Badge tone="danger">Disabled</Badge>
                        ) : expired ? (
                          <Badge tone="warning">Expired</Badge>
                        ) : g.isPublished ? (
                          <Badge tone="success">Live</Badge>
                        ) : (
                          <Badge tone="neutral">Draft</Badge>
                        )}
                        {g.passwordHash && <Badge tone="neutral">Password</Badge>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
