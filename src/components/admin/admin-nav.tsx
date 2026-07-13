'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/app/(client)/actions';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/portfolios', label: 'Portfolios' },
  { href: '/admin/galleries', label: 'Galleries' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/settings', label: 'Site content' },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-hairline px-6 py-6">
        <Link href="/admin" className="font-serif text-2xl text-ink">
          Olivia Saunders
        </Link>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-widest text-stone-deep">
          Studio administration
        </p>
      </div>

      <nav aria-label="Admin" className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'block px-3 py-2.5 font-sans text-sm transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-charcoal text-ivory'
                    : 'text-charcoal hover:bg-parchment',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-hairline px-6 py-5">
        <p className="truncate font-sans text-xs text-stone-deep" title={email}>
          {email}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Link href="/" className="font-sans text-xs uppercase tracking-widest text-stone-deep hover:text-charcoal">
            View site
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="font-sans text-xs uppercase tracking-widest text-stone-deep hover:text-charcoal"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
