import { expect, test } from "@playwright/test";

// 004 T009 (002 T061): after each staging deploy, one real flow on staging.
// Runs only when E2E_SMOKE is set (deploy job); the Vercel protection is
// passed with a query parameter, never a header (a header would break CORS
// on the API).
const SMOKE = process.env.E2E_SMOKE === "1";
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "";
const SECRET = process.env.E2E_TEST_SIGN_IN_SECRET ?? "";
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? "e2e-smoke@example.test";

test("staging: sign in, add and complete an entry, remove it", async ({ page }) => {
  test.skip(!SMOKE, "staging smoke only");
  // A far-future day: never today, so Rule Zero and real days are untouched.
  const date = new Date(Date.UTC(2100, 0, 1) + Math.floor(Math.random() * 2_000_000) * 86_400_000).toISOString().slice(0, 10);
  const title = `Smoke ${String(Date.now())}`;

  await page.goto(`/sign-in?x-vercel-protection-bypass=${encodeURIComponent(BYPASS)}&x-vercel-set-bypass-cookie=samesitenone`);
  await page.getByLabel("Test sign-in email").fill(EMAIL);
  await page.getByLabel("Test sign-in secret").fill(SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));

  await page.goto(`/day?date=${date}`);
  await page.getByLabel("New entry").fill(title);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const row = page.getByTestId("entry-row").filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: `Mark ${title} done` }).click();
  await expect(row.getByRole("button", { name: `Mark ${title} planned` })).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(row.getByRole("button", { name: `Mark ${title} planned` })).toHaveAttribute("aria-pressed", "true");
  await row.locator(".entry-row__main").click();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete entry" }).click();
  await expect(row).toHaveCount(0);
});
