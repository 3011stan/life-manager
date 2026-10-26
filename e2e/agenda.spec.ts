import { expect, test, type Page } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// 006: the agenda. Its own account; weekly items live in a random far-future
// week and end with it, so runs never share a week.
const ALLOWED = process.env.E2E_AGENDA_EMAIL ?? "e2e-agenda@example.test";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (date: string, days: number) => iso(new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000));

function uniqueSunday(): string {
  const d = new Date(Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 280_000) * 7 * 86_400_000);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return iso(d);
}

async function signIn(page: Page, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

async function openAgendaSheet(page: Page) {
  await page.goto("/cycles");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await page.getByRole("button", { name: "Add event" }).click();
  const sheet = page.getByRole("dialog", { name: "New event" });
  await expect(sheet).toBeVisible();
  // A new event starts on the server's today.
  const today = await sheet.getByLabel("Date", { exact: true }).inputValue();
  return { sheet, today };
}

async function openMonth(page: Page, date: string) {
  const label = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const month = page.getByRole("button", { name: new RegExp(`^${label},`) });
  if ((await month.getAttribute("aria-expanded")) === "false") await month.click();
}

async function newActivity(page: Page, name: string) {
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await page.getByLabel("Activity name").fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByLabel("Activity name")).toHaveCount(0);
}

async function pickActivity(sheet: ReturnType<Page["getByRole"]>, name: string) {
  await sheet.getByRole("button", { name: /^Activity:/ }).click();
  await sheet.getByLabel("Find an activity").fill(name);
  await sheet.getByRole("button", { name: new RegExp(`^${name}`) }).click();
}

const row = (page: Page, title: string) => page.getByTestId("entry-row").filter({ hasText: title });

test("an event two months ahead shows in the agenda and on its day, marked as an event (US1)", async ({ page }) => {
  const title = `Wedding ${String(Date.now())}`;
  await signIn(page, "/day");
  const { sheet, today } = await openAgendaSheet(page);
  const date = plus(today, 60);
  await sheet.getByLabel("Title", { exact: true }).fill(title);
  await sheet.getByLabel("Date", { exact: true }).fill(date);
  await sheet.getByLabel("Time", { exact: true }).fill("16:00");
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Its month may be collapsed; open it.
  await openMonth(page, date);
  await expect(page.getByTestId("agenda-row").filter({ hasText: title })).toBeVisible();

  await page.goto(`/day?date=${date}`);
  await expect(row(page, title)).toContainText("16:00");
  await expect(row(page, title).getByLabel("Event")).toBeVisible();
});

test("an event this week becomes a week goal, done when its task is done (US2)", async ({ page }) => {
  const title = `Ceremony ${String(Date.now())}`;
  await signIn(page, "/day");
  const { sheet, today: date } = await openAgendaSheet(page);
  await sheet.getByLabel("Title", { exact: true }).fill(title);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto(`/cycles?h=week&date=${date}`);
  const goal = page.getByTestId("objective-row").filter({ hasText: title });
  await expect(goal).toBeVisible();
  await page.goto(`/day?date=${date}`);
  await page.getByRole("button", { name: `Mark ${title} done` }).click();
  await expect(page.getByRole("button", { name: `Mark ${title} planned` })).toHaveAttribute("aria-pressed", "true");
  await page.goto(`/cycles?h=week&date=${date}`);
  await expect(goal).toContainText("✓", { timeout: 15_000 });
});

test("a Sun–Fri item puts six tasks in its week and its 6× goal is done with the sixth check (US4)", async ({ page }) => {
  const sunday = uniqueSunday();
  const title = `Exercises ${String(Date.now())}`;
  await signIn(page, "/day");
  const { sheet } = await openAgendaSheet(page);
  await sheet.getByLabel("Title", { exact: true }).fill(title);
  await sheet.getByLabel("Repeat").selectOption("weekly");
  await sheet.getByLabel("Starts on").fill(sunday);
  await sheet.getByLabel("Time", { exact: true }).fill("07:00");
  for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]) await sheet.getByRole("button", { name: day, exact: true }).click();
  await sheet.getByLabel("Until").fill(plus(sunday, 6));
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("agenda-row").filter({ hasText: title })).toContainText("Sun–Fri");

  for (let i = 0; i < 6; i++) {
    await page.goto(`/day?date=${plus(sunday, i)}`);
    // The week is applied when its first day opens (D8).
    await expect(row(page, title)).toContainText("07:00", { timeout: 15_000 });
    await page.getByRole("button", { name: `Mark ${title} done` }).click();
    await expect(page.getByRole("button", { name: `Mark ${title} planned` })).toHaveAttribute("aria-pressed", "true");
    if (i === 3) {
      await page.goto(`/cycles?h=week&date=${sunday}`);
      await expect(page.getByTestId("objective-row").filter({ hasText: `${title} 6×` })).toContainText("4 / 6");
    }
  }
  await page.goto(`/day?date=${plus(sunday, 6)}`);
  await expect(page.getByLabel("New entry")).toBeVisible();
  await expect(row(page, title)).toHaveCount(0);
  await page.goto(`/cycles?h=week&date=${sunday}`);
  await expect(page.getByTestId("objective-row").filter({ hasText: `${title} 6×` })).toContainText("6 / 6");
});

