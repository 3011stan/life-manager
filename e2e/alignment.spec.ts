import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 008: alignment you can trust. Far-future days, so runs never meet.
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

function uniqueDate(): string {
  const day = new Date(Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 2_000_000) * 86_400_000);
  return day.toISOString().slice(0, 10);
}

function nextDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

async function addActivity(page: Page, name: string) {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("Activity name").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function add(page: Page, title: string) {
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();
}

// US3.3, FR-004: a new task is offered the activity its title's prefix had.
test("a task with no activity is offered the one past tasks with its prefix used, in one tap (008 US3)", async ({ page }) => {
  const stamp = String(Date.now());
  const client = `Acme${stamp}`;
  const date = uniqueDate();
  await signIn(page, "/catalog");
  await addActivity(page, client);

  // A past task of that activity.
  await page.goto(`/day?date=${date}`);
  await page.getByLabel("New entry").fill(client);
  await page.getByRole("button", { name: new RegExp(`^${client}`) }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: client })).toBeVisible();

  // The next day, "Acme…: daily" with no activity gets the suggestion.
  await page.goto(`/day?date=${nextDay(date)}`);
  const title = `${client}: daily`;
  await add(page, title);
  await page.getByTestId("entry-row").filter({ hasText: title }).locator(".entry-row__main").click();
  const chip = page.getByRole("button", { name: `Use ${client}` });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByRole("button", { name: `Activity: ${client}` })).toBeVisible();
  await expect(chip).toHaveCount(0);
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByTestId("entry-row").filter({ hasText: client }).last().locator(".entry-row__main").click();
  await expect(page.getByRole("button", { name: `Activity: ${client}` })).toBeVisible();
});

// US3.4, US4.2, FR-004, FR-006, FR-007.
test("the close lists done tasks with no activity, fixes them in place, and its Why? reads plainly (008 US3, US4)", async ({ page }) => {
  const stamp = String(Date.now());
  const work = `Work${stamp}`;
  const date = uniqueDate();
  await signIn(page, "/catalog");
  await addActivity(page, work);

  await page.goto(`/day?date=${date}`);
  await page.getByLabel("Log done").check();
  await add(page, `Loose ${stamp}`);
  await page.getByLabel("Log done").uncheck();
  await add(page, `Skip ${stamp}`);

  await page.getByRole("link", { name: "Close the day" }).click();
  await page.locator(".resolve-row").filter({ hasText: `Skip ${stamp}` }).getByRole("button", { name: "Skipped" }).click();

  const list = page.getByTestId("without-activity");
  await expect(page.getByRole("heading", { name: "Done with no activity (1)" })).toBeVisible();
  await expect(list).toHaveCount(1);
  await expect(list).toContainText(`Loose ${stamp}`);

  const alignment = page.locator(".score").nth(1);
  await alignment.locator("summary").click();
  await expect(alignment).toContainText(`Loose ${stamp}: 30m done · 0m toward goals`);
  await expect(alignment).toContainText(`Skip ${stamp}: skipped`);

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map((v) => `${colorScheme}: ${v.id} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  }

  await list.getByRole("button", { name: "Activity: No activity" }).click();
  await list.getByLabel("Find an activity").fill(work);
  await list.getByLabel("Find an activity").press("Enter");
  await expect(list).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Done with no activity/ })).toHaveCount(0);
});
