/**
 * Capture screenshots of the running app for review/documentation.
 *
 * Usage:
 *   1. Build, seed and start the app (see README).
 *   2. SHOT_GALLERY_ID=<gallery id> node scripts/screenshots.mjs
 *
 * Env:
 *   SHOT_BASE        base URL (default http://127.0.0.1:3000)
 *   SHOT_OUT         output directory (default ./screenshots)
 *   SHOT_GALLERY_ID  a gallery id to capture the admin edit page
 *   SHOT_ONLY        comma-separated name filter (e.g. "home,gallery")
 *
 * Requires the seed logins; auth pages are captured by logging in via the
 * Auth.js credentials API and injecting the session cookie (reliable headless).
 */
import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUT = process.env.SHOT_OUT ?? path.resolve(process.cwd(), 'screenshots');
const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:3000';
const GID = process.env.SHOT_GALLERY_ID;

const ADMIN = { email: 'admin@example.com', password: 'ChangeMe!Admin123' };
const CLIENT = { email: 'eleanor@example.com', password: 'ChangeMe!Client123' };

async function revealAll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += Math.round(window.innerHeight * 0.8);
        if (y < document.body.scrollHeight) setTimeout(step, 50);
        else {
          window.scrollTo(0, 0);
          setTimeout(resolve, 200);
        }
      };
      step();
    });
  });
}

function parseSetCookie(headers) {
  // Node fetch exposes multiple Set-Cookie via getSetCookie().
  const raw = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  const jar = {};
  for (const line of raw) {
    const [pair] = line.split(';');
    const idx = pair.indexOf('=');
    if (idx > -1) jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Log in via the Auth.js credentials API (reliable, no UI hydration needed) and
 * return the resulting cookies to inject into a browser context.
 */
async function apiLoginCookies(creds) {
  const jar = {};
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  Object.assign(jar, parseSetCookie(csrfRes.headers));
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({
    csrfToken,
    email: creds.email,
    password: creds.password,
    redirect: 'false',
  });
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar) },
    body,
    redirect: 'manual',
  });
  Object.assign(jar, parseSetCookie(loginRes.headers));

  const host = new URL(BASE).hostname;
  return Object.entries(jar)
    .filter(([k]) => k.includes('authjs') || k.includes('session'))
    .map(([name, value]) => ({
      name,
      value,
      domain: host,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }));
}

/** Each capture runs in its own browser process for reliability under headless. */
async function captureOne({ name, url, auth, mobile }) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: !!mobile,
      reducedMotion: 'reduce',
    });
    if (auth) {
      const cookies = await apiLoginCookies(auth);
      if (cookies.length) await ctx.addCookies(cookies);
    }
    const page = await ctx.newPage();
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // Force scroll-reveal content visible (IntersectionObserver reveals don't
    // reliably fire during synthetic capture in the headless shell).
    await page.addStyleTag({
      content: '*{opacity:1 !important;transform:none !important;transition:none !important;animation:none !important;}',
    });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => ({
      len: document.body.innerText.trim().length,
      imgs: document.images.length,
    }));
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log('  \u2713', name, `(${url})  text=${info.len} imgs=${info.imgs}`);
  } finally {
    await browser.close();
  }
}

const shots = [
  { name: '01-home', url: '/' },
  { name: '02-portfolio', url: '/portfolio' },
  { name: '03-portfolio-weddings', url: '/portfolio/weddings' },
  { name: '04-about', url: '/about' },
  { name: '05-contact', url: '/contact' },
  { name: '06-login', url: '/login' },
  { name: '07-client-account', url: '/account', auth: CLIENT },
  { name: '08-client-gallery', url: '/gallery/eleanor-and-james', auth: CLIENT },
  { name: '09-admin-dashboard', url: '/admin', auth: ADMIN },
  { name: '10-admin-galleries', url: '/admin/galleries', auth: ADMIN },
  ...(GID ? [{ name: '11-admin-gallery-edit', url: `/admin/galleries/${GID}`, auth: ADMIN }] : []),
  { name: '12-mobile-home', url: '/', mobile: true },
];

const run = async () => {
  await fs.mkdir(OUT, { recursive: true });
  const only = process.env.SHOT_ONLY ? process.env.SHOT_ONLY.split(',') : null;
  const selected = only ? shots.filter((s) => only.some((o) => s.name.includes(o))) : shots;
  for (const s of selected) {
    // Retry once on failure/blank.
    try {
      await captureOne(s);
    } catch (e) {
      console.log('  ! retry', s.name, e.message);
      await captureOne(s);
    }
  }
  console.log('Done.');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
