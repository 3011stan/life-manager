import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 005 FR-014, SC-004: every screen passes WCAG AA checks in both themes.
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

function uniqueDate(): string {
  const day = new Date(Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 2_000_000) * 86_400_000);
  return day.toISOString().slice(0, 10);
}

async function signIn(page: Page, date: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(`/day?date=${date}`)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByLabel("New entry")).toBeVisible();
}

async function audit(page: Page, path: string, ready: () => Promise<void>) {
  await page.goto(path);
  await ready();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map((v) => `${path}: ${v.id} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`every screen passes axe in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const date = uniqueDate();
    await signIn(page, date);
    await page.getByLabel("New entry").fill("Accessible entry");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByTestId("entry-row")).toHaveCount(1);

    await audit(page, `/day?date=${date}`, () => expect(page.getByTestId("entry-row")).toHaveCount(1));
    await audit(page, `/day/close?date=${date}`, () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/cycles?h=week&date=current", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/catalog", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/templates", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/settings", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/account", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
  });
}
