import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { EditorialImage } from '@/components/media/editorial-image';
import { getPageContent } from '@/lib/content';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Olivia Saunders — a photographer working with a calm, editorial eye across weddings, portraiture and country life.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [body, approach] = await Promise.all([
    getPageContent('about.body'),
    getPageContent('about.approach'),
  ]);

  const paragraphs = body.body.split('\n\n').filter(Boolean);

  return (
    <>
      <section className="pt-36 md:pt-44">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <p className="eyebrow">About</p>
              <h1 className="mt-5 text-display-lg">{body.title}</h1>
              <div className="mt-8 space-y-6">
                {paragraphs.map((p, i) => (
                  <p key={i} className="prose-editorial">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <EditorialImage
                image={{
                  id: 'about-portrait',
                  src: '/placeholders/feature-1.jpg',
                  width: 1600,
                  height: 2000,
                  alt: 'Portrait of the photographer',
                  layoutHint: 'tall',
                }}
                sizes="(min-width: 768px) 40rem, 100vw"
              />
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-section">
        <Container>
          <div className="grid gap-12 border-t border-hairline pt-16 md:grid-cols-3 md:gap-16">
            <Reveal>
              <p className="eyebrow">{approach.title}</p>
            </Reveal>
            <Reveal delay={80} className="md:col-span-2">
              <p className="prose-editorial max-w-prose">{approach.body}</p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Press / recognition placeholder — clearly marked, no unsupported claims */}
      <section className="border-y border-hairline bg-parchment/50 py-section">
        <Container>
          <Reveal className="text-center">
            <p className="eyebrow">With thanks</p>
            <p className="mx-auto mt-6 max-w-measure font-serif text-2xl leading-relaxed text-ink">
              A space reserved for press features, selected publications or client logos, added as
              the studio grows. (Placeholder — replace with real, permissioned mentions.)
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-section">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md">A conversation to begin</h2>
            <p className="mx-auto mt-5 max-w-measure font-sans text-base leading-relaxed text-stone-deep">
              Tell me a little about what you have in mind. I reply to every enquiry personally.
            </p>
            <div className="mt-9">
              <ButtonLink href="/contact" variant="primary">
                Make an enquiry
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
