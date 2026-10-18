import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// Requires the production build (offline support) and the local API.
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

async function signIn(page: Page) {
  await page.goto("/sign-in?next=/settings");
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
}

test.describe.configure({ mode: "serial" });

test("a change on one device appears on another after refresh (SC-002)", async ({ browser }) => {
  const desktop = await browser.newContext();
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const a = await desktop.newPage();
  const b = await phone.newPage();
  await signIn(a);
  await signIn(b);

  const target = (await a.getByLabel("Week starts on").inputValue()) === "1" ? "Tuesday" : "Monday";
  await a.getByLabel("Week starts on").selectOption({ label: target });
  await save(a);
  await expect(a.getByText("Saved.")).toBeVisible();

  const started = Date.now();
  await b.reload();
  await expect(b.getByLabel("Week starts on")).toHaveValue(target === "Monday" ? "1" : "2");
  expect(Date.now() - started).toBeLessThan(5_000);

  await desktop.close();
  await phone.close();
});

test("an invalid capacity is rejected and the stored value stays", async ({ page }) => {
  await signIn(page);
  const before = await page.getByLabel("Daily capacity (minutes)").inputValue();
  await page.getByLabel("Daily capacity (minutes)").fill("2000");
  await save(page);
  await expect(page.getByText("Check the highlighted fields.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Daily capacity (minutes)")).toHaveValue(before);
});

test("offline shows the last loaded settings read-only with the time (FR-016, SC-011)", async ({ page, context }) => {
  await signIn(page);
  // Let the service worker take control and the cache persist.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 }).catch(async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });
  });
  const weekStart = await page.getByLabel("Week starts on").inputValue();
  await page.waitForTimeout(1_500);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole("status").filter({ hasText: "Offline — showing data from" })).toBeVisible();
  await expect(page.getByLabel("Week starts on")).toHaveValue(weekStart);
  await expect(page.getByLabel("Week starts on")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  await context.setOffline(false);
});

test("settings fit a 390px screen without horizontal scrolling (SC-009)", async ({ page }) => {
  await signIn(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
