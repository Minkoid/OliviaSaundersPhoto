import { Container } from '@/components/ui/container';

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <section className="pt-36 md:pt-44">
      <Container>
        <div className="mx-auto max-w-prose pb-section">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-5 text-display-md">{title}</h1>
          <p className="mt-4 font-sans text-xs uppercase tracking-widest text-stone">
            Last updated {updated}
          </p>
          <p className="mt-8 prose-editorial">{intro}</p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-serif text-2xl text-ink">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((p, i) => (
                    <p key={i} className="font-sans text-sm leading-relaxed text-charcoal">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-16 border-t border-hairline pt-8 font-sans text-xs leading-relaxed text-stone-deep">
            This document is a considered placeholder provided for development. It is not legal advice.
            Replace it with policies reviewed by a qualified professional before launch. See
            CONTENT_CHECKLIST.md.
          </p>
        </div>
      </Container>
    </section>
  );
}
