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
    // Reduced motion turns transitions off, so colors are read at rest.
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    const date = uniqueDate();
    await signIn(page, date);
    await page.getByLabel("New entry").fill("Accessible entry");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByTestId("entry-row")).toHaveCount(1);

    await audit(page, `/day?date=${date}`, () => expect(page.getByTestId("entry-row")).toHaveCount(1));
    // The short entry sheet, open with "More" (005 D2).
    await page.getByTestId("entry-row").locator(".entry-row__main").click();
    await page.getByRole("button", { name: "More" }).click();
    const sheet = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(sheet.violations.map((v) => `sheet: ${v.id}`)).toEqual([]);
    await page.keyboard.press("Escape");
    await audit(page, `/day/close?date=${date}`, () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/cycles", () => expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible());
    // 006: the event sheet, with a weekly repeat's day chips showing.
    await page.getByRole("button", { name: "Add event" }).click();
    await page.getByRole("dialog").getByLabel("Repeat").selectOption("weekly");
    await page.getByRole("dialog").getByRole("button", { name: "Mon", exact: true }).click();
    const eventSheet = await new AxeBuilder({ page }).include("dialog").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(eventSheet.violations.map((v) => `event sheet: ${v.id} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
    await page.keyboard.press("Escape");
    await audit(page, "/cycles?h=week&date=current", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/catalog", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/templates", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/settings", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
    await audit(page, "/account", () => expect(page.getByRole("heading", { level: 1 })).toBeVisible());
  });
}
