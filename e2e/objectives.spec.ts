import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// Its own account: other specs change the week start day of the shared one.
const ALLOWED = process.env.E2E_CYCLES_EMAIL ?? "e2e-cycles@example.test";

// A random far-future Sunday, so runs never share a week and no earlier week
// has to be closed first.
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

async function newActivity(page: Page, name: string) {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("Activity name").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(name)).toBeVisible();
}

test("a weekly objective counts done entries of its activity and carries at the close (US6, US7)", async ({ page }) => {
  const week = uniqueSunday();
  const activity = `Practice ${String(Date.now())}`;
  await signIn(page, "/catalog");
  await newActivity(page, activity);

  await page.goto(`/cycles?h=week&date=${week}`);
  await page.getByRole("button", { name: "Add objective" }).click();
  await page.getByLabel("Objective", { exact: true }).fill("Practice 3×");
  await page.getByLabel("Times").fill("3");
  await page.getByLabel(activity).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("objective-row").filter({ hasText: "Practice 3×" })).toContainText("0 / 3");

  // Do it once, on the same day the week was opened with (another spec may
  // change the week start day).
  await page.goto(`/day?date=${week}`);
  await page.getByLabel("New entry").fill(activity);
  await page.getByRole("button", { name: new RegExp(`^${activity}`) }).click();
  await page.getByRole("button", { name: `Mark ${activity} done` }).click();
  await expect(page.getByText(/This week: Practice 3× 33%/)).toBeVisible();

  await page.goto(`/cycles?h=week&date=${week}`);
  await expect(page.getByTestId("objective-row").filter({ hasText: "Practice 3×" })).toContainText("1 / 3");

  await page.getByRole("link", { name: "Close the cycle" }).click();
  await page.getByTestId("unfinished").filter({ hasText: "Practice 3×" }).getByRole("button", { name: "Carry" }).click();
  await page.getByRole("button", { name: "Close the cycle" }).click();
  await expect(page.getByText("Closed")).toBeVisible();
  await expect(page.getByTestId("objective-row")).toContainText("Carried");

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("objective-row").filter({ hasText: "Practice 3×" })).toContainText("0 / 3");
});

test("only the first types show until “More types”; a level objective records a measurement (FR-004a)", async ({ page }) => {
  await signIn(page, `/cycles?h=year&date=2095-01-01`);
  await page.getByRole("button", { name: "Add objective" }).click();
  await expect(page.getByRole("button", { name: "Level" })).toHaveCount(0);
  await page.getByRole("button", { name: "More types" }).click();
  await page.getByRole("button", { name: "Level" }).click();
  const title = `Reach C1 ${String(Date.now())}`;
  await page.getByLabel("Objective", { exact: true }).fill(title);
  await page.getByLabel("Levels, in order, comma separated").fill("A2, B1, B2, C1");
  await page.getByLabel("Target level").selectOption("C1");
  await page.getByRole("button", { name: "Save" }).click();

  const row = page.getByTestId("objective-row").filter({ hasText: title });
  await expect(row).toContainText("— → C1");
  await row.locator(".entry-row__main").click();
  await page.getByLabel("New measurement").selectOption("B2");
  await page.getByRole("button", { name: "Record" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(row).toContainText("B2 → C1");
});

test("weekly templates are proposed and become objectives only when accepted (FR-041)", async ({ page }) => {
  const week = uniqueSunday();
  const title = `Template ${String(Date.now())}`;
  await signIn(page, "/templates");
  await page.getByLabel("Objective", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Add template" }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.goto(`/cycles?h=week&date=${week}`);
  const proposal = page.getByTestId("proposal").filter({ hasText: title });
  await expect(proposal).toBeVisible();
  await expect(page.getByTestId("objective-row").filter({ hasText: title })).toHaveCount(0);
  await proposal.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByTestId("objective-row").filter({ hasText: title })).toBeVisible();
  await expect(proposal).toHaveCount(0);

  // Archive it so later runs are not flooded with proposals.
  await page.goto("/templates");
  await page.locator(".catalog-item").filter({ hasText: title }).getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});
