/**
 * Gatherings MVP regression suite.
 *
 * Prerequisites (run once, already done for the verbum-qa.test users):
 *   - qa-host, qa-member, qa-nonmem exist in auth.users with confirmed emails
 *   - At least one public gathering exists (created via the app as host)
 *
 * Run: CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test
 */
import { test, expect } from "@playwright/test";
import { signIn, signOut } from "./helpers";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getFirstPublicSlug(page: ReturnType<typeof test.info>["project"] extends infer P ? any : never): Promise<string> {
  // Read the first gathering slug from the /gatherings list
  const link = page.locator('a[href^="/gatherings/"]').first();
  const href = await link.getAttribute("href");
  return href?.split("/gatherings/")[1]?.split("/")[0] ?? "";
}

// ── Phase 1: Route protection (anon) ─────────────────────────────────────────

test.describe("Anon user", () => {
  test("1a hub /gathering shows Gatherings card", async ({ page }) => {
    await page.goto("/gathering");
    await expect(page.locator('a[href="/gatherings"]')).toBeVisible();
  });

  test("1b /gatherings list renders without auth", async ({ page }) => {
    await page.goto("/gatherings");
    await expect(page).toHaveURL("/gatherings");
    // Page renders — no redirect to sign-in
    await expect(page.locator("h1, h2")).not.toHaveCount(0);
  });

  test("1c /gatherings/new redirects anon to /auth/signin", async ({ page }) => {
    await page.goto("/gatherings/new");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("1d /gatherings/[slug]/study/new redirects anon to /auth/signin", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];
    await page.goto(`/gatherings/${slug}/study/new`);
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

// ── Phase 2: Host perspective ─────────────────────────────────────────────────

test.describe("Host", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "host");
  });

  test("2a can access /gatherings/new", async ({ page }) => {
    await page.goto("/gatherings/new");
    await expect(page).toHaveURL("/gatherings/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("2b host sees no Join button on their own gathering", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    // Navigate to a gathering the host created (if member_count includes host as role=host, skip join check)
    await page.goto(`/gatherings/${slug}`);
    // There should be no "Join gathering" button — host returns null from JoinButton
    await expect(page.locator("button", { hasText: "Join gathering" })).toHaveCount(0);
  });

  test("2c host can access /study/new", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    await page.goto(`/gatherings/${slug}/study/new`);
    await expect(page).toHaveURL(new RegExp(`/gatherings/${slug}/study/new`));
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test("2d host sees live session scheduling form", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    await page.goto(`/gatherings/${slug}/live`);
    await expect(page.locator('input[name="scheduled_at"]')).toBeVisible();
  });
});

// ── Phase 3: Authenticated non-member ────────────────────────────────────────

test.describe("Authenticated non-member", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "nonmem");
  });

  test("3a can see public gathering", async ({ page }) => {
    await page.goto("/gatherings");
    await expect(page.locator('a[href^="/gatherings/"]').first()).toBeVisible();
  });

  test("3b sees Join button on gathering they haven't joined", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    await page.goto(`/gatherings/${slug}`);
    await expect(page.locator("button", { hasText: "Join gathering" })).toBeVisible();
  });

  test("3c redirected away from /study/new (not host/mod)", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    await page.goto(`/gatherings/${slug}/study/new`);
    // Should redirect away — either to /study or /auth/signin
    await expect(page).not.toHaveURL(new RegExp(`/gatherings/${slug}/study/new`));
  });

  test("3d redirected away from /discussion/new (no membership)", async ({ page }) => {
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    if (!href) return test.skip();
    const slug = href.split("/gatherings/")[1].split("/")[0];

    await page.goto(`/gatherings/${slug}/discussion/new`);
    await expect(page).not.toHaveURL(new RegExp(`/gatherings/${slug}/discussion/new`));
  });
});

// ── Phase 4: Join / Leave — optimistic update ─────────────────────────────────

test.describe("Member join / leave flow", () => {
  let testSlug = "";

  test.beforeAll(async ({ browser }) => {
    // Ensure we have a slug to test against
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, "nonmem");
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    testSlug = href?.split("/gatherings/")[1]?.split("/")[0] ?? "";
    await ctx.close();
  });

  test("4a Join button triggers immediate optimistic update", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();

    await page.goto(`/gatherings/${testSlug}`);
    // Make sure we're not already a member
    const leaveBtn = page.locator("button", { hasText: "Leave" });
    if (await leaveBtn.isVisible()) {
      await leaveBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.reload();

    const joinBtn = page.locator("button", { hasText: "Join gathering" });
    await expect(joinBtn).toBeVisible();

    // Click and immediately check — optimistic update should fire before server responds
    await Promise.all([
      joinBtn.click(),
      expect(page.locator("button", { hasText: "Leave" })).toBeVisible({ timeout: 2000 }),
    ]);
  });

  test("4b Join state persists after router.refresh() and hard reload", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();

    await page.goto(`/gatherings/${testSlug}`);
    const joinBtn = page.locator("button", { hasText: "Join gathering" });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await page.waitForTimeout(2000);
    }

    // Hard reload — server re-renders with DB state
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("button", { hasText: "Leave" })).toBeVisible();
  });

  test("4c Leave returns to Join state and persists", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();

    await page.goto(`/gatherings/${testSlug}`);
    const leaveBtn = page.locator("button", { hasText: "Leave" });
    if (await leaveBtn.isVisible()) {
      await leaveBtn.click();
      await page.waitForTimeout(1500);
    }

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("button", { hasText: "Join gathering" })).toBeVisible();
  });

  test("4d Join button is disabled during loading (prevents double-join)", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();

    await page.goto(`/gatherings/${testSlug}`);
    const leaveBtn = page.locator("button", { hasText: "Leave" });
    if (await leaveBtn.isVisible()) {
      await leaveBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
    }

    const joinBtn = page.locator("button", { hasText: "Join gathering" });
    await joinBtn.click();
    // Immediately after click, button is disabled (loading state)
    await expect(joinBtn.or(page.locator("button", { hasText: "…" }))).toBeDisabled({ timeout: 500 });
  });
});

