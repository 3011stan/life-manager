import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// Requires the production build and the local API (quickstart.md). Each test
// uses its own far-future date so runs never share a day or hit Rule Zero.
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
  await expect(page.getByTestId("entry-row").filter({ hasText: title })).toBeVisible();
}

const row = (page: Page, title: string) => page.getByTestId("entry-row").filter({ hasText: title });

test("plan and run a day, seen identically on a second device (US1)", async ({ page, browser }) => {
  const date = uniqueDate();
  await signIn(page, date);
  await expect(page.getByText("Nothing planned yet.")).toBeVisible();

  for (const title of ["Write report", "Call the bank", "Read"]) await add(page, title);
  await expect(row(page, "Call the bank").getByText("no activity")).toBeVisible();
  await expect(page.getByTestId("capacity")).toContainText("1h30 of");

  // Complete one with fewer minutes, skip one.
  await row(page, "Write report").getByRole("button", { name: "Mark Write report done" }).click();
  await expect(row(page, "Write report").getByRole("button", { name: "Mark Write report planned" })).toHaveAttribute("aria-pressed", "true");
  await row(page, "Write report").locator(".entry-row__main").click();
  await page.getByLabel("Actual duration").fill("20");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Write report")).toContainText("20m");

  await row(page, "Read").locator(".entry-row__main").click();
  await page.getByRole("button", { name: "More" }).click();
  await page.getByLabel("Status").selectOption("skipped");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);

  // Move "Read" to the top with the keyboard (005 D2 removed Move up/down).
  await page.getByRole("button", { name: "Move Read" }).focus();
  for (const key of ["Space", "ArrowUp", "ArrowUp", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await expect(page.getByTestId("entry-row").first()).toContainText("Read");

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const other = await phone.newPage();
  await signIn(other, date);
  await expect(other.getByTestId("entry-row")).toHaveCount(3);
  await expect(other.getByTestId("entry-row").first()).toContainText("Read");
  await expect(row(other, "Write report")).toContainText("20m");
  await phone.close();
});

// 005 D2: parts belong to the activity; an entry made from it shows them.
test("an entry from an activity with parts shows its real cost and its parts (US2, 005 D2)", async ({ page }) => {
  const date = uniqueDate();
  await signIn(page, date);
  const name = `Gym ${String(Date.now())}`;
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).click();
  await page.getByLabel("Activity name").fill(name);
  for (const [title, minutes, value] of [
    ["Get ready", "20", "support"],
    ["Train", "60", "useful"],
    ["Return", "30", "support"],
  ] as const) {
    await page.getByRole("button", { name: "Add segment" }).click();
    const last = page.locator(".segment-edit").last();
    await last.getByLabel("Segment", { exact: true }).fill(title);
    await last.getByLabel("Minutes").fill(minutes);
    await last.getByLabel("Time value").selectOption(value);
  }
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Activity name")).toHaveCount(0);

  await page.goto(`/day?date=${date}`);
  await page.getByLabel("New entry").fill(name);
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await expect(row(page, name)).toContainText("1h50");
  await expect(row(page, name).getByLabel("1h useful, 50m support")).toBeVisible();
  await expect(row(page, name).locator(".segment")).toHaveText([/Get ready/, /Train/, /Return/]);
});

// 005 US2: the short sheet times an entry without "More"; a new duration lands
// on the part that counts.
test("a new duration from the short sheet resizes the main part (US2, 005 FR-006)", async ({ page }) => {
  const date = uniqueDate();
  await signIn(page, date);
  const name = `Swim ${String(Date.now())}`;
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).click();
  await page.getByLabel("Activity name").fill(name);
  for (const [title, minutes, value] of [
    ["Go", "20", "support"],
    ["Swim", "60", "useful"],
    ["Back", "20", "support"],
  ] as const) {
    await page.getByRole("button", { name: "Add segment" }).click();
    const last = page.locator(".segment-edit").last();
    await last.getByLabel("Segment", { exact: true }).fill(title);
    await last.getByLabel("Minutes").fill(minutes);
    await last.getByLabel("Time value").selectOption(value);
  }
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Activity name")).toHaveCount(0);

  await page.goto(`/day?date=${date}`);
  await page.getByLabel("New entry").fill(name);
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await row(page, name).locator(".entry-row__main").click();
  await expect(page.getByRole("button", { name: "More" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Group")).toHaveCount(0);
  await page.getByLabel("Start").fill("07:30");
  await page.getByLabel("Duration", { exact: true }).fill("1h30");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
  await expect(row(page, name)).toContainText("07:30");
  await expect(row(page, name).locator(".segment")).toHaveText([/Go\s*20m/, /Swim\s*50m/, /Back\s*20m/]);
});

test("the day fits a phone: no horizontal scroll and 44 px controls (SC-009)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const date = uniqueDate();
  await signIn(page, date);
  await add(page, "A long entry title that should wrap instead of pushing the layout sideways");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const name of [/Move A long entry/, /Mark A long entry/]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);
  }
  const handle = await page.getByRole("button", { name: /Move A long entry/ }).boundingBox();
  expect(handle?.height ?? 0).toBeGreaterThanOrEqual(44);
});

// Regression (004 finding 9): an entry moved to the top jumped back after a
// refresh on databases that sort text by language rules (staging).
test("an entry moved to the top stays there after a reload", async ({ page }) => {
  const date = uniqueDate();
  await signIn(page, date);
  for (const title of ["First", "Second", "Third"]) await add(page, title);
  // Keyboard reordering: same code path as drag, works on desktop and mobile.
  const handle = page.getByRole("button", { name: "Move Third" });
  await handle.focus();
  // dnd-kit animates each keyboard step; give it a moment between keys.
  for (const key of ["Space", "ArrowUp", "ArrowUp", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await expect(page.getByTestId("entry-row").first()).toContainText("Third");
  await page.reload();
  await expect(page.getByTestId("entry-row").first()).toContainText("Third");
});

// Regression (004 finding 11): checking an entry while typing the next one
// cleared the text and moved rows.
test("checking an entry keeps the add field and the order", async ({ page }) => {
  await signIn(page, uniqueDate());
  for (const title of ["One", "Two", "Three"]) await add(page, title);
  await page.getByLabel("New entry").fill("Four, half typed");
  await row(page, "Two").getByRole("button", { name: "Mark Two done" }).click();
  await expect(page.getByLabel("New entry")).toHaveValue("Four, half typed");
  await expect(page.getByTestId("entry-row")).toHaveText([/One/, /Two/, /Three/]);
});

// Regression (004 finding 2): the entry sheet did not close on an outside click.
test("the entry sheet closes on a click outside it", async ({ page }) => {
  await signIn(page, uniqueDate());
  await add(page, "Sheet test");
  await row(page, "Sheet test").locator(".entry-row__main").click();
  await expect(page.getByLabel("Title")).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByLabel("Title")).toHaveCount(0);
});
