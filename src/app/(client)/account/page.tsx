import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { requireUser } from '@/lib/auth/authorization';
import { getGalleriesForUser } from '@/lib/gallery';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Galleries',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();
  const galleries = await getGalleriesForUser(user);

  const active = galleries.filter((g) => !g.isExpired);
  const expired = galleries.filter((g) => g.isExpired);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="eyebrow">Your account</p>
          <h1 className="mt-4 text-display-md">My galleries</h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-stone-deep">
            The private galleries prepared for you appear below. They are visible only to you.
          </p>
        </div>

        {galleries.length === 0 ? (
          <div className="mt-16 border border-hairline bg-parchment/40 p-12 text-center">
            <p className="font-serif text-2xl text-ink">No galleries just yet</p>
            <p className="mx-auto mt-3 max-w-measure font-sans text-sm text-stone-deep">
              When the studio shares a gallery with you, it will appear here. Do check back, or get in
              touch if you were expecting one.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((g) => (
                <GalleryCard key={g.slug} gallery={g} />
              ))}
            </div>

            {expired.length > 0 && (
              <div className="mt-20">
                <h2 className="border-b border-hairline pb-3 font-serif text-2xl text-stone-deep">
                  Expired galleries
                </h2>
                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {expired.map((g) => (
                    <GalleryCard key={g.slug} gallery={g} expired />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}

function GalleryCard({
  gallery,
  expired = false,
}: {
  gallery: Awaited<ReturnType<typeof getGalleriesForUser>>[number];
  expired?: boolean;
}) {
  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-soft/50">
        {gallery.cover ? (
          <img
            src={gallery.cover.display}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
            style={{
              backgroundImage: gallery.cover.blurDataUrl
                ? `url(${gallery.cover.blurDataUrl})`
                : undefined,
              backgroundSize: 'cover',
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-lg text-stone-deep">
            {gallery.title}
          </div>
        )}
        {expired && <div className="absolute inset-0 bg-ivory/60" />}
      </div>
      <div className="mt-4 flex items-baseline justify-between border-b border-hairline pb-3">
        <h3 className="font-serif text-2xl text-ink">{gallery.title}</h3>
        {!expired && (
          <span className="font-sans text-xs uppercase tracking-widest text-stone-deep transition-transform group-hover:translate-x-1">
            Open →
          </span>
        )}
      </div>
      <p className="mt-3 font-sans text-xs uppercase tracking-widest text-stone-deep">
        {gallery.shootDate ? formatDate(gallery.shootDate) : `${gallery.imageCount} photographs`}
        {expired && gallery.expiresAt ? ` · Expired ${formatDate(gallery.expiresAt)}` : ''}
      </p>
    </>
  );

  if (expired) {
    return <div className="cursor-not-allowed opacity-70">{inner}</div>;
  }
  return (
    <Link href={`/gallery/${gallery.slug}`} className="group block">
      {inner}
    </Link>
  );
}
