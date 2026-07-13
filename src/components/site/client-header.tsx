import Link from 'next/link';
import { signOutAction } from '@/app/(client)/actions';

/**
 * Header for the authenticated client area. Understated, echoing the public
 * chrome but with account controls.
 */
export function ClientHeader({ studioName, email }: { studioName: string; email: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ivory/95 backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link href="/account" className="font-serif text-2xl text-ink hover:text-olive">
          {studioName}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/account"
            className="hidden font-sans text-xs uppercase tracking-widest text-charcoal hover:text-olive sm:inline"
          >
            My galleries
          </Link>
          <span className="hidden font-sans text-xs text-stone-deep md:inline">{email}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="border border-charcoal/50 px-4 py-2 font-sans text-xs uppercase tracking-widest text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
