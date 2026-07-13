import type { Metadata } from 'next';
import { ClientHeader } from '@/components/site/client-header';
import { requireUserPage } from '@/lib/auth/authorization';
import { getSiteSettings } from '@/lib/content';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage();
  const settings = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <ClientHeader studioName={settings.studioName} email={user.email} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
