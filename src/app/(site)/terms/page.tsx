import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { termsContent, LEGAL_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms on which the studio website and services are provided.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" updated={LEGAL_UPDATED} {...termsContent} />;
}
