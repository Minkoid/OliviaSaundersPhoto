import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { EditorialImage } from '@/components/media/editorial-image';
import { getSiteSettings, getPageContent } from '@/lib/content';
import { getPublishedPortfolios, getFeaturedImages } from '@/lib/portfolio';
import { StructuredData } from '@/components/seo/structured-data';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    alternates: { canonical: '/' },
  };
}

export default async function HomePage() {
  const [settings, hero, statement, aboutIntro, testimonials, portfolios, featured] =
    await Promise.all([
      getSiteSettings(),
      getPageContent('home.hero'),
      getPageContent('home.statement'),
      getPageContent('home.about'),
      getPageContent('home.testimonials'),
      getPublishedPortfolios(),
      getFeaturedImages(3),
    ]);

  const quotes = Array.isArray(testimonials.data)
    ? (testimonials.data as { quote: string; attribution: string }[])
    : [];

  return (
    <>
      <StructuredData settings={settings} />

      {/* Hero */}
      <section className="relative h-[92vh] min-h-[560px] w-full">
        <EditorialImage
          image={{
            id: 'hero',
            src: '/placeholders/hero.jpg',
            width: 2400,
            height: 1350,
            alt: 'Editorial hero photograph',
            layoutHint: 'full',
          }}
          sizes="100vw"
          priority
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/10 to-ink/50" />
        <div className="absolute inset-0 flex items-end">
          <Container className="pb-16 md:pb-24">
            <Reveal>
              <p className="eyebrow text-ivory/80">{settings.tagline}</p>
              <h1 className="mt-5 max-w-3xl text-display-lg text-ivory">{hero.title}</h1>
              <p className="mt-6 max-w-measure font-sans text-base leading-relaxed text-ivory/90">
                {hero.body}
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <ButtonLink href="/portfolio" variant="primary" className="bg-ivory text-charcoal hover:bg-parchment">
                  View the portfolio
                </ButtonLink>
                <ButtonLink
                  href="/contact"
                  variant="outline"
                  className="border-ivory/70 text-ivory hover:bg-ivory hover:text-charcoal"
                >
                  Make an enquiry
                </ButtonLink>
              </div>
            </Reveal>
          </Container>
        </div>
      </section>

      {/* Brand statement */}
      <section className="py-section">
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{statement.title}</p>
            <p className="mx-auto mt-6 max-w-measure font-serif text-2xl leading-relaxed text-ink md:text-3xl">
              {statement.body}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Featured work */}
      {featured.length > 0 && (
        <section className="pb-section">
          <Container>
            <div className="mb-10 flex items-end justify-between">
              <h2 className="text-display-md">Selected work</h2>
              <Link
                href="/portfolio"
                className="hidden font-sans text-xs uppercase tracking-widest text-stone-deep hover:text-charcoal md:inline"
              >
                All portfolios
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {featured.map((image, i) => (
                <Reveal key={image.id} delay={i * 80}>
                  <EditorialImage
                    image={image}
                    sizes="(min-width: 768px) 30rem, 100vw"
                    className="group"
                    imgClassName="hover:scale-[1.03]"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Portfolio previews */}
      <section className="bg-parchment/50 py-section">
        <Container>
          <Reveal className="mb-12 max-w-2xl">
            <p className="eyebrow">Portfolios</p>
            <h2 className="mt-4 text-display-md">A body of work across many chapters</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.slice(0, 6).map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 80}>
                <Link href={`/portfolio/${p.slug}`} className="group block">
                  <EditorialImage
                    image={p.cover}
                    sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 100vw"
                    imgClassName="group-hover:scale-[1.04]"
                  />
                  <div className="mt-4 flex items-baseline justify-between border-b border-hairline pb-3">
                    <h3 className="font-serif text-2xl text-ink">{p.title}</h3>
                    <span className="font-sans text-xs uppercase tracking-widest text-stone-deep transition-transform group-hover:translate-x-1">
                      View →
                    </span>
                  </div>
                  <p className="mt-3 max-w-measure font-sans text-sm leading-relaxed text-stone-deep">
                    {p.intro}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* About intro */}
      <section className="py-section">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <EditorialImage
                image={{
                  id: 'about-intro',
                  src: '/placeholders/about.jpg',
                  width: 1600,
                  height: 2000,
                  alt: 'The photographer at work',
                  layoutHint: 'tall',
                }}
                sizes="(min-width: 768px) 40rem, 100vw"
              />
            </Reveal>
            <Reveal delay={100}>
              <p className="eyebrow">{aboutIntro.title}</p>
              <p className="mt-6 prose-editorial">{aboutIntro.body}</p>
              <div className="mt-8">
                <ButtonLink href="/about" variant="outline">
                  More about the studio
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      {quotes.length > 0 && (
        <section className="border-y border-hairline bg-parchment/50 py-section">
          <Container>
            <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
              {quotes.slice(0, 2).map((t, i) => (
                <Reveal key={i} delay={i * 100} as="figure">
                  <blockquote className="font-serif text-xl leading-relaxed text-ink md:text-2xl">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 font-sans text-xs uppercase tracking-widest text-stone-deep">
                    {t.attribution}
                  </figcaption>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Call to action */}
      <section className="py-section">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-display-md">Let us make something quietly beautiful</h2>
            <p className="mx-auto mt-5 max-w-measure font-sans text-base leading-relaxed text-stone-deep">
              Commissions are taken on a considered basis. Do get in touch to discuss your day, your
              family or your brand.
            </p>
            <div className="mt-9">
              <ButtonLink href="/contact" variant="primary">
                Begin an enquiry
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
