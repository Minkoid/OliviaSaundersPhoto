import Link from 'next/link';
import { PageHeader, StatCard, Card, Badge, EmptyState } from '@/components/admin/ui';
import { getDashboardData } from '@/lib/admin/queries';
import { formatDate, daysUntil } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your public work, private galleries and recent studio activity."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Public portfolios" value={data.publicPortfolios} href="/admin/portfolios" />
        <StatCard label="Active galleries" value={data.activeGalleries} href="/admin/galleries" />
        <StatCard label="Uploads (7 days)" value={data.recentUploads} />
        <StatCard label="New enquiries" value={data.newEnquiryCount} href="/admin/enquiries" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-serif text-xl text-ink">Expiring soon</h2>
          <p className="mt-1 font-sans text-xs text-stone-deep">Galleries closing within 14 days.</p>
          <div className="mt-5">
            {data.expiringGalleries.length === 0 ? (
              <p className="font-sans text-sm text-stone-deep">Nothing expiring soon.</p>
            ) : (
              <ul className="space-y-3">
                {data.expiringGalleries.map((g) => {
                  const days = daysUntil(g.expiresAt);
                  return (
                    <li key={g.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/galleries/${g.id}`}
                        className="font-sans text-sm text-charcoal hover:text-olive"
                      >
                        {g.title}
                      </Link>
                      <Badge tone={days !== null && days <= 3 ? 'danger' : 'warning'}>
                        {days === 0 ? 'today' : `${days}d`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl text-ink">Recent enquiries</h2>
          <p className="mt-1 font-sans text-xs text-stone-deep">Latest messages from the contact form.</p>
          <div className="mt-5">
            {data.recentEnquiries.length === 0 ? (
              <p className="font-sans text-sm text-stone-deep">No enquiries yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentEnquiries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <Link
                      href="/admin/enquiries"
                      className="font-sans text-sm text-charcoal hover:text-olive"
                    >
                      {e.name}
                    </Link>
                    <span className="font-sans text-xs text-stone-deep">
                      {e.type.toLowerCase()} · {formatDate(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl text-ink">Recent activity</h2>
          <p className="mt-1 font-sans text-xs text-stone-deep">Latest client downloads.</p>
          <div className="mt-5">
            {data.recentDownloads.length === 0 ? (
              <EmptyState title="Quiet for now" body="Client download activity will appear here." />
            ) : (
              <ul className="space-y-3">
                {data.recentDownloads.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <span className="font-sans text-sm text-charcoal">
                      {d.kind === 'gallery-zip' ? 'Gallery download' : 'Image download'}
                    </span>
                    <span className="font-sans text-xs text-stone-deep">
                      {d.gallery?.title ? `${d.gallery.title} · ` : ''}
                      {formatDate(d.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
