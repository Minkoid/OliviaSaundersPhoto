import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Minimal, branded chrome for authentication pages. Deliberately not a generic
 * software login — it reads as part of the studio's world: warm ground, a split
 * layout, an editorial plate alongside the form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="/placeholders/feature-2.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-serif text-3xl text-ivory">A private space for your photographs</p>
          <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-ivory/80">
            Your gallery has been prepared with care. Sign in to view, favourite and — where enabled
            — download your images.
          </p>
        </div>
      </div>

      <div className="flex flex-col bg-ivory">
        <div className="container-shell flex h-20 items-center">
          <Link href="/" className="font-serif text-2xl text-ink hover:text-olive">
            Olivia Saunders
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-gutter py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
