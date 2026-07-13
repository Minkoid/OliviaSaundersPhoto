import Script from 'next/script';
import { publicEnv } from '@/lib/env';

/**
 * Optional privacy-conscious analytics. Renders nothing unless explicitly
 * configured. Only Plausible (cookieless) is wired by default; no personal
 * data or cross-site tracking is used.
 */
export function Analytics() {
  if (
    publicEnv.NEXT_PUBLIC_ANALYTICS_DRIVER !== 'plausible' ||
    !publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  ) {
    return null;
  }
  return (
    <Script
      defer
      data-domain={publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
