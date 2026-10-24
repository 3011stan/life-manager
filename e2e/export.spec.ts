import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// US4 / SC-004. One export runs at a time per account (409 otherwise), so each
// project uses its own account and the tests in this file run one by one.
// Allow-list both emails locally first:
//   npm run allow-email -- e2e-export-desktop@example.test   (backend)
//   npm run allow-email -- e2e-export-mobile@example.test
test.describe.configure({ mode: "serial" });

let ALLOWED = "";
test.beforeEach(({}, testInfo) => {
  ALLOWED = `e2e-export-${testInfo.project.name}@example.test`;
});

async function signInToAccount(page: Page) {
  await page.goto("/sign-in?next=/account");
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
}

test("exports JSON with the account's settings (FR-017)", async ({ page }) => {
  await signInToAccount(page);
  const started = Date.now();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const file = await download;
  expect(Date.now() - started).toBeLessThan(60_000);
  expect(file.suggestedFilename()).toMatch(/^life-manager-export-\d{4}-\d{2}-\d{2}\.json$/);

  const body = JSON.parse(await readFile(await file.path(), "utf8")) as {
    formatVersion: number;
    account: { email: string };
    workspace: { settings: { timeZone: string } };
  };
  expect(body.formatVersion).toBe(4);
  expect(body.account.email).toBe(ALLOWED);
  expect(body.workspace.settings.timeZone).toBeTruthy();
  await expect(page.getByText("Export downloaded.")).toBeVisible();
});

test("exports Markdown (FR-018)", async ({ page }) => {
  await signInToAccount(page);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^life-manager-export-\d{4}-\d{2}-\d{2}\.md$/);
  const text = await readFile(await file.path(), "utf8");
  expect(text).toContain("# Life Manager Export");
  expect(text).toContain(`- Email: ${ALLOWED}`);
});

test("the account page fits a 390px screen (SC-009)", async ({ page }) => {
  await signInToAccount(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  for (const name of ["Export JSON", "Export Markdown", "Sign out"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