// ── Phase 5: Private gathering boundary ──────────────────────────────────────

test.describe("Private gathering visibility", () => {
  let privateSlug = "";

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, "host");
    await page.goto("/gatherings/new");
    await page.locator('input[name="name"]').fill("QA Private Test");
    await page.locator('select[name="visibility"]').selectOption("private");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.includes("/gatherings/") && !url.pathname.endsWith("/new"), { timeout: 10_000 });
    privateSlug = page.url().split("/gatherings/")[1]?.split("/")[0] ?? "";
    await ctx.close();
  });

  test("5a non-member redirected away from private gathering", async ({ page }) => {
    await signIn(page, "nonmem");
    if (!privateSlug) return test.skip();
    await page.goto(`/gatherings/${privateSlug}`);
    await expect(page).toHaveURL(/\/gatherings(?!\/.*\/)$/);
    await expect(page).not.toHaveURL(new RegExp(privateSlug));
  });

  test("5b anon redirected away from private gathering", async ({ page }) => {
    if (!privateSlug) return test.skip();
    await page.goto(`/gatherings/${privateSlug}`);
    // May redirect to /gatherings or /auth/signin depending on auth state
    await expect(page).not.toHaveURL(new RegExp(privateSlug));
  });

  test("5c private gathering not visible in public list to anon", async ({ page }) => {
    if (!privateSlug) return test.skip();
    await page.goto("/gatherings");
    await expect(page.locator(`a[href="/gatherings/${privateSlug}"]`)).toHaveCount(0);
  });
});

// ── Phase 6: PrayingButton — one-way, persisted ───────────────────────────────

test.describe("PrayingButton", () => {
  let testSlug = "";

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, "member");
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    testSlug = href?.split("/gatherings/")[1]?.split("/")[0] ?? "";
    // Ensure member is joined
    await page.goto(`/gatherings/${testSlug}`);
    const joinBtn = page.locator("button", { hasText: "Join gathering" });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await page.waitForTimeout(2000);
    }
    await ctx.close();
  });

  test("6a member can submit prayer request", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}/prayer`);
    const textarea = page.locator('textarea[name="body"]');
    await expect(textarea).toBeVisible();
    await textarea.fill("Prayer request from regression test");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Prayer request from regression test")).toBeVisible();
  });

  test("6b PrayingButton — immediate state, persists after reload", async ({ page }) => {
    await signIn(page, "host");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}/prayer`);

    const prayBtn = page.locator("button", { hasText: "I'm praying" }).first();
    if (!(await prayBtn.isVisible())) return test.skip();

    // State 1: immediate optimistic update
    await prayBtn.click();
    await expect(page.locator("button", { hasText: "Praying" }).first()).toBeVisible({ timeout: 3000 });

    // State 2: button disabled (one-way)
    await expect(page.locator("button", { hasText: "Praying" }).first()).toBeDisabled();

    // State 3: hard reload — server state matches
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("button", { hasText: "Praying" }).first()).toBeVisible();
    await expect(page.locator("button", { hasText: "Praying" }).first()).toBeDisabled();
  });

  test("6c non-member sees praying count but no PrayingButton", async ({ page }) => {
    await signIn(page, "nonmem");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}/prayer`);
    await expect(page.locator("button", { hasText: "I'm praying" })).toHaveCount(0);
    await expect(page.locator("button", { hasText: "Praying" })).toHaveCount(0);
  });
});

// ── Phase 7: Study + Discussion posting ──────────────────────────────────────

test.describe("Study and Discussion posting", () => {
  let testSlug = "";

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, "host");
    await page.goto("/gatherings");
    const firstLink = page.locator('a[href^="/gatherings/"]').first();
    const href = await firstLink.getAttribute("href");
    testSlug = href?.split("/gatherings/")[1]?.split("/")[0] ?? "";
    await ctx.close();
  });

  test("7a host can post study content", async ({ page }) => {
    await signIn(page, "host");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}/study/new`);
    await page.locator('input[name="title"]').fill("Regression: Study Post");
    await page.locator('textarea[name="body"]').fill("Body of the regression test study post.");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(new RegExp(`/gatherings/${testSlug}/study$`));
    await expect(page.locator("text=Regression: Study Post")).toBeVisible();
  });

  test("7b member can start a discussion thread", async ({ page }) => {
    await signIn(page, "member");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}`);
    // Ensure joined
    const joinBtn = page.locator("button", { hasText: "Join gathering" });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.goto(`/gatherings/${testSlug}/discussion/new`);
    await page.locator('input[name="title"]').fill("Regression: Discussion Thread");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(new RegExp(`/gatherings/${testSlug}/discussion$`));
    await expect(page.locator("text=Regression: Discussion Thread")).toBeVisible();
  });

  test("7c non-member cannot post study content", async ({ page }) => {
    await signIn(page, "nonmem");
    if (!testSlug) return test.skip();
    await page.goto(`/gatherings/${testSlug}/study/new`);
    await expect(page).not.toHaveURL(new RegExp(`/gatherings/${testSlug}/study/new`));
  });
});
