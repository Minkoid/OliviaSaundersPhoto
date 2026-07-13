import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Card } from '@/components/admin/ui';
import { ClientForm } from '@/components/admin/client-form';
import { ClientActionsBar } from '@/components/admin/client-actions-bar';
import { prisma } from '@/lib/prisma';
import { formatDate, isExpired } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      clientProfile: true,
      galleryAccess: {
        where: { revokedAt: null },
        include: { gallery: true },
      },
    },
  });
  if (!client || client.role !== 'CLIENT' || client.deletedAt) notFound();

  return (
    <>
      <PageHeader
        title={client.clientProfile?.displayName ?? client.name ?? client.email}
        description={client.email}
        action={
          <Link href="/admin/clients" className="btn-quiet">
            ← Back
          </Link>
        }
      />

      <ClientActionsBar
        id={client.id}
        isActive={client.isActive}
        hasPassword={Boolean(client.passwordHash)}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <Card>
          <h2 className="mb-6 font-serif text-2xl text-ink">Details</h2>
          <ClientForm
            client={{
              id: client.id,
              email: client.email,
              displayName: client.clientProfile?.displayName ?? client.name ?? '',
              company: client.clientProfile?.company ?? '',
              phone: client.clientProfile?.phone ?? '',
              notes: client.clientProfile?.notes ?? '',
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-6 font-serif text-2xl text-ink">Gallery access</h2>
          {client.galleryAccess.length === 0 ? (
            <p className="font-sans text-sm text-stone-deep">
              No galleries assigned. Assign this client from a gallery&apos;s page.
            </p>
          ) : (
            <ul className="space-y-2">
              {client.galleryAccess.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between border border-hairline bg-white/40 px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/admin/galleries/${a.galleryId}`}
                      className="font-sans text-sm text-charcoal hover:text-olive"
                    >
                      {a.gallery.title}
                    </Link>
                    <p className="font-sans text-xs text-stone-deep">
                      {a.gallery.expiresAt
                        ? `${isExpired(a.gallery.expiresAt) ? 'Expired' : 'Expires'} ${formatDate(a.gallery.expiresAt)}`
                        : 'No expiry'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
