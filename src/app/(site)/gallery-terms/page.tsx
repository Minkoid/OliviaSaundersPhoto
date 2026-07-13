import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { galleryTermsContent, LEGAL_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Client Gallery Terms',
  description: 'Terms applying to private client galleries.',
  alternates: { canonical: '/gallery-terms' },
};

export default function GalleryTermsPage() {
  return <LegalPage title="Client Gallery Terms" updated={LEGAL_UPDATED} {...galleryTermsContent} />;
}
