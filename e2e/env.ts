// The API's TEST_SIGN_IN_SECRET (ADR 0003); never committed. Locally it comes
// from the shell, in CI from the repository secret.
export const TEST_SIGN_IN_SECRET = process.env.E2E_TEST_SIGN_IN_SECRET ?? "";
