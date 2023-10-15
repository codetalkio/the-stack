import { test, expect } from "@playwright/test";

const SERVER = `https://${process.env.DOMAIN}`;

test("localization translates text when changing language", async ({
  page,
}) => {
  await page.goto(`${SERVER}/`);
  await expect(page.locator("h1")).toHaveText("Welcome!");

  await page.getByText("Go to fr").dblclick();
  await expect(page.locator("h1")).toHaveText("Bienvenue!");
});

test("localization loads correct text from URL", async ({ page }) => {
  await page.goto(`${SERVER}/fr`);
  await expect(page.locator("h1")).toHaveText("Bienvenue!");
});
