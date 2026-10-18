import { expect, test } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// Requires: API with TEST_SIGN_IN_SECRET set and e2e@example.test on the
// allow list; the same secret in E2E_TEST_SIGN_IN_SECRET; web app built with
// NEXT_PUBLIC_TEST_SIGN_IN=true (quickstart.md).
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

test("signed-out visit goes to sign-in and returns after signing in", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fsettings$/);

  await page.getByLabel("Test sign-in email").fill(ALLOWED);

  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByText(ALLOWED)).toBeVisible();
});

test("an email that is not invited is refused", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Test sign-in email").fill(`stranger-${Date.now()}@example.test`);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByText("Access is by invitation only.")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("the Google refusal redirect shows the invitation message", async ({ page }) => {
  await page.goto("/sign-in?error=invitation_only");
  await expect(page.getByText("Access is by invitation only.")).toBeVisible();
});

test("sign-out ends access to the workspace", async ({ page }) => {
  await page.goto("/sign-in?next=/settings");
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByText(ALLOWED)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fsettings$/);
  await expect(page.getByText(ALLOWED)).toHaveCount(0);
});

test("the sign-in screen fits a phone without horizontal scrolling", async ({ page }) => {
  await page.goto("/sign-in");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
