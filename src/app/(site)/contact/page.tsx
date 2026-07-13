import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { ContactForm } from '@/components/forms/contact-form';
import { getSiteSettings } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Make an enquiry about a wedding, portrait, family or commercial commission.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const social = [
    { url: settings.instagramUrl, label: 'Instagram' },
    { url: settings.pinterestUrl, label: 'Pinterest' },
    { url: settings.facebookUrl, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <section className="pt-36 md:pt-44">
      <Container>
        <div className="grid gap-14 pb-section lg:grid-cols-[1fr_1.3fr] lg:gap-24">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-5 text-display-lg">Make an enquiry</h1>
            <p className="mt-6 max-w-measure font-sans text-base leading-relaxed text-stone-deep">
              I would love to hear about your plans. Please share a few details and I will reply
              personally.
            </p>

            <dl className="mt-12 space-y-8">
              {settings.contactEmail && (
                <div>
                  <dt className="eyebrow">Email</dt>
                  <dd className="mt-2">
                    <a href={`mailto:${settings.contactEmail}`} className="link-underline font-serif text-xl">
                      {settings.contactEmail}
                    </a>
                  </dd>
                </div>
              )}
              {settings.areasServed && (
                <div>
                  <dt className="eyebrow">Areas served</dt>
                  <dd className="mt-2 max-w-measure font-sans text-sm leading-relaxed text-charcoal">
                    {settings.areasServed}
                  </dd>
                </div>
              )}
              {settings.studioLocation && (
                <div>
                  <dt className="eyebrow">Studio</dt>
                  <dd className="mt-2 font-sans text-sm text-charcoal">{settings.studioLocation}</dd>
                </div>
              )}
              {settings.responseTime && (
                <div>
                  <dt className="eyebrow">Response time</dt>
                  <dd className="mt-2 font-sans text-sm text-charcoal">{settings.responseTime}</dd>
                </div>
              )}
              {social.length > 0 && (
                <div>
                  <dt className="eyebrow">Elsewhere</dt>
                  <dd className="mt-2 flex gap-5">
                    {social.map((s) => (
                      <a
                        key={s.label}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-xs uppercase tracking-widest text-charcoal hover:text-olive"
                      >
                        {s.label}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Reveal>

          <Reveal delay={100} className="border border-hairline bg-parchment/30 p-8 md:p-12">
            <ContactForm />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
