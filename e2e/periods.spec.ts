import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 009: one goal per thing, periods closed in order, tabs that remember, the
// copy dialog, and the tab icon. A random far-future year per test, so runs
// never share a period.
const ALLOWED = process.env.E2E_CYCLES_EMAIL ?? "e2e-cycles@example.test";

function uniqueYear(): number {
  return 2200 + Math.floor(Math.random() * 7000);
}

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

async function addGoal(page: Page, title: string, times = 3) {
  await page.getByRole("button", { name: "Add objective" }).click();
  await page.getByLabel("Objective", { exact: true }).fill(title);
  await page.getByLabel("Times").first().fill(String(times));
  await page.getByRole("button", { name: "Save" }).click();
}

// US3, FR-004: a month cannot close while one of its weeks needs closing.
test("a month's close lists its open week and stays disabled (009 G4)", async ({ page }) => {
  const year = uniqueYear();
  const stamp = String(Date.now());
  await signIn(page, `/cycles?h=week&date=${String(year)}-03-10`);
  await addGoal(page, `Plan ${stamp}`);
  await expect(page.getByTestId("objective-row").filter({ hasText: `Plan ${stamp}` })).toBeVisible();
  await page.goto(`/cycles?h=month&date=${String(year)}-03-01`);
  await addGoal(page, `Month ${stamp}`);
  await expect(page.getByTestId("objective-row").filter({ hasText: `Month ${stamp}` })).toBeVisible();

  await page.goto(`/cycles/close?h=month&date=${String(year)}-03-01`);
  const open = page.getByTestId("open-inside");
  await expect(open).toContainText("Close these first");
  await expect(open.getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Close the cycle" })).toBeDisabled();
  for (const colorScheme of ["light", "dark"] as const) {
    // Reduced motion turns transitions off, so colors are read at rest.
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.reload();
    await expect(page.getByTestId("open-inside")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${colorScheme}: ${v.id} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  }

  // The link opens that week's close.
  await open.getByRole("link").click();
  await expect(page).toHaveURL(/\/cycles\/close\?h=week&date=/);
});

// US2, G9: creating a goal like one the period has asks first.
test("creating a goal like one of the period's asks before making a second (009 G9)", async ({ page }) => {
  const year = uniqueYear();
  const stamp = String(Date.now());
  await signIn(page, `/cycles?h=week&date=${String(year)}-05-12`);
  await addGoal(page, `Stretch ${stamp} 3×`);
  const rows = page.getByTestId("objective-row").filter({ hasText: `Stretch ${stamp}` });
  await expect(rows).toHaveCount(1);

  await addGoal(page, `Stretch ${stamp} 2×`, 2);
  const ask = page.getByTestId("similar-goal");
  await expect(ask).toContainText(`A similar goal already exists in this period: Stretch ${stamp} 3×`);
  await ask.getByRole("button", { name: "Cancel" }).click();
  await expect(ask).toHaveCount(0);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByTestId("similar-goal").getByRole("button", { name: "Create" }).click();
  await expect(rows).toHaveCount(2);
});

// US4, G5: a tab reopens the period last viewed in it.
test("going Year → Month keeps the month viewed (009 G5)", async ({ page }) => {
  const year = uniqueYear();
  await signIn(page, `/cycles?h=month&date=${String(year)}-08-01`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`August ${String(year)}`);
  // The Year tab, never viewed yet, opens the current year, not that month's.
  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d{4}$/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(String(year));
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`August ${String(year)}`);
});

// US4, G6: "already on this day" for copies of copies, from any day picked.
test("the copy dialog knows a task is already here from an older day (009 G6)", async ({ page }) => {
  const year = uniqueYear();
  const [a, b, c] = [`${String(year)}-02-02`, `${String(year)}-02-03`, `${String(year)}-02-04`];
  const title = `Standup ${String(Date.now())}`;
  await signIn(page, `/day?date=${a}`);
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();

  const copyFrom = async (day: string, from: string) => {
    await page.goto(`/day?date=${day}`);
    await page.getByRole("button", { name: "Copy from another day" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Copy entries from").fill(from);
    return dialog;
  };
  let dialog = await copyFrom(b, a);
  await dialog.getByRole("button", { name: "Copy selected" }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();
  dialog = await copyFrom(c, b);
  await dialog.getByRole("button", { name: "Copy selected" }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();

  dialog = await copyFrom(c, a);
  const box = dialog.getByRole("checkbox", { name: new RegExp(title) });
  await expect(box).not.toBeChecked();
  await expect(box).toBeDisabled();
  await expect(dialog).toContainText("already on this day");
});

// US4, G7: the tab icon and the manifest.
test("serves the tab icon, the touch icon, and the manifest (009 G7)", async ({ page, request }) => {
  await signIn(page, "/day");
  await expect(page.locator('head link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
  await expect(page.locator('head link[rel="manifest"]')).toHaveCount(1);
  expect((await request.get("/icon.svg")).status()).toBe(200);
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()) as { name: string }).toMatchObject({ name: "Life Manager" });
  expect((await request.get("/icon-192.png")).status()).toBe(200);
});
