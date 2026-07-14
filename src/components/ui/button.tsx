import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'quiet';

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  quiet: 'btn-quiet',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(variantClass[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  className,
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  href: string;
}) {
  const isInternal = href.startsWith('/');
  if (isInternal) {
    return (
      <Link href={href} className={cn(variantClass[variant], className)} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cn(variantClass[variant], className)} {...props}>
      {children}
    </a>
  );
}
