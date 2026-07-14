'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader({ studioName }: { studioName: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-editorial',
        scrolled || menuOpen
          ? 'border-b border-hairline bg-ivory/95 backdrop-blur'
          : 'bg-transparent',
      )}
    >
      <div className="container-shell flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-ink transition-colors hover:text-olive"
          aria-label={`${studioName} — home`}
        >
          {studioName}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-sans text-xs uppercase tracking-widest transition-colors',
                pathname?.startsWith(link.href)
                  ? 'text-olive'
                  : 'text-charcoal hover:text-olive',
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="border border-charcoal/60 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            Client Login
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span
              className={cn(
                'absolute left-0 top-0 h-px w-6 bg-charcoal transition-transform duration-300',
                menuOpen && 'translate-y-1.5 rotate-45',
              )}
            />
            <span
              className={cn(
                'absolute bottom-0 left-0 h-px w-6 bg-charcoal transition-transform duration-300',
                menuOpen && '-translate-y-1.5 -rotate-45',
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          'overflow-hidden border-t border-hairline bg-ivory md:hidden',
          menuOpen ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
        style={{ transition: 'max-height 400ms var(--ease-editorial)' }}
      >
        <nav aria-label="Mobile" className="container-shell flex flex-col gap-1 py-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b border-hairline py-4 font-serif text-2xl text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-4 border border-charcoal px-5 py-3.5 text-center font-sans text-xs uppercase tracking-widest text-charcoal"
          >
            Client Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
