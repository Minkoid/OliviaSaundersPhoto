import { ImageResponse } from 'next/og';
import { getSiteSettings } from '@/lib/content';

export const runtime = 'nodejs';
export const alt = 'Olivia Saunders — Photography';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default social sharing image, rendered with the brand palette and serif
 * wordmark. Individual pages inherit this unless they define their own.
 */
export default async function OpengraphImage() {
  const settings = await getSiteSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f6f1e7',
          color: '#1b1a17',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 14,
            textTransform: 'uppercase',
            color: '#5c5c3d',
          }}
        >
          {settings.tagline}
        </div>
        <div style={{ fontSize: 96, marginTop: 24 }}>{settings.studioName}</div>
        <div style={{ width: 80, height: 1, backgroundColor: '#7a7264', marginTop: 40 }} />
        <div style={{ fontSize: 26, marginTop: 40, color: '#2b2925' }}>Photography</div>
      </div>
    ),
    { ...size },
  );
}
