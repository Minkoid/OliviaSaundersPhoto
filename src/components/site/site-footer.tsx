import Link from 'next/link';
import type { SiteSettingsView } from '@/lib/content';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/terms', label: 'Terms' },
  { href: '/gallery-terms', label: 'Gallery Terms' },
  { href: '/image-usage', label: 'Image Usage' },
];

export function SiteFooter({ settings }: { settings: SiteSettingsView }) {
  const social = [
    { url: settings.instagramUrl, label: 'Instagram' },
    { url: settings.pinterestUrl, label: 'Pinterest' },
    { url: settings.facebookUrl, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <footer className="mt-section border-t border-hairline bg-parchment/60">
      <div className="container-shell grid gap-12 py-16 md:grid-cols-3 md:py-20">
        <div>
          <p className="font-serif text-3xl text-ink">{settings.studioName}</p>
          <p className="mt-4 max-w-measure font-sans text-sm leading-relaxed text-stone-deep">
            {settings.footerText}
          </p>
        </div>

        <div className="font-sans text-sm text-charcoal">
          <p className="eyebrow mb-4">Studio</p>
          <ul className="space-y-2 text-stone-deep">
            {settings.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="link-underline">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && <li>{settings.contactPhone}</li>}
            {settings.studioLocation && <li>{settings.studioLocation}</li>}
          </ul>
          {social.length > 0 && (
            <ul className="mt-6 flex gap-5">
              {social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs uppercase tracking-widest text-charcoal hover:text-olive"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="font-sans text-sm text-charcoal">
          <p className="eyebrow mb-4">Navigate</p>
          <ul className="space-y-2 text-stone-deep">
            <li>
              <Link href="/portfolio" className="link-underline">
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/about" className="link-underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link-underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/login" className="link-underline">
                Client Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-shell flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="font-sans text-xs text-stone-deep">
            © {new Date().getFullYear()} {settings.studioName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-sans text-xs uppercase tracking-wider text-stone-deep hover:text-charcoal"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
