import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { cookiesContent, LEGAL_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How this website uses cookies.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return <LegalPage title="Cookie Policy" updated={LEGAL_UPDATED} {...cookiesContent} />;
}
