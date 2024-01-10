import { expect, test } from '@playwright/test';

const SERVER = process.env.UI_INTERNAL_E2E_URL ?? `https://internal.${process.env.DOMAIN}`;

test('localization translates text when changing language', async ({ page }) => {
  await page.goto(`${SERVER}/`);
  await expect(page.locator('h1')).toHaveText('Welcome!');

  await page.getByText('Go to fr').dblclick();
  await expect(page.locator('h1')).toHaveText('Bienvenue!');
});

test('localization loads correct text from URL', async ({ page }) => {
  await page.goto(`${SERVER}/fr`);
  await expect(page.locator('h1')).toHaveText('Bienvenue!');
});
