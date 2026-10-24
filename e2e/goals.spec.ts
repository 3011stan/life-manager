import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 005 US3, US4: plan from the top, a goal under two goals above, rhythms.
// Its own account and a random far-future year, so runs never share a period.
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

async function newActivity(page: Page, name: string) {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("Activity name").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Activity name")).toHaveCount(0);
}

async function topGoal(page: Page, title: string) {
  await page.getByRole("textbox", { name: "New goal" }).fill(title);
  await page.getByLabel("Horizon").selectOption({ label: "5 years" });
  await page.getByRole("button", { name: "Add goal" }).click();
  await expect(page.getByLabel("Objective", { exact: true })).toHaveValue(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("goal-card").filter({ hasText: title })).toBeVisible();
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Objective", { exact: true })).toHaveCount(0);
}

test("a year goal under two 5-year goals credits both; its rhythm makes the weekly goal (US3, US4)", async ({ page }) => {
  const year = uniqueYear();
  const date = `${String(year)}-06-15`;
  const stamp = String(Date.now());
  const [fluent, travel, classes, activity] = [`Fluent ${stamp}`, `Travel ${stamp}`, `Classes ${stamp}`, `Class ${stamp}`];
  await signIn(page, "/catalog");
  await newActivity(page, activity);

  await page.goto(`/cycles?date=${date}`);
  await expect(page.getByRole("heading", { name: "Goals" })).toBeVisible();
  await topGoal(page, fluent);
  await topGoal(page, travel);

  // "+ Goal" under a 5-year goal creates the year goal already linked.
  const fluentCard = page.getByTestId("goal-card").filter({ hasText: fluent });
  await fluentCard.getByRole("button", { name: `Goals under ${fluent}` }).click();
  await fluentCard.getByRole("button", { name: "Goal", exact: true }).click();
  await page.getByLabel("Objective", { exact: true }).fill(classes);
  await page.getByLabel("Times").fill("104");
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("checkbox", { name: activity }).check();
  await expect(sheet.getByRole("checkbox", { name: new RegExp(`^${fluent}`) })).toBeChecked();
  await sheet.getByRole("checkbox", { name: new RegExp(`^${travel}`) }).check();
  // 005 D7: the rhythm suggestion reaches the target (104 a year → 2 a week).
  await page.getByLabel("Rhythm").selectOption("week");
  await expect(page.getByRole("spinbutton", { name: "Times" }).last()).toHaveValue("2");
  await save(page);

  const travelCard = page.getByTestId("goal-card").filter({ hasText: travel });
  await travelCard.getByRole("button", { name: `Goals under ${travel}` }).click();
  await expect(travelCard.getByTestId("goal-node").filter({ hasText: classes })).toBeVisible();
  await expect(travelCard.getByLabel("Also counts for another goal")).toBeVisible();

  // One class done that year credits the year goal and both goals above.
  await page.goto(`/day?date=${date}`);
  await page.getByLabel("New entry").fill(activity);
  await page.getByRole("button", { name: new RegExp(`^${activity}`) }).click();
  await page.getByRole("button", { name: `Mark ${activity} done` }).click();
  await expect(page.getByRole("button", { name: `Mark ${activity} planned` })).toHaveAttribute("aria-pressed", "true");

  await page.goto(`/cycles?date=${date}`);
  // Wait for the fresh tree (the cached one predates the class).
  const fresh = page.getByTestId("goal-card").filter({ hasText: fluent });
  await fresh.getByRole("button", { name: `Goals under ${fluent}` }).click();
  await expect(fresh.getByTestId("goal-node").filter({ hasText: classes }).first()).toContainText("1 / 104", { timeout: 15_000 });
  for (const title of [fluent, travel]) {
    await page.getByTestId("goal-card").filter({ hasText: title }).locator(".goal-card__title").click();
    await expect(page.getByRole("dialog")).toContainText("1 / 3");
    await page.keyboard.press("Escape");
  }

  // The rhythm created this week's goal, linked; removing it sticks for the week.
  const weekly = `${classes} 2×`;
  await page.goto(`/cycles?h=week&date=${date}`);
  const row = page.getByTestId("objective-row").filter({ hasText: weekly });
  await expect(row).toBeVisible();
  await row.locator(".entry-row__main").click();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete objective" }).click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(row).toHaveCount(0);
});
