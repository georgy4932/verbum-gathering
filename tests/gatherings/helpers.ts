import { Page } from "@playwright/test";

export const BASE = "http://localhost:3099";

export const QA_USERS = {
  host:   { email: "qa-host@verbum-qa.test",   password: "QaTest1234!" },
  member: { email: "qa-member@verbum-qa.test",  password: "QaTest1234!" },
  nonmem: { email: "qa-nonmem@verbum-qa.test",  password: "QaTest1234!" },
} as const;

export async function signIn(page: Page, role: keyof typeof QA_USERS) {
  const { email, password } = QA_USERS[role];
  await page.goto("/auth/signin");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await page.locator("button[type='submit']").click();
  // Wait for redirect away from sign-in
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 10_000 });
}

export async function signOut(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
  });
  await page.context().clearCookies();
}
