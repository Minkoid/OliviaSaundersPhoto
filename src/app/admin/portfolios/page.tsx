import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPortfoliosPage() {
  const portfolios = await prisma.portfolio.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { images: true } } },
  });

  return (
    <>
      <PageHeader
        title="Portfolios"
        description="Public collections shown on the website."
        action={
          <Link href="/admin/portfolios/new" className="btn-primary">
            New portfolio
          </Link>
        }
      />

      {portfolios.length === 0 ? (
        <EmptyState
          title="No portfolios yet"
          body="Create your first public collection to begin building the site."
        />
      ) : (
        <div className="overflow-hidden border border-hairline">
          <table className="w-full border-collapse text-left">
            <thead className="bg-parchment/40">
              <tr className="font-sans text-xs uppercase tracking-widest text-stone-deep">
                <th className="px-5 py-3 font-normal">Title</th>
                <th className="px-5 py-3 font-normal">Category</th>
                <th className="px-5 py-3 font-normal">Images</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map((p) => (
                <tr key={p.id} className="border-t border-hairline hover:bg-parchment/20">
                  <td className="px-5 py-4">
                    <Link href={`/admin/portfolios/${p.id}`} className="font-serif text-lg text-ink hover:text-olive">
                      {p.title}
                    </Link>
                    <p className="font-sans text-xs text-stone-deep">/{p.slug}</p>
                  </td>
                  <td className="px-5 py-4 font-sans text-sm text-charcoal">{p.category}</td>
                  <td className="px-5 py-4 font-sans text-sm text-charcoal">{p._count.images}</td>
                  <td className="px-5 py-4">
                    <Badge tone={p.isPublished ? 'success' : 'neutral'}>
                      {p.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
