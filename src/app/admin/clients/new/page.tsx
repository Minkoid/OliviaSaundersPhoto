import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { ClientForm } from '@/components/admin/client-form';

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        title="New client"
        description="Create a client account. An invitation will be emailed automatically."
        action={
          <Link href="/admin/clients" className="btn-quiet">
            ← Back
          </Link>
        }
      />
      <div className="max-w-3xl">
        <ClientForm />
      </div>
    </>
  );
}
