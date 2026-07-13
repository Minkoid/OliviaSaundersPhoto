import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/admin-nav';
import { requireAdminPage } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-hairline bg-parchment/30 lg:block">
        <AdminNav email={user.email} />
      </aside>
      {/* Mobile top bar */}
      <div className="border-b border-hairline bg-parchment/30 lg:hidden">
        <AdminNav email={user.email} />
      </div>
      <main id="main" className="min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">{children}</div>
      </main>
    </div>
  );
}
