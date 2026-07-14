import { test, expect } from '@playwright/test';

/**
 * Public site smoke tests. Run against a built, seeded instance:
 *   npm run build && npm run start   (in one terminal)
 *   npm run test:e2e                 (in another)
 */

test('homepage renders the hero and primary navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Olivia Saunders/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /View the portfolio/i })).toBeVisible();
});

test('portfolio index lists collections and links to a detail page', async ({ page }) => {
  await page.goto('/portfolio');
  await expect(page.getByRole('heading', { name: /A collection of chapters/i })).toBeVisible();
  const firstCollection = page.getByRole('link', { name: /View →/ }).first();
  await firstCollection.click();
  await expect(page).toHaveURL(/\/portfolio\/.+/);
});

test('contact page shows the enquiry form', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: /Send enquiry/i })).toBeVisible();
});

test('legal pages are reachable', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
});

test('protected areas redirect to the login page', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login/);
});
