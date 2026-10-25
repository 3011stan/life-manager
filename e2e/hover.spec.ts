import { expect, test, type Locator, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 005 feedback: rows and controls answer the pointer and the keyboard.
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

const background = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);

for (const colorScheme of ["light", "dark"] as const) {
  test(`a catalog activity row changes on hover (pointer only) and on keyboard focus (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await signIn(page, "/catalog");
    const row = page.getByTestId("activity-list").locator(".activity-row").first();
    await expect(row).toBeVisible();
    await page.mouse.move(0, 0);
    const rest = await background(row);

    // On a touch screen hover stays off, so a tapped row is not left tinted.
    const canHover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
    await row.hover();
    if (canHover) await expect.poll(() => background(row)).not.toBe(rest);
    else expect(await background(row)).toBe(rest);

    await page.mouse.move(0, 0);
    await expect.poll(() => background(row)).toBe(rest);
    await row.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect.poll(() => background(row)).not.toBe(rest);
  });
}
