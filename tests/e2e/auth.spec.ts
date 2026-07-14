import { test, expect } from '@playwright/test';

/**
 * Client authentication and gallery access journey.
 * Expects seed data (see prisma/seed.ts):
 *   client: eleanor@example.com / ChangeMe!Client123
 */

const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL ?? 'eleanor@example.com';
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD ?? 'ChangeMe!Client123';

test('a client can sign in and view their galleries', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(CLIENT_EMAIL);
  await page.getByLabel('Password').fill(CLIENT_PASSWORD);
  await page.getByRole('button', { name: /Sign in/i }).click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole('heading', { name: /My galleries/i })).toBeVisible();
});

test('invalid credentials show a generic error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(CLIENT_EMAIL);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
});

test('a signed-in client can open an assigned gallery', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(CLIENT_EMAIL);
  await page.getByLabel('Password').fill(CLIENT_PASSWORD);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole('link', { name: /Open →/ }).first().click();
  await expect(page).toHaveURL(/\/gallery\/.+/);
});
