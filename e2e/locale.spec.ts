import { expect, test } from "@playwright/test";
import { TEST_SIGN_IN_SECRET } from "./env";

// Its own account: switching the language of the shared one would change the
// labels other specs look for while they run in parallel.
const ALLOWED = process.env.E2E_LOCALE_EMAIL ?? "e2e-locale@example.test";

test("the interface switches between English and Portuguese (FR-044, SC-010)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one account, one run");
  await page.goto("/sign-in?next=/settings");
  await page.getByLabel("Test sign-in email").fill(ALLOWED);
  await page.getByLabel("Test sign-in secret").fill(TEST_SIGN_IN_SECRET);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  // Start from English even if an earlier run stopped halfway.
  const language = page.getByLabel(/Language|Idioma/);
  await language.selectOption("en");
  await page.getByRole("button", { name: /^(Save|Salvar)$/ }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByLabel("Language").selectOption("pt-BR");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
  await page.getByRole("link", { name: "Dia" }).click();
  await expect(page.getByLabel("Nova entrada")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await page.getByRole("link", { name: "Ciclos" }).click();
  await expect(page.getByRole("button", { name: "Adicionar objetivo" })).toBeVisible();

  await page.getByRole("link", { name: "Ajustes" }).click();
  await page.getByLabel("Idioma").selectOption("en");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
