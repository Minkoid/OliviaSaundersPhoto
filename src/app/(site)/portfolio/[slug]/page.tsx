import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { EditorialLayout } from '@/components/media/editorial-layout';
import { getPortfolioBySlug, getPortfolioSlugs } from '@/lib/portfolio';

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getPortfolioSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const portfolio = await getPortfolioBySlug(params.slug);
  if (!portfolio) return { title: 'Portfolio' };
  return {
    title: portfolio.title,
    description: portfolio.intro || `${portfolio.title} photography by Olivia Saunders.`,
    alternates: { canonical: `/portfolio/${portfolio.slug}` },
    openGraph: {
      title: portfolio.title,
      description: portfolio.intro,
      images: portfolio.images[0] ? [{ url: portfolio.images[0].src }] : undefined,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const portfolio = await getPortfolioBySlug(params.slug);
  if (!portfolio) notFound();

  return (
    <>
      <section className="pt-36 md:pt-44">
        <Container>
          <Reveal className="max-w-3xl">
            <Link
              href="/portfolio"
              className="font-sans text-xs uppercase tracking-widest text-stone-deep hover:text-charcoal"
            >
              ← All portfolios
            </Link>
            <p className="eyebrow mt-8">{portfolio.category}</p>
            <h1 className="mt-4 text-display-lg">{portfolio.title}</h1>
            {portfolio.description && (
              <p className="mt-6 prose-editorial">{portfolio.description}</p>
            )}
          </Reveal>
        </Container>
      </section>

      <section className="py-section">
        <EditorialLayout images={portfolio.images} />
      </section>

      <section className="pb-section">
        <Container>
          <Reveal className="mx-auto max-w-2xl border-t border-hairline pt-16 text-center">
            <p className="eyebrow">Enquiries</p>
            <h2 className="mt-4 text-display-md">Considering a commission?</h2>
            <p className="mx-auto mt-5 max-w-measure font-sans text-base leading-relaxed text-stone-deep">
              If this work resonates, I would love to hear about yours. Every commission begins with
              an unhurried conversation.
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
