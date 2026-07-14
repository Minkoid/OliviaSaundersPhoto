import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Shared admin presentational primitives. */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
      <div>
        <h1 className="font-serif text-3xl text-ink md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl font-sans text-sm text-stone-deep">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="border border-hairline bg-parchment/20 p-6 transition-colors hover:bg-parchment/40">
      <p className="font-sans text-xs uppercase tracking-widest text-stone-deep">{label}</p>
      <p className="mt-3 font-serif text-4xl text-ink">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border border-hairline bg-white/40 p-6', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-stone-soft/50 text-charcoal',
    success: 'bg-olive/15 text-olive',
    warning: 'bg-amber-200/40 text-umber',
    danger: 'bg-burgundy/15 text-burgundy',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-hairline p-10 text-center">
      <p className="font-serif text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md font-sans text-sm text-stone-deep">{body}</p>
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
    </label>
  );
}
