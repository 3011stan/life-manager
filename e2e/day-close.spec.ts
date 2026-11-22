import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

function uniqueDate(): string {
  // Days far apart from 2100 to about 7500, so runs practically never meet.
  const day = new Date(Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 2_000_000) * 86_400_000);
  return day.toISOString().slice(0, 10);
}

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
}

async function add(page: Page, title: string) {
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();
}

test("close a day: resolve, read the scores, carry one, drop one (US4, US5)", async ({ page }) => {
  const date = uniqueDate();
  await signIn(page, `/day?date=${date}`);
  await expect(page.getByLabel("New entry")).toBeVisible();
  for (const title of ["Deep work", "Errands", "Gym class", "Optional call"]) await add(page, title);

  // Log something that already happened.
  await page.getByLabel("Log done").check();
  await add(page, "Helped a friend");
  await page.getByLabel("Log done").uncheck();

  await page.getByRole("link", { name: "Close the day" }).click();
  await expect(page.getByRole("heading", { name: "Still planned" })).toBeVisible();
  const resolve = async (title: string, status: string) => {
    await page.locator(".resolve-row").filter({ hasText: title }).getByRole("button", { name: status }).click();
    await expect(page.locator(".resolve-row").filter({ hasText: title })).toHaveCount(0);
  };
  await resolve("Deep work", "Done");
  await resolve("Errands", "Skipped");
  await resolve("Gym class", "Cancelled");
  await resolve("Optional call", "Skipped");

  // execution = 30 / (30 + 30 + 30) with default 30-minute entries.
  await expect(page.getByText("Execution")).toBeVisible();
  await expect(page.locator(".score").first()).toContainText("33%");
  await page.locator(".score").first().locator("summary").click();
  await expect(page.locator(".score").first()).toContainText("Deep work: 30m of 30m");

  // Candidates follow the day's order: Errands, then Optional call.
  const carries = page.getByTestId("carry-row");
  await expect(carries).toHaveCount(2);
  await expect(carries.nth(0).getByLabel("Title")).toHaveValue("Errands");
  await carries.nth(0).getByLabel("Title").fill("Errands, part two");
  await carries.nth(0).getByRole("button", { name: "Carry" }).click();
  await carries.nth(1).getByRole("button", { name: "Drop" }).click();
  await page.getByRole("radiogroup", { name: "Satisfaction" }).getByRole("radio", { name: "4" }).click();
  await page.getByLabel("Notes").fill("A decent day.");
  await page.getByRole("button", { name: "Close the day" }).click();

  await expect(page.getByText(/Day closed/)).toBeVisible();
  await expect(page.getByText(/Execution 33%/)).toBeVisible();
  await page.getByRole("button", { name: "Next day" }).click();
  await expect(page.getByTestId("entry-row")).toHaveCount(1);
  await expect(page.getByTestId("entry-row")).toContainText("Errands, part two");

  // Regression (004 finding 12): copying the closed day again must not
  // duplicate what was carried.
  await page.getByRole("button", { name: "Copy from another day" }).click();
  await expect(page.locator(".check-list li").filter({ hasText: "Errands" }).getByText("already on this day")).toBeVisible();
  await page.getByRole("button", { name: "Copy selected" }).click();
  await expect(page.getByTestId("entry-row").filter({ hasText: "Errands" })).toHaveCount(1);
});

test("planning today waits for yesterday's close; logging does not (Rule Zero)", async ({ page }, testInfo) => {
  // Both projects share the real yesterday, so only one may run this.
  test.skip(testInfo.project.name !== "desktop", "uses the shared real yesterday");
  await signIn(page, "/day");
  await expect(page.getByLabel("New entry")).toBeVisible();
  await page.getByRole("button", { name: "Previous day" }).click();
  await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
  await add(page, `Yesterday ${String(Date.now())}`);
  const yesterdayRow = page.getByTestId("entry-row").last();
  await yesterdayRow.getByRole("button", { name: /^Mark .* done$/ }).click();
  await page.getByRole("button", { name: "Today" }).click();

  await expect(page.getByText(/before planning today/)).toBeVisible();
  await expect(page.getByLabel("New entry")).toBeDisabled();
  await page.getByLabel("Log done").check();
  await expect(page.getByLabel("New entry")).toBeEnabled();
  await page.getByLabel("Log done").uncheck();

  await page.getByRole("link", { name: /^Close / }).click();
  await page.getByRole("button", { name: "Close the day" }).click();
  await expect(page.getByText(/Day closed/)).toBeVisible();
  await page.getByRole("button", { name: "Today" }).click();
  await expect(page.getByLabel("New entry")).toBeEnabled();
});

test("a reopened day's close starts from its saved check-in and notes, and closing again keeps them (009b)", async ({ page }) => {
  const date = uniqueDate();
  await signIn(page, `/day?date=${date}`);
  await expect(page.getByLabel("New entry")).toBeVisible();
  await page.getByLabel("Log done").check();
  await add(page, "Morning walk");

  const checkInOf = (name: string, value: string) => page.getByRole("radiogroup", { name }).getByRole("radio", { name: value, exact: true });
  const closeOnce = async () => {
    await page.getByRole("link", { name: "Close the day" }).click();
    await expect(page.getByRole("heading", { name: /^Close / })).toBeVisible();
  };

  await closeOnce();
  await checkInOf("Physical energy", "2").click();
  await checkInOf("Satisfaction", "4").click();
  await page.getByLabel("Notes").fill("Slept badly, still a good day.");
  await page.getByRole("button", { name: "Close the day" }).click();
  await expect(page.getByText(/Day closed/)).toBeVisible();

  // A task added later reopens the day (FR-024); its check-in stays.
  for (const title of ["Called a friend", "Read a chapter"]) {
    await page.getByLabel("Log done").check();
    await add(page, title);
    await closeOnce();
    await expect(checkInOf("Physical energy", "2")).toHaveAttribute("aria-checked", "true");
    await expect(checkInOf("Satisfaction", "4")).toHaveAttribute("aria-checked", "true");
    await expect(checkInOf("Mental energy", "3")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByLabel("Notes")).toHaveValue("Slept badly, still a good day.");
    // Closing again without touching them keeps them, as the next pass checks.
    await page.getByRole("button", { name: "Close the day" }).click();
    await expect(page.getByText(/Day closed/)).toBeVisible();
  }
});
