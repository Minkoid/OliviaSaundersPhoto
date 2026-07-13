# Content replacement checklist

Everything below is a **placeholder** shipped for development and design. Replace
it with real, accurate, permissioned content before launch. Nothing here makes
unsupported claims (no invented awards, clients or years of experience) — keep it
that way.

## Business details (Admin → Site content, or `SiteSettings`)

- [ ] Studio name and tagline.
- [ ] Contact email (`studio@example.com` is a placeholder) and phone.
- [ ] Areas served, studio location, expected response time.
- [ ] Social links (Instagram / Pinterest / Facebook) — blank until real.
- [ ] Footer text.
- [ ] SEO default title and description.

## Page copy (Admin → Site content)

- [ ] Homepage: hero heading/body, brand statement, about intro.
- [ ] Homepage testimonials — use only **real, permissioned** quotes and
      attributions (placeholders are generic).
- [ ] About: biography, artistic approach, personal connection.
- [ ] About: press/awards/client-logos area — only add real, permissioned items.

## Photography (Admin → Portfolios / Galleries)

- [ ] Replace **all** generated placeholder plates in `public/placeholders`
      (warm gradient studies — **not** photographs) with real, licensed images.
- [ ] Homepage hero and about images.
- [ ] Portfolio collections, covers, captions and alt text.
- [ ] Ensure alt text is meaningful for accessibility and SEO.
- [ ] Confirm you hold the rights/licences and any necessary model releases.

> Do **not** use copyrighted luxury-brand photography or any third-party assets
> without a licence.

## Legal (routes: `/privacy /cookies /terms /gallery-terms /image-usage`)

- [ ] Replace placeholder legal copy (`src/lib/legal-content.ts`) with policies
      reviewed by a qualified professional for your jurisdiction.
- [ ] Confirm the cookie policy matches what you actually run (analytics on/off).

## Accounts & security

- [ ] Change the seeded admin and client passwords; remove demo accounts.
- [ ] Set a strong `AUTH_SECRET`.
- [ ] Configure real email (`EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`).

## SEO & sharing

- [ ] Review the default Open Graph image (`/opengraph-image`) — it uses the
      studio name/tagline; add a bespoke social image if desired.
- [ ] Add a `favicon.ico` in `public/` (and any app icons you want).
- [ ] Verify canonical URLs and metadata read well for each public page.

## Optional integrations

- [ ] Analytics (Plausible) — enable only with a cookie/consent review.
- [ ] Error monitoring (Sentry) — add DSN and SDK.

## Final review

- [ ] Proofread all copy for tone (warm, personal, understated, British).
- [ ] Remove any remaining `example.com` addresses.
- [ ] Walk the full client journey end-to-end on desktop and mobile.
