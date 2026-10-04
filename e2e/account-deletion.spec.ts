import { expect, test, type Page } from "@playwright/test";

// US5 / SC-005. Each project deletes its own account so the shared e2e account
// is never touched. Allow-list both emails locally first:
//   npm run allow-email -- e2e-delete-desktop@example.test   (backend)
//   npm run allow-email -- e2e-delete-mobile@example.test
function deletableEmail(project: string) {
  return `e2e-delete-${project}@example.test`;
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in?next=/account");
  await page.getByLabel("Test sign-in email").fill(email);
  await page.getByRole("button", { name: "Test sign-in" }).click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("deletes the account after the confirmation phrase and signs out other devices (US5)", async ({ browser }, testInfo) => {
  const email = deletableEmail(testInfo.project.name);
  const main = await browser.newContext();
  const other = await browser.newContext();
  const page = await main.newPage();
  const secondDevice = await other.newPage();
  await signIn(page, email);
  await signIn(secondDevice, email);

  // The second device has the dialog open, ready to confirm, when the first deletes.
  await secondDevice.getByRole("button", { name: "Delete account" }).click();
  await secondDevice.getByLabel("Type DELETE MY ACCOUNT to confirm").fill("DELETE MY ACCOUNT");

  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Export JSON" })).toBeVisible();

  const confirm = dialog.getByRole("button", { name: "Delete account" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type DELETE MY ACCOUNT to confirm").fill("delete my account");
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type DELETE MY ACCOUNT to confirm").fill("DELETE MY ACCOUNT");
  await confirm.click();

  await expect(page).toHaveURL(/\/sign-in\?deleted=1$/);
  await expect(page.getByText("Your account was deleted.")).toBeVisible();

  // The second device is signed out at its next request, not told that nothing was removed.
  await secondDevice.getByRole("dialog").getByRole("button", { name: "Delete account" }).click();
  await expect(secondDevice).toHaveURL(/\/sign-in/);
  await secondDevice.goto("/settings");
  await expect(secondDevice).toHaveURL(/\/sign-in\?next=/);

  // Signing in again starts a new, empty workspace.
  await signIn(page, email);
  await page.goto("/settings");
  await expect(page.getByLabel("Daily capacity (minutes)")).toHaveValue("960");

  await main.close();
  await other.close();
});

test("cancel keeps the account", async ({ page }, testInfo) => {
  await signIn(page, deletableEmail(testInfo.project.name));
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
});
