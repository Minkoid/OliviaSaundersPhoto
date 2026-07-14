import { PageHeader, EmptyState } from '@/components/admin/ui';
import { EnquiryRow } from '@/components/admin/enquiry-row';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return (
    <>
      <PageHeader title="Enquiries" description="Messages received through the contact form." />

      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet" body="Contact form submissions will appear here." />
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <EnquiryRow
              key={e.id}
              enquiry={{
                id: e.id,
                name: e.name,
                email: e.email,
                phone: e.phone,
                type: e.type,
                eventDate: e.eventDate ? e.eventDate.toISOString() : null,
                location: e.location,
                message: e.message,
                status: e.status,
                createdAt: e.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
