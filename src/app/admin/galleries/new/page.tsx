import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { GalleryForm } from '@/components/admin/gallery-form';

export default function NewGalleryPage() {
  return (
    <>
      <PageHeader
        title="New gallery"
        description="Create a private gallery. Assign clients and upload photographs after saving."
        action={
          <Link href="/admin/galleries" className="btn-quiet">
            ← Back
          </Link>
        }
      />
      <div className="max-w-3xl">
        <GalleryForm />
      </div>
    </>
  );
}
