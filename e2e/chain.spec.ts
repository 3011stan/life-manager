import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 007: the goal chain. Its own account and far-future weeks, so runs never
// share a period and no earlier one has to be closed first.
const ALLOWED = process.env.E2E_CYCLES_EMAIL ?? "e2e-cycles@example.test";

function uniqueSunday(): string {
  const base = Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 280_000) * 7 * 86_400_000;
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

test("a task of a tracked activity credits its year goal through new week and month goals, and links go one level up (US1, US2, US3)", async ({ page }) => {
  const week = uniqueSunday();
  const stamp = String(Date.now());
  const activity = `Reading ${stamp}`;
  const goal = `Read books ${stamp}`;
  await signIn(page, "/catalog");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("Activity name").fill(activity);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(activity)).toBeVisible();

  // A year goal that tracks the activity, and nothing below it.
  await page.goto(`/cycles?h=year&date=${week}`);
  await page.getByRole("button", { name: "Add objective" }).click();
  await page.getByLabel("Objective", { exact: true }).fill(goal);
  await page.getByLabel("Times").fill("12");
  await page.getByLabel(activity).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("objective-row").filter({ hasText: goal })).toContainText("0 / 12");

  // Doing the task once builds the week and the month goals (E2).
  await page.goto(`/day?date=${week}`);
  await page.getByLabel("New entry").fill(activity);
  await page.getByRole("button", { name: new RegExp(`^${activity}`) }).click();
  await page.getByRole("button", { name: `Mark ${activity} done` }).click();
  const row = page.getByTestId("entry-row").filter({ hasText: activity });
  await expect(row.getByLabel("Counts for an objective")).toBeVisible();

  // "Counts for": one path, each goal once (FR-011).
  await row.locator(".entry-row__main").click();
  const chain = page.getByTestId("objective-chain");
  await expect(chain).toHaveCount(1);
  await expect(chain.locator("li")).toHaveCount(3);
  await expect(chain.locator("li").nth(0)).toContainText(activity);
  await expect(chain.locator("li").nth(0)).toContainText("Week");
  await expect(chain.locator("li").nth(1)).toContainText(`${goal} · `);
  await expect(chain.locator("li").nth(1)).toContainText("Month");
  await expect(chain.locator("li").nth(2)).toContainText(goal);
  await expect(chain.locator("li").nth(2)).toContainText("Year");

  // The task's picker offers only this week's goals (FR-002, E3).
  await page.getByRole("button", { name: "More" }).click();
  const picker = page.getByRole("dialog").getByRole("group", { name: "This week's goals it counts for" });
  await picker.getByRole("button", { name: "Add a goal" }).click();
  await picker.getByLabel("Find a goal").fill(stamp);
  await expect(picker.locator(".picker__option").filter({ hasText: activity })).toBeVisible();
  await expect(picker.locator(".picker__option").filter({ hasText: activity })).toContainText(`${goal} · `);
  await expect(picker.locator(".picker__option .picker__name").filter({ hasText: new RegExp(`^${goal}`) })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.goto(`/cycles?h=year&date=${week}`);
  await expect(page.getByTestId("objective-row").filter({ hasText: goal })).toContainText("1 / 12");

  // A week goal counts only for goals of its month (FR-001).
  await page.goto(`/cycles?h=week&date=${week}`);
  await page.getByTestId("objective-row").filter({ hasText: activity }).locator(".entry-row__main").click();
  const parents = page.getByRole("dialog").getByRole("group", { name: "Counts for (Month)" });
  await expect(parents.getByTestId("goal-picker-chosen")).toContainText(`${goal} · `);
  await parents.getByRole("button", { name: "Add a goal" }).click();
  await parents.getByLabel("Find a goal").fill(stamp);
  await expect(parents.getByText("No goal matches.")).toBeVisible();
});
