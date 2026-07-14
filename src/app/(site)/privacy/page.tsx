import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { privacyContent, LEGAL_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How the studio collects, uses and protects your personal data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated={LEGAL_UPDATED} {...privacyContent} />;
}
