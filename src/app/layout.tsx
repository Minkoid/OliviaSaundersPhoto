import type { Metadata } from 'next';
import { serif, sans } from '@/lib/fonts';
import { getSiteSettings } from '@/lib/content';
import { getAppUrl } from '@/lib/env';
import { Analytics } from '@/components/analytics';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const appUrl = getAppUrl();
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: settings.seoTitle,
      template: `%s — ${settings.studioName}`,
    },
    description: settings.seoDescription,
    applicationName: settings.studioName,
    openGraph: {
      type: 'website',
      siteName: settings.studioName,
      title: settings.seoTitle,
      description: settings.seoDescription,
      url: appUrl,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.seoTitle,
      description: settings.seoDescription,
    },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.ico' },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-ivory text-charcoal">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] bg-charcoal px-4 py-2 text-xs uppercase tracking-widest text-ivory"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