test("a daily item with a time is on its day at that time with no action (D8)", async ({ page }) => {
  const sunday = uniqueSunday();
  const title = `Check-in ${String(Date.now())}`;
  await signIn(page, "/day");
  const { sheet } = await openAgendaSheet(page);
  await sheet.getByLabel("Title", { exact: true }).fill(title);
  await sheet.getByLabel("Repeat").selectOption("weekly");
  await sheet.getByLabel("Starts on").fill(sunday);
  await sheet.getByLabel("Time", { exact: true }).fill("08:30");
  for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) await sheet.getByRole("button", { name: day, exact: true }).click();
  await sheet.getByLabel("Until").fill(plus(sunday, 6));
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("agenda-row").filter({ hasText: title })).toContainText("Every day");

  await page.goto(`/day?date=${plus(sunday, 3)}`);
  await expect(row(page, title)).toContainText("08:30", { timeout: 15_000 });
  await expect(row(page, title).getByLabel("Event")).toBeVisible();
});

test("Repeat… turns a task into a weekly item from the day (D8)", async ({ page }) => {
  const sunday = uniqueSunday();
  const tuesday = plus(sunday, 2);
  const title = `Meeting ${String(Date.now())}`;
  await signIn(page, `/day?date=${tuesday}`);
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await row(page, title).locator(".entry-row__main").click();
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Repeat…" }).click();

  const sheet = page.getByRole("dialog", { name: "New event" });
  await expect(sheet.getByLabel("Title", { exact: true })).toHaveValue(title);
  await expect(sheet.getByLabel("Repeat")).toHaveValue("weekly");
  await expect(sheet.getByRole("button", { name: "Tue", exact: true })).toHaveAttribute("aria-pressed", "true");
  await sheet.getByRole("button", { name: "Thu", exact: true }).click();
  await sheet.getByLabel("Until").fill(plus(sunday, 6));
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await expect(row(page, title)).toHaveCount(1);
  await expect(row(page, title).getByLabel("Event")).toBeVisible();
  await page.goto(`/day?date=${plus(sunday, 4)}`);
  await expect(row(page, title)).toHaveCount(1, { timeout: 15_000 });
});

test("a weekly item archives its activity's template by itself, and Undo restores it (D7)", async ({ page }) => {
  const stamp = String(Date.now());
  const activity = `Practice ${stamp}`;
  const template = `Practice 5× ${stamp}`;
  await signIn(page, "/catalog");
  await newActivity(page, activity);
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "Weekly templates" })).toBeVisible();
  await page.getByLabel("Objective", { exact: true }).fill(template);
  await page.locator("select[name=activity]").selectOption({ label: activity });
  await page.getByRole("button", { name: "Add template" }).click();
  await expect(page.getByText(template)).toBeVisible();

  const sunday = uniqueSunday();
  const { sheet } = await openAgendaSheet(page);
  await sheet.getByLabel("Title", { exact: true }).fill(activity);
  await pickActivity(sheet, activity);
  await sheet.getByLabel("Repeat").selectOption("weekly");
  await sheet.getByLabel("Starts on").fill(sunday);
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) await sheet.getByRole("button", { name: day, exact: true }).click();
  await sheet.getByLabel("Until").fill(plus(sunday, 6));
  await sheet.getByRole("button", { name: "Save" }).click();
  const toast = page.getByRole("status").filter({ hasText: template });
  await expect(toast).toContainText("archived");

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("status")).toContainText("restored");
  await page.goto("/templates");
  await expect(page.getByText(template)).toBeVisible();
  // Leave it archived so later runs are not flooded with proposals.
  await page.locator(".catalog-item").filter({ hasText: template }).getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText(template)).toHaveCount(0);
});

test("a yearly event shows its next occurrence in the agenda (US3)", async ({ page }) => {
  const title = `Feast day ${String(Date.now())}`;
  await signIn(page, "/day");
  const { sheet, today } = await openAgendaSheet(page);
  // Its first date was last month, so the next one is in about eleven months.
  const first = plus(today, -30);
  const next = `${String(Number(first.slice(0, 4)) + 1)}${first.slice(4)}`;
  await sheet.getByLabel("Title", { exact: true }).fill(title);
  await sheet.getByLabel("Repeat").selectOption("yearly");
  await sheet.getByLabel("Starts on").fill(first);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openMonth(page, next);
  const item = page.getByTestId("agenda-row").filter({ hasText: title });
  await expect(item).toBeVisible();
  await expect(item.getByLabel("Every year")).toBeVisible();
  await page.goto(`/day?date=${next}`);
  await expect(row(page, title)).toHaveCount(1);
});
