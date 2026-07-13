import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { imageUsageContent, LEGAL_UPDATED } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Image Usage Terms',
  description: 'How photographs made by the studio may be used.',
  alternates: { canonical: '/image-usage' },
};

export default function ImageUsagePage() {
  return <LegalPage title="Image Usage Terms" updated={LEGAL_UPDATED} {...imageUsageContent} />;
}
