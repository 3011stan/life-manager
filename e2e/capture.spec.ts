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
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

test("capture loose lines and add only the accepted suggestions (US8)", async ({ page }) => {
  await signIn(page, `/day?date=${uniqueDate()}`);
  await page.getByRole("button", { name: "Capture as text" }).click();
  await page.getByLabel("Write loose lines, one per item").fill(["fiz standup", "academia 19h", "trabalhei no projeto X umas 2h", "nao fiz leitura", "gym at 7pm"].join("\n"));
  await page.getByRole("button", { name: "Suggest entries" }).click();

  const suggestions = page.getByTestId("suggestion");
  await expect(suggestions).toHaveCount(5);
  // Nothing is on the day until accepted (FR-042).
  await expect(page.getByTestId("entry-row")).toHaveCount(0);

  const academia = suggestions.filter({ hasText: "academia 19h" });
  await expect(academia.getByLabel("Start")).toHaveValue("19:00");
  await expect(academia.getByLabel("Planned minutes")).toHaveValue("");
  const projeto = suggestions.filter({ hasText: "umas 2h" });
  await expect(projeto.getByLabel("Planned minutes")).toHaveValue("120");
  await expect(projeto.getByLabel("Start")).toHaveValue("");

  await projeto.getByLabel("Title").fill("Projeto X, parte 1");
  await projeto.getByRole("button", { name: "Add" }).click();
  await academia.getByRole("button", { name: "Add" }).click();
  await suggestions.filter({ hasText: "fiz standup" }).getByRole("button", { name: "Add" }).click();
  await suggestions.filter({ hasText: "gym at 7pm" }).getByRole("button", { name: "Dismiss" }).click();

  await expect(page.getByTestId("entry-row")).toHaveCount(3);
  await expect(page.getByTestId("entry-row").filter({ hasText: "Projeto X, parte 1" })).toContainText("2h");
  await expect(page.getByTestId("entry-row").filter({ hasText: "Academia" })).toContainText("19:00");
  await expect(page.getByTestId("entry-row").filter({ hasText: "Gym" })).toHaveCount(0);
});
