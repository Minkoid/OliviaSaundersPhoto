import Link from 'next/link';
import { PageHeader, Badge, EmptyState } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      clientProfile: true,
      _count: { select: { galleryAccess: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Client accounts and their gallery access."
        action={
          <Link href="/admin/clients/new" className="btn-primary">
            New client
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Create a client account and send an invitation to get started."
        />
      ) : (
        <div className="overflow-hidden border border-hairline">
          <table className="w-full border-collapse text-left">
            <thead className="bg-parchment/40">
              <tr className="font-sans text-xs uppercase tracking-widest text-stone-deep">
                <th className="px-5 py-3 font-normal">Name</th>
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Galleries</th>
                <th className="px-5 py-3 font-normal">Added</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-hairline hover:bg-parchment/20">
                  <td className="px-5 py-4">
                    <Link href={`/admin/clients/${c.id}`} className="font-serif text-lg text-ink hover:text-olive">
                      {c.clientProfile?.displayName ?? c.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-sans text-sm text-charcoal">{c.email}</td>
                  <td className="px-5 py-4 font-sans text-sm text-charcoal">{c._count.galleryAccess}</td>
                  <td className="px-5 py-4 font-sans text-sm text-charcoal">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-4">
                    {!c.isActive ? (
                      <Badge tone="neutral">{c.passwordHash ? 'Disabled' : 'Invited'}</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
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
