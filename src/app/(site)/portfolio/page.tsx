import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { EditorialImage } from '@/components/media/editorial-image';
import { getPublishedPortfolios } from '@/lib/portfolio';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Selected photography across weddings, portraits, families, country life and editorial commissions.',
  alternates: { canonical: '/portfolio' },
};

export default async function PortfolioIndexPage() {
  const portfolios = await getPublishedPortfolios();

  return (
    <>
      <section className="pt-36 md:pt-44">
        <Container>
          <Reveal className="max-w-3xl">
            <p className="eyebrow">Portfolio</p>
            <h1 className="mt-5 text-display-lg">A collection of chapters</h1>
            <p className="mt-6 max-w-measure font-sans text-base leading-relaxed text-stone-deep">
              Each portfolio gathers a distinct kind of work. Explore the collections below, or make
              an enquiry to discuss a commission of your own.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-section">
        <Container>
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 70}>
                <Link href={`/portfolio/${p.slug}`} className="group block">
                  <EditorialImage
                    image={p.cover}
                    sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 100vw"
                    imgClassName="group-hover:scale-[1.04]"
                  />
                  <div className="mt-4 flex items-baseline justify-between border-b border-hairline pb-3">
                    <h2 className="font-serif text-2xl text-ink">{p.title}</h2>
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
    </>
  );
}
