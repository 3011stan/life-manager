import { expect, test } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

// 004 US5: a flat, searchable list that shows which activities carry parts.
test("search activities and see the parts of a block activity", async ({ page }) => {
  await page.goto("/sign-in?next=/catalog");
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByRole("heading", { name: "Activities" })).toBeVisible();

  const name = `Gym block ${String(Date.now())}`;
  await page.getByRole("button", { name: "Add activity" }).click();
  await page.getByLabel("Activity name").fill(name);
  for (const minutes of ["30m", "1h", "30m"]) {
    await page.getByRole("button", { name: "Add segment" }).click();
    await page.locator(".segment-edit").last().getByLabel("Minutes").fill(minutes);
  }
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByLabel("Search activities").fill(name.slice(0, 12).toLowerCase());
  const list = page.getByTestId("activity-list");
  await expect(list.getByRole("button", { name: new RegExp(name) })).toContainText("2h · 3 parts");
  await page.getByLabel("Search activities").fill("zzzz-nothing");
  await expect(list.getByRole("button")).toHaveCount(0);
});
