import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { GalleryExperience } from '@/components/gallery/gallery-experience';
import { UnlockForm } from '@/components/gallery/unlock-form';
import {
  authorizeGalleryAccess,
  AuthorizationError,
} from '@/lib/auth/authorization';
import { buildGalleryView, isGalleryUnlocked } from '@/lib/gallery';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gallery',
  robots: { index: false, follow: false, nocache: true },
};

function GalleryMessage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="py-section">
      <Container>
        <div className="mx-auto max-w-xl border border-hairline bg-parchment/40 p-12 text-center">
          <p className="font-serif text-3xl text-ink">{title}</p>
          <p className="mx-auto mt-4 max-w-measure font-sans text-sm leading-relaxed text-stone-deep">
            {body}
          </p>
          <div className="mt-8">
            <Link href="/account" className="btn-outline">
              Back to my galleries
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default async function GalleryPage({ params }: { params: { slug: string } }) {
  let access;
  try {
    access = await authorizeGalleryAccess(params.slug);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      switch (error.code) {
        case 'EXPIRED':
          return (
            <GalleryMessage
              title="This gallery has expired"
              body="Access to this gallery has now closed. If you would still like your photographs, please contact the studio and we will be glad to help."
            />
          );
        case 'DISABLED':
          return (
            <GalleryMessage
              title="This gallery is unavailable"
              body="Access to this gallery is currently paused. Please contact the studio if you were expecting to view it."
            />
          );
        case 'FORBIDDEN':
        case 'NOT_FOUND':
        default:
          return (
            <GalleryMessage
              title="Gallery not found"
              body="We couldn't find this gallery, or it isn't shared with your account. Do check the link, or return to your galleries."
            />
          );
      }
    }
    throw error;
  }

  const { gallery } = access;

  // Optional per-gallery password gate (in addition to login).
  if (gallery.passwordHash && !isGalleryUnlocked(gallery.id, gallery.passwordHash)) {
    return (
      <Container>
        <UnlockForm slug={gallery.slug} title={gallery.title} />
      </Container>
    );
  }

  const view = await buildGalleryView(gallery.id, access.user);

  return (
    <>
      {/* Cover */}
      <section className="relative h-[60vh] min-h-[420px] w-full">
        {view.cover ? (
          <img
            src={view.cover.display}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              backgroundImage: view.cover.blurDataUrl ? `url(${view.cover.blurDataUrl})` : undefined,
              backgroundSize: 'cover',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/10 to-ink/60" />
        <div className="absolute inset-0 flex items-end">
          <Container className="pb-12">
            <p className="eyebrow text-ivory/80">
              {view.shootDate ? formatDate(view.shootDate) : 'Private gallery'}
            </p>
            <h1 className="mt-3 text-display-lg text-ivory">{view.title}</h1>
          </Container>
        </div>
      </section>

      {/* Message + expiry */}
      {(view.message || view.expiresAt) && (
        <section className="border-b border-hairline py-12">
          <Container>
            <div className="mx-auto max-w-measure text-center">
              {view.message && (
                <p className="prose-editorial mx-auto text-center">{view.message}</p>
              )}
              {view.expiresAt && (
                <p className="mt-6 font-sans text-xs uppercase tracking-widest text-stone-deep">
                  Available until {formatDate(view.expiresAt)}
                </p>
              )}
            </div>
          </Container>
        </section>
      )}

      <section className="py-section">
        <GalleryExperience gallery={view} />
      </section>
    </>
  );
}
