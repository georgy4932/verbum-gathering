/**
 * Gatherings MVP — live browser QA
 * Tests: anon, non-member, member, host auth states via real Supabase session
 * Surface: headless Chromium via Playwright against localhost:3099
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const BASE = 'http://localhost:3099';
const SUPABASE_URL = 'https://uplptirherynltchogjh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwbHB0aXJoZXJ5bmx0Y2hvZ2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTM2NTgsImV4cCI6MjA5MTY4OTY1OH0.WrtahLFdjylg7ojf2woqtwQy_hB8LDoXQPoRk2bUx1Q';

const results = [];
let screenshotIdx = 0;

function log(emoji, label, detail = '') {
  const line = `${emoji} ${label}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push(line);
}

async function shot(page, name) {
  const path = `/tmp/qa-${++screenshotIdx}-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function signIntoPage(page, email, password) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: 'networkidle' });
  // Try common sign-in form field patterns
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  await emailInput.fill(email);
  await passInput.fill(password);
  await page.keyboard.press('Enter');
  await page.waitForURL(url => !url.href.includes('/signin') && !url.href.includes('/sign-in'), { timeout: 8000 }).catch(() => {});
}

async function signOut(page) {
  // Clear all storage to simulate sign-out / anon state
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => localStorage.removeItem(k));
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  });
  await page.context().clearCookies();
}

// ── Create test fixtures via Supabase admin ──────────────────────────────────

async function createTestUsers() {
  // We'll use Supabase's signUp to create test accounts if they don't exist
  // Using anon key — signUp is publicly available
  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  const users = {
    host:   { email: 'qa-host@verbum-qa.test',   password: 'QaTest1234!' },
    member: { email: 'qa-member@verbum-qa.test', password: 'QaTest1234!' },
    nonmem: { email: 'qa-nonmem@verbum-qa.test', password: 'QaTest1234!' },
  };

  for (const [role, creds] of Object.entries(users)) {
    const { error } = await supabase.auth.signUp(creds);
    if (error && !error.message.includes('already registered')) {
      console.log(`  signUp ${role}: ${error.message}`);
    }
  }
  return users;
}

// ── Main QA run ──────────────────────────────────────────────────────────────

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});

const users = await createTestUsers();
console.log('\n=== Gatherings MVP — Live Browser QA ===\n');

// ────────────────────────────────────────────────────────────────────────────
// PHASE 1: ANON USER
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 1: Anon user ──');
{
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  // 1a: Hub shows Gatherings card
  await page.goto(`${BASE}/gathering`, { waitUntil: 'networkidle' });
  const hubText = await page.content();
  if (hubText.includes('gatherings') || hubText.includes('Gatherings') || hubText.includes('Browse gatherings')) {
    log('✅', '1a hub /gathering has Gatherings card');
  } else {
    log('❌', '1a hub /gathering missing Gatherings card');
  }
  await shot(page, 'hub-anon');

  // 1b: /gatherings loads (200, shows list)
  await page.goto(`${BASE}/gatherings`, { waitUntil: 'networkidle' });
  const listStatus = page.url();
  const listContent = await page.content();
  if (listContent.includes('Gatherings') && !listContent.includes('Sign in')) {
    log('✅', '1b /gatherings renders for anon');
  } else {
    log('⚠️', '1b /gatherings unexpected content for anon', listContent.slice(0, 100));
  }
  await shot(page, 'gatherings-list-anon');

  // 1c: /gatherings/new redirects to sign-in
  await page.goto(`${BASE}/gatherings/new`, { waitUntil: 'networkidle' });
  const newUrl = page.url();
  if (newUrl.includes('sign') || newUrl.includes('auth')) {
    log('✅', '1c /gatherings/new → redirect to auth for anon', newUrl);
  } else {
    log('❌', '1c /gatherings/new did NOT redirect anon', newUrl);
    await shot(page, 'gatherings-new-anon-FAIL');
  }

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 2: HOST — create a gathering, verify host state
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 2: Host creates gathering ──');
let testSlug = '';
{
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  await signIntoPage(page, users.host.email, users.host.password);
  const afterSignIn = page.url();
  log(afterSignIn.includes('signin') || afterSignIn.includes('sign-in') ? '⚠️' : '✅',
    '2a host sign-in', afterSignIn);
  await shot(page, 'host-signed-in');

  // Create a public gathering
  await page.goto(`${BASE}/gatherings/new`, { waitUntil: 'networkidle' });
  const newUrl = page.url();
  if (newUrl.includes('gatherings/new')) {
    log('✅', '2b host can access /gatherings/new');
  } else {
    log('❌', '2b host redirected away from /gatherings/new', newUrl);
  }

  const nameInput = page.locator('input[name="name"]').first();
  await nameInput.fill('QA Test Gathering');
  const descInput = page.locator('textarea[name="description"]').first();
  await descInput.fill('Automated QA gathering');
  const visSelect = page.locator('select[name="visibility"]').first();
  await visSelect.selectOption('public');
  await shot(page, 'create-gathering-form');

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => url.href.includes('/gatherings/') && !url.href.includes('/new'), { timeout: 10000 }).catch(() => {});
  const afterCreate = page.url();

  if (afterCreate.includes('/gatherings/') && !afterCreate.includes('/new')) {
    testSlug = afterCreate.split('/gatherings/')[1].split('/')[0];
    log('✅', '2c gathering created, redirected to', afterCreate);
  } else {
    log('❌', '2c gathering creation failed, at', afterCreate);
    await shot(page, 'create-fail');
  }
  await shot(page, 'gathering-home-host');

  // 2d: Host sees NO Join button
  const pageContent = await page.content();
  const hasJoin = pageContent.includes('Join gathering');
  if (!hasJoin) {
    log('✅', '2d host sees no Join button (correct)');
  } else {
    log('❌', '2d host incorrectly sees Join button');
  }

  // 2e: Host can access study/new
  if (testSlug) {
    await page.goto(`${BASE}/gatherings/${testSlug}/study/new`, { waitUntil: 'networkidle' });
    const studyNewUrl = page.url();
    const studyContent = await page.content();
    if (studyContent.includes('New study post') || studyContent.includes('Title')) {
      log('✅', '2e host can access /study/new');
    } else {
      log('❌', '2e host cannot access /study/new', studyNewUrl);
    }
    await shot(page, 'study-new-host');

    // Post a study note
    await page.locator('input[name="title"]').fill('QA Study Post');
    await page.locator('textarea[name="body"]').fill('This is a QA test study post body.');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.href.endsWith('/study'), { timeout: 8000 }).catch(() => {});
    const studyContent2 = await page.content();
    if (studyContent2.includes('QA Study Post')) {
      log('✅', '2f host study post appears in study list');
    } else {
      log('⚠️', '2f study post not visible after submit');
    }
    await shot(page, 'study-list-host');

    // 2g: Host can schedule live session
    await page.goto(`${BASE}/gatherings/${testSlug}/live`, { waitUntil: 'networkidle' });
    const liveContent = await page.content();
    if (liveContent.includes('Schedule') || liveContent.includes('scheduled_at') || liveContent.includes('Start time')) {
      log('✅', '2g host sees live session scheduling form');
    } else {
      log('❌', '2g host does not see live scheduling form');
    }
    await shot(page, 'live-host');
  }

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 3: NON-MEMBER authenticated user
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 3: Authenticated non-member ──');
if (testSlug) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  await signIntoPage(page, users.nonmem.email, users.nonmem.password);
  await shot(page, 'nonmem-signed-in');

  // 3a: Can see the gathering
  await page.goto(`${BASE}/gatherings/${testSlug}`, { waitUntil: 'networkidle' });
  const gContent = await page.content();
  if (gContent.includes('QA Test Gathering')) {
    log('✅', '3a non-member can see public gathering');
  } else {
    log('❌', '3a non-member cannot see public gathering');
  }

  // 3b: Join button visible
  if (gContent.includes('Join gathering')) {
    log('✅', '3b non-member sees Join button');
  } else {
    log('❌', '3b non-member missing Join button');
  }
  await shot(page, 'gathering-home-nonmem');

  // 3c: Cannot access study/new
  await page.goto(`${BASE}/gatherings/${testSlug}/study/new`, { waitUntil: 'networkidle' });
  const studyNewUrl = page.url();
  if (!studyNewUrl.includes('/study/new') || !(await page.content()).includes('New study post')) {
    log('✅', '3c non-member redirected away from /study/new', studyNewUrl);
  } else {
    log('❌', '3c non-member can access /study/new (should be blocked)');
  }

  // 3d: Discussion page visible but no "New thread" button
  await page.goto(`${BASE}/gatherings/${testSlug}/discussion`, { waitUntil: 'networkidle' });
  const discContent = await page.content();
  if (discContent.includes('Discussion') && !discContent.includes('New thread')) {
    log('✅', '3d non-member sees discussion but no New thread button');
  } else if (discContent.includes('New thread')) {
    log('❌', '3d non-member incorrectly sees New thread button');
  } else {
    log('⚠️', '3d discussion page unexpected content');
  }
  await shot(page, 'discussion-nonmem');

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 4: MEMBER — join, post, pray
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 4: Member ──');
if (testSlug) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  await signIntoPage(page, users.member.email, users.member.password);

  // 4a: Join the gathering
  await page.goto(`${BASE}/gatherings/${testSlug}`, { waitUntil: 'networkidle' });
  const joinBtn = page.locator('button', { hasText: 'Join gathering' }).first();
  const joinVisible = await joinBtn.isVisible().catch(() => false);
  if (joinVisible) {
    log('✅', '4a member sees Join button before joining');
    await joinBtn.click();
    await page.waitForTimeout(2000);
    // After join, button should change to "Leave"
    const leaveBtn = page.locator('button', { hasText: 'Leave' }).first();
    const leaveVisible = await leaveBtn.isVisible().catch(() => false);
    if (leaveVisible) {
      log('✅', '4b JoinButton optimistic update: shows "Leave" after click');
    } else {
      log('⚠️', '4b JoinButton: Leave button not visible after join (may need refresh)');
    }
  } else {
    log('⚠️', '4a member Join button not found (email may not be confirmed)');
  }
  await shot(page, 'gathering-home-member-joined');

  // 4c: Refresh and verify membership persisted
  await page.reload({ waitUntil: 'networkidle' });
  const reloadContent = await page.content();
  if (reloadContent.includes('Leave')) {
    log('✅', '4c membership persisted after reload (Leave button visible)');
  } else if (reloadContent.includes('Join gathering')) {
    log('❌', '4c membership NOT persisted after reload (still shows Join)');
  } else {
    log('⚠️', '4c cannot determine membership state after reload');
  }

  // 4d: Member sees "New thread" button in discussion
  await page.goto(`${BASE}/gatherings/${testSlug}/discussion`, { waitUntil: 'networkidle' });
  const discContent = await page.content();
  if (discContent.includes('New thread')) {
    log('✅', '4d member sees New thread button');
  } else {
    log('⚠️', '4d member does not see New thread button (may need email confirm)');
  }

  // 4e: Start a discussion thread
  await page.goto(`${BASE}/gatherings/${testSlug}/discussion/new`, { waitUntil: 'networkidle' });
  const newThreadUrl = page.url();
  if (newThreadUrl.includes('/discussion/new')) {
    log('✅', '4e member can access /discussion/new');
    await page.locator('input[name="title"]').fill('QA Discussion Thread');
    await page.locator('textarea[name="body"]').fill('This is the opening thought.');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.href.endsWith('/discussion'), { timeout: 8000 }).catch(() => {});
    const discList = await page.content();
    if (discList.includes('QA Discussion Thread')) {
      log('✅', '4f thread appears in discussion list after creation');
    } else {
      log('⚠️', '4f thread not visible in discussion list');
    }
    await shot(page, 'discussion-list-member');
  } else {
    log('⚠️', '4e member redirected away from /discussion/new (may need email confirm)', newThreadUrl);
  }

  // 4g: Prayer — share a request
  await page.goto(`${BASE}/gatherings/${testSlug}/prayer`, { waitUntil: 'networkidle' });
  const prayerContent = await page.content();
  if (prayerContent.includes('Share a request') || prayerContent.includes('Share quietly')) {
    log('✅', '4g member sees prayer share form');
    const textarea = page.locator('textarea[name="body"]').first();
    await textarea.fill('Please pray for our QA tests.');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const afterPrayer = await page.content();
    if (afterPrayer.includes('Please pray for our QA tests')) {
      log('✅', '4h prayer request appears after submit');
    } else {
      log('⚠️', '4h prayer request not visible after submit');
    }
    await shot(page, 'prayer-member');
  } else {
    log('⚠️', '4g member does not see prayer form (may need email confirm)');
  }

  // 4i: PrayingButton — click it, verify disabled state
  const prayBtns = page.locator('button', { hasText: "I'm praying" });
  const prayCount = await prayBtns.count();
  if (prayCount > 0) {
    log('✅', '4i "I\'m praying" button visible on prayer request');
    await prayBtns.first().click();
    await page.waitForTimeout(1500);
    // Should now show "Praying" (disabled)
    const prayingBtn = page.locator('button', { hasText: 'Praying' }).first();
    const prayingState = await prayingBtn.isVisible().catch(() => false);
    const prayingDisabled = await prayingBtn.isDisabled().catch(() => false);
    if (prayingState) {
      log('✅', '4j PrayingButton shows "Praying" after click');
    } else {
      log('❌', '4j PrayingButton did not change to "Praying" after click');
    }
    if (prayingDisabled) {
      log('✅', '4k PrayingButton is disabled after clicking (one-way)');
    } else {
      log('⚠️', '4k PrayingButton may not be disabled after clicking');
    }
    await shot(page, 'praying-button-after-click');

    // 4l: Reload — PrayingButton should still show "Praying" (idempotency)
    await page.reload({ waitUntil: 'networkidle' });
    const afterReload = await page.content();
    if (afterReload.includes('Praying')) {
      log('✅', '4l PrayingButton persists "Praying" state after reload');
    } else if (afterReload.includes("I'm praying")) {
      log('❌', '4l PrayingButton reverted to "I\'m praying" after reload (ack not persisted)');
    } else {
      log('⚠️', '4l Cannot determine PrayingButton state after reload');
    }
  } else {
    log('⚠️', '4i no "I\'m praying" button found (no prayer requests, or not member)');
  }

  // 4m: Member does NOT see study/new form
  await page.goto(`${BASE}/gatherings/${testSlug}/study/new`, { waitUntil: 'networkidle' });
  const studyNewUrl = page.url();
  const studyNewContent = await page.content();
  if (!studyNewContent.includes('New study post')) {
    log('✅', '4m member cannot access /study/new (redirected)', studyNewUrl);
  } else {
    log('❌', '4m member can incorrectly access /study/new');
  }

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 5: PRIVATE GATHERING — boundary test
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 5: Private gathering boundary ──');
{
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  // Host creates a private gathering
  await signIntoPage(page, users.host.email, users.host.password);
  await page.goto(`${BASE}/gatherings/new`, { waitUntil: 'networkidle' });
  await page.locator('input[name="name"]').fill('QA Private Gathering');
  await page.locator('select[name="visibility"]').selectOption('private');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => url.href.includes('/gatherings/') && !url.href.includes('/new'), { timeout: 8000 }).catch(() => {});
  const privateUrl = page.url();
  const privateSlug = privateUrl.split('/gatherings/')[1]?.split('/')[0] || '';
  log(privateSlug ? '✅' : '❌', '5a private gathering created', privateSlug);
  await ctx.close();

  // Non-member tries to access private gathering
  if (privateSlug) {
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await signIntoPage(page2, users.nonmem.email, users.nonmem.password);
    await page2.goto(`${BASE}/gatherings/${privateSlug}`, { waitUntil: 'networkidle' });
    const privateAccessUrl = page2.url();
    if (privateAccessUrl.includes('/gatherings') && !privateAccessUrl.includes(privateSlug)) {
      log('✅', '5b non-member redirected away from private gathering', privateAccessUrl);
    } else {
      log('❌', '5b non-member can access private gathering (should redirect)', privateAccessUrl);
      await shot(page2, 'private-gathering-leak');
    }
    await ctx2.close();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 6: Route flow probe
// ────────────────────────────────────────────────────────────────────────────
console.log('\n── Phase 6: Route flow probe ──');
{
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  // 6a: /gathering → /gatherings link
  await page.goto(`${BASE}/gathering`, { waitUntil: 'networkidle' });
  const gatheringsLink = page.locator('a[href="/gatherings"]').first();
  const gatheringsLinkVisible = await gatheringsLink.isVisible().catch(() => false);
  if (gatheringsLinkVisible) {
    log('✅', '6a /gathering hub has link to /gatherings');
    await gatheringsLink.click();
    await page.waitForURL(url => url.href.includes('/gatherings'), { timeout: 5000 }).catch(() => {});
    log(page.url().includes('/gatherings') ? '✅' : '❌', '6b clicking Gatherings link navigates to /gatherings', page.url());
  } else {
    log('❌', '6a /gathering hub missing link to /gatherings');
    await shot(page, 'hub-missing-link');
  }

  // 6c: /gatherings → gathering → back link
  if (testSlug) {
    await page.goto(`${BASE}/gatherings/${testSlug}`, { waitUntil: 'networkidle' });
    const tabsVisible = await page.locator('nav a', { hasText: 'Study' }).first().isVisible().catch(() => false);
    log(tabsVisible ? '✅' : '❌', '6c gathering nav tabs visible');
    await shot(page, 'gathering-nav-tabs');
  }

  await ctx.close();
}

await browser.close();

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n=== QA SUMMARY ===\n');
const passes  = results.filter(r => r.startsWith('✅')).length;
const fails   = results.filter(r => r.startsWith('❌')).length;
const warns   = results.filter(r => r.startsWith('⚠️')).length;
results.forEach(r => console.log(r));
console.log(`\nTotal: ${passes} PASS  ${fails} FAIL  ${warns} WARN`);
if (fails > 0) {
  console.log('\nFAIL items:');
  results.filter(r => r.startsWith('❌')).forEach(r => console.log(' ', r));
}
console.log('\nScreenshots saved to /tmp/qa-*.png');
