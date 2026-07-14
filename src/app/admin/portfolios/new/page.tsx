import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { PortfolioForm } from '@/components/admin/portfolio-form';

export default function NewPortfolioPage() {
  return (
    <>
      <PageHeader
        title="New portfolio"
        description="Create a public collection. You can upload photographs after saving."
        action={
          <Link href="/admin/portfolios" className="btn-quiet">
            ← Back
          </Link>
        }
      />
      <div className="max-w-3xl">
        <PortfolioForm />
      </div>
    </>
  );
}
