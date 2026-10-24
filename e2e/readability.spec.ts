import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 004 US3 and US4: rows read at a glance; faster input.
const ALLOWED = process.env.E2E_ALLOWED_EMAIL ?? "e2e@example.test";

function uniqueDate(): string {
  // Days far apart from 2100 to about 7500, so runs practically never meet.
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

async function add(page: Page, title: string) {
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

const row = (page: Page, title: string) => page.getByTestId("entry-row").filter({ hasText: title });

async function save(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
}

async function openSheet(page: Page, title: string) {
  await row(page, title).locator(".entry-row__main").click();
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible();
}

// Regression (004 finding 10): two entries of one activity looked identical.
test("rows show the typed title and the activity only when it differs", async ({ page }) => {
  await signIn(page, uniqueDate());
  await add(page, "Study for AWS");
  await add(page, "Study Spanish");
  for (const title of ["Study for AWS", "Study Spanish"]) {
    await openSheet(page, title);
    await page.getByRole("button", { name: /^Activity:/ }).click();
    await page.getByLabel("Find an activity").fill("Study");
    await page.getByRole("dialog").getByRole("button", { name: /^Study/ }).first().click();
    await save(page);
  }
  await expect(row(page, "Study for AWS")).toContainText("Study for AWS · Study");
  await expect(row(page, "Study Spanish")).toContainText("Study Spanish · Study");
});

test("a heading ending in “:” groups the entries put under it (D1)", async ({ page }) => {
  await signIn(page, uniqueDate());
  await add(page, "JIB:");
  const group = page.getByTestId("group").filter({ hasText: "JIB" });
  await expect(group).toBeVisible();
  for (const title of ["standup", "code review"]) {
    await add(page, title);
    await openSheet(page, title);
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("combobox", { name: /^Group/ }).selectOption({ label: "JIB" });
    await save(page);
  }
  await expect(group.getByTestId("entry-row")).toHaveText([/standup/, /code review/]);
  await expect(group.locator(".group-heading")).toContainText("1h");
  await page.reload();
  await expect(group.getByTestId("entry-row")).toHaveCount(2);
});

test("durations accept hours and minutes (FR-011)", async ({ page }) => {
  await signIn(page, uniqueDate());
  await add(page, "Deep work");
  await openSheet(page, "Deep work");
  await page.getByLabel("Duration", { exact: true }).fill("1h30");
  await save(page);
  await expect(row(page, "Deep work")).toContainText("1h30");
  await openSheet(page, "Deep work");
  await page.getByLabel("Duration", { exact: true }).fill("hello");
  await page.getByLabel("Duration", { exact: true }).blur();
  await expect(page.getByText("Use minutes or hours")).toBeVisible();
});

test("delete from the row, then undo (D4)", async ({ page }, testInfo) => {
  await signIn(page, uniqueDate());
  await add(page, "Keep me");
  await add(page, "Remove me");
  const target = row(page, "Remove me");
  if (testInfo.project.name === "mobile") {
    // A left swipe with touch pointer events reveals Delete.
    const box = await target.boundingBox();
    if (!box) throw new Error("row not visible");
    const swipe = target.locator(".entry-row__swipe");
    const y = box.y + box.height / 2;
    await swipe.dispatchEvent("pointerdown", { pointerType: "touch", clientX: box.x + box.width - 20, clientY: y, isPrimary: true });
    for (const dx of [30, 70, 110]) {
      await swipe.dispatchEvent("pointermove", { pointerType: "touch", clientX: box.x + box.width - 20 - dx, clientY: y, isPrimary: true });
    }
    await swipe.dispatchEvent("pointerup", { pointerType: "touch", clientX: box.x + box.width - 130, clientY: y, isPrimary: true });
  } else {
    await target.hover();
  }
  await target.getByRole("button", { name: "Delete Remove me" }).click();
  await expect(row(page, "Remove me")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(row(page, "Remove me")).toBeVisible();
  await page.reload();
  await expect(row(page, "Remove me")).toBeVisible();
});

// Regression (005, found by e2e under load): Undo sent before the delete landed
// was overtaken by it, and the entry stayed deleted.
test("undo right after a slow delete keeps the entry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "the order of requests is the same on both");
  await signIn(page, uniqueDate());
  await add(page, "Slow delete");
  await page.route("**/v1/entries/*", async (route) => {
    if (route.request().method() === "DELETE") await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  const target = row(page, "Slow delete");
  await target.hover();
  await target.getByRole("button", { name: "Delete Slow delete" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(row(page, "Slow delete")).toBeVisible();
  await page.waitForTimeout(1200);
  // The reload first paints the cached day; wait for the server's answer.
  await Promise.all([page.waitForResponse((r) => r.url().includes("/v1/days/") && r.request().method() === "GET"), page.reload()]);
  await expect(row(page, "Slow delete")).toBeVisible();
});
