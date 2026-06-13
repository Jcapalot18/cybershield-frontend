/**
 * CyberShield end-to-end customer journey test
 * node e2e-test.js
 */

import { chromium } from 'playwright';

const BASE      = 'https://cybrshieldtech.com';
const API       = 'https://cybershield-backend-production-492b.up.railway.app';
const TEST_EMAIL    = `e2e+${Date.now()}@mailinator.com`;
const TEST_PASSWORD = 'TestPass2026!';
const TEST_NAME     = 'E2E Tester';
const TEST_COMPANY  = 'E2E Test Co';

// ── helpers ──────────────────────────────────────────────────────────────────
const results = [];
let pageErrors = [];
let brokenLinks = [];

function pass(section, msg)  { results.push({ status:'✅ PASS', section, msg }); console.log(`  ✅ ${section}: ${msg}`); }
function fail(section, msg)  { results.push({ status:'❌ FAIL', section, msg }); console.log(`  ❌ ${section}: ${msg}`); }
function warn(section, msg)  { results.push({ status:'⚠️  WARN', section, msg }); console.log(`  ⚠️  ${section}: ${msg}`); }
function info(section, msg)  { results.push({ status:'ℹ️  INFO', section, msg }); console.log(`  ℹ️  ${section}: ${msg}`); }
function head(msg)           { console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`); }

async function checkVisible(page, selector, section, label) {
  try {
    await page.waitForSelector(selector, { timeout: 6000 });
    pass(section, `${label} visible`);
    return true;
  } catch {
    fail(section, `${label} not found (${selector})`);
    return false;
  }
}

async function collectErrors(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push({ url: page.url(), text: msg.text() });
  });
  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), text: err.message });
  });
}

async function checkLinks(page, section) {
  const links = await page.$$eval('a[href]', els =>
    els.map(a => ({ href: a.href, text: (a.textContent || '').trim().slice(0, 60) }))
       .filter(l => l.href && !l.href.startsWith('mailto:') && !l.href.startsWith('tel:'))
  );
  const seen = new Set();
  const checks = [];
  for (const l of links) {
    if (seen.has(l.href) || l.href.includes('mailinator') || l.href.startsWith('javascript')) continue;
    seen.add(l.href);
    checks.push(l);
  }
  info(section, `Found ${checks.length} unique links to check`);

  for (const l of checks.slice(0, 25)) { // cap at 25 per page
    try {
      const r = await page.request.get(l.href, { timeout: 8000 }).catch(() => null);
      const status = r ? r.status() : 0;
      if (!r || status === 0) {
        brokenLinks.push({ section, url: l.href, text: l.text, status: 'timeout/network' });
        warn(section, `Link timeout: "${l.text}" → ${l.href}`);
      } else if (status >= 400) {
        brokenLinks.push({ section, url: l.href, text: l.text, status });
        fail(section, `Broken link ${status}: "${l.text}" → ${l.href}`);
      }
    } catch { /* skip */ }
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
});
const page = await context.newPage();
collectErrors(page);

// ── 1. LANDING PAGE ──────────────────────────────────────────────────────────
head('1. LANDING PAGE');
try {
  const res = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const status = res.status();
  if (status < 400) pass('Landing', `Page loaded (HTTP ${status})`);
  else              fail('Landing', `Page returned HTTP ${status}`);
} catch (e) {
  fail('Landing', `Failed to load: ${e.message}`);
}

await page.waitForTimeout(2000);

// title
const title = await page.title();
if (title && title.toLowerCase().includes('cyber')) pass('Landing', `Title OK: "${title}"`);
else warn('Landing', `Unexpected title: "${title}"`);

// nav links
await checkVisible(page, 'nav', 'Landing', 'Navigation bar');
const navLinks = await page.$$eval('nav a', els => els.map(a => a.textContent.trim()).filter(Boolean));
info('Landing', `Nav links: ${navLinks.join(', ')}`);

// hero / CTA
await checkVisible(page, 'h1, .hero h1, [class*="hero"] h1', 'Landing', 'Hero heading');
const ctaLinks = await page.$$eval('a[href*="auth"], a[href*="signup"], a[href*="sign-up"], .btn-primary', els => els.map(a => a.textContent?.trim()));
if (ctaLinks.length) pass('Landing', `CTA buttons found: ${ctaLinks.slice(0,3).join(', ')}`);
else                 fail('Landing', 'No CTA / sign-up buttons found');

// pricing
const pricingVisible = await page.$('text=/\\$49|\\$199|\\$599|pricing/i').catch(() => null);
if (pricingVisible) pass('Landing', 'Pricing section visible');
else                warn('Landing', 'Pricing not visible on landing page');

// features / platform
const featuresEl = await page.$('#platform, [id*="platform"], [class*="feature"]').catch(() => null);
if (featuresEl) pass('Landing', 'Platform/features section present');
else            warn('Landing', 'No platform section detected');

await checkLinks(page, 'Landing');

// ── 2. AUTH PAGE — LOAD ──────────────────────────────────────────────────────
head('2. AUTH PAGE');
try {
  await page.goto(`${BASE}/auth.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  pass('Auth', 'auth.html loaded');
} catch (e) {
  fail('Auth', `auth.html failed: ${e.message}`);
}

await page.waitForTimeout(1500);

await checkVisible(page, '.auth-tabs, [class*="auth-tab"]', 'Auth', 'Sign in / Create account tabs');
await checkVisible(page, 'input[type="email"]', 'Auth', 'Email input');
await checkVisible(page, 'input[type="password"]', 'Auth', 'Password input');
await checkVisible(page, '.btn-submit, button[type="submit"], button[onclick*="Signin"], button[onclick*="signin"]', 'Auth', 'Submit button');

// check tab switching
try {
  await page.click('#tab-signup, button:has-text("Create account")');
  await page.waitForTimeout(500);
  const signupForm = await page.$('#form-signup.active, #form-signup[style*="flex"]');
  if (signupForm) pass('Auth', 'Tab switch to "Create account" works');
  else            fail('Auth', 'Tab switch did not show signup form');
} catch (e) {
  fail('Auth', `Tab switch error: ${e.message}`);
}

// back to sign in
try {
  await page.click('#tab-signin, button:has-text("Sign in")');
  await page.waitForTimeout(300);
  pass('Auth', 'Tab switch back to "Sign in" works');
} catch { warn('Auth', 'Could not switch back to sign in tab'); }

// ── 3. SIGN UP ───────────────────────────────────────────────────────────────
head('3. SIGN UP FLOW');
try {
  await page.click('#tab-signup, button:has-text("Create account")');
  await page.waitForTimeout(400);

  await page.fill('#reg-name', TEST_NAME);
  await page.fill('#reg-company', TEST_COMPANY);
  await page.fill('#reg-email', TEST_EMAIL);
  await page.fill('#reg-password', TEST_PASSWORD);

  // select starter plan
  try { await page.check('#plan-starter'); } catch { warn('Signup', 'Could not select plan radio'); }

  pass('Signup', `Form filled: ${TEST_EMAIL}`);

  // submit
  await page.click('#signup-btn, .btn-submit');
  pass('Signup', 'Signup form submitted');

  // wait for response
  await page.waitForTimeout(5000);

  const url = page.url();
  const msg = await page.$eval('#signup-msg', el => el.textContent.trim()).catch(() => '');
  const errMsg = await page.$eval('.form-message.error', el => el.textContent.trim()).catch(() => '');
  const successMsg = await page.$eval('.form-message.success', el => el.textContent.trim()).catch(() => '');

  if (url.includes('app.html') || url.includes('checkout') || url.includes('stripe')) {
    pass('Signup', `Redirected after signup → ${url}`);
  } else if (successMsg) {
    pass('Signup', `Success message: "${successMsg}"`);
  } else if (errMsg) {
    fail('Signup', `Signup error: "${errMsg}"`);
  } else if (msg) {
    info('Signup', `Form message: "${msg}"`);
  } else {
    warn('Signup', `No redirect or message after submit (still at ${url})`);
  }
} catch (e) {
  fail('Signup', `Signup flow error: ${e.message}`);
}

// ── 4. SIGN IN ───────────────────────────────────────────────────────────────
head('4. SIGN IN / DASHBOARD');
let signedIn = false;
try {
  // Try API sign-in directly to get a token for further tests
  const apiRes = await page.request.post(`${API}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    headers: { 'Content-Type': 'application/json' }
  });
  const apiData = await apiRes.json().catch(() => ({}));

  if (apiRes.ok() && apiData.accessToken) {
    pass('Signin', `API login OK — token received`);
    // Inject session into browser
    await page.goto(`${BASE}/auth.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate((data) => {
      sessionStorage.setItem('cs_token',   data.accessToken);
      sessionStorage.setItem('cs_refresh', data.refreshToken || '');
      sessionStorage.setItem('cs_email',   data.user?.email || '');
      sessionStorage.setItem('cs_user',    JSON.stringify(data.user || {}));
      sessionStorage.setItem('cs_company', JSON.stringify(data.company || {}));
    }, apiData);
    signedIn = true;
    pass('Signin', 'Session tokens injected into browser');
  } else {
    warn('Signin', `API login response: HTTP ${apiRes.status()} — ${JSON.stringify(apiData).slice(0,120)}`);
    // fall back to UI sign-in with known creds
  }
} catch (e) {
  warn('Signin', `API login attempt error: ${e.message}`);
}

// Try UI sign-in regardless (to test the UI path)
try {
  await page.goto(`${BASE}/auth.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);

  // Make sure we're on sign-in tab
  await page.click('#tab-signin').catch(() => {});
  await page.waitForTimeout(300);

  await page.fill('#login-email', TEST_EMAIL);
  await page.fill('#login-password', TEST_PASSWORD);
  await page.click('#signin-btn');
  pass('Signin', 'Sign in form submitted via UI');

  await page.waitForTimeout(5000);

  const afterUrl = page.url();
  const errMsg = await page.$eval('.form-message.error', el => el.textContent.trim()).catch(() => '');

  if (afterUrl.includes('app.html') || afterUrl.includes('admin.html')) {
    pass('Signin', `Redirected to dashboard: ${afterUrl}`);
    signedIn = true;
  } else if (errMsg) {
    fail('Signin', `UI sign-in error: "${errMsg}"`);
  } else {
    warn('Signin', `Sign in did not redirect — still at ${afterUrl}`);
  }
} catch (e) {
  fail('Signin', `UI sign-in error: ${e.message}`);
}

// ── 5. DASHBOARD ─────────────────────────────────────────────────────────────
head('5. DASHBOARD (app.html)');
try {
  await page.goto(`${BASE}/app.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2500);

  const appUrl = page.url();
  if (appUrl.includes('auth.html')) {
    fail('Dashboard', 'Redirected back to auth — not authenticated');
  } else {
    pass('Dashboard', `Dashboard loaded at ${appUrl}`);

    // sidebar nav
    const sidebar = await page.$('.sidebar, .s-nav, nav[class*="side"], [class*="sidebar"]').catch(() => null);
    if (sidebar) pass('Dashboard', 'Sidebar navigation present');
    else         warn('Dashboard', 'No sidebar detected');

    // main stat cards / widgets
    const cards = await page.$$('[class*="card"], [class*="stat"], [class*="widget"]');
    info('Dashboard', `${cards.length} card/stat elements found`);
    if (cards.length >= 2) pass('Dashboard', 'Dashboard cards/widgets rendered');
    else                   warn('Dashboard', 'Few or no dashboard widgets found');

    // look for score / risk display
    const scoreEl = await page.$('text=/score|risk|threat|secure/i').catch(() => null);
    if (scoreEl) pass('Dashboard', 'Security score/risk indicator visible');
    else         warn('Dashboard', 'No security score visible on dashboard');

    // check for any JS errors that would break the page
    const bodyText = await page.textContent('body');
    if (bodyText.toLowerCase().includes('undefined') && bodyText.toLowerCase().includes('error')) {
      warn('Dashboard', 'Possible JS error text visible in page');
    }
  }
} catch (e) {
  fail('Dashboard', `app.html load error: ${e.message}`);
}

// ── 6. SECURITY SCAN ─────────────────────────────────────────────────────────
head('6. SECURITY SCAN');
try {
  // Try clicking scan nav item in sidebar
  const scanNav = await page.$('a[href*="scan"], .s-item:has-text("scan"), [class*="scan"]').catch(() => null);
  if (scanNav) {
    await scanNav.click();
    await page.waitForTimeout(2000);
    pass('Scanner', 'Navigated to scanner via sidebar');
  } else {
    info('Scanner', 'No scanner nav link found — testing via hash/section');
    await page.evaluate(() => { const el = document.querySelector('[data-page="scanner"], #scanner'); if (el) el.click(); });
    await page.waitForTimeout(1500);
  }

  // Look for scan input or button
  const scanInput = await page.$('input[placeholder*="domain"], input[placeholder*="url"], input[placeholder*="scan"], input[type="url"]').catch(() => null);
  const scanBtn   = await page.$('button:has-text("scan"), button:has-text("Scan"), [class*="scan-btn"]').catch(() => null);

  if (scanInput) {
    await scanInput.fill('example.com');
    pass('Scanner', 'Domain input filled');
  } else {
    warn('Scanner', 'No domain input field found for scanner');
  }

  if (scanBtn) {
    pass('Scanner', 'Scan button found');
    await scanBtn.click();
    await page.waitForTimeout(4000);
    // check for results or loading state
    const resultsEl = await page.$('[class*="result"], [class*="scan-result"], [class*="vuln"]').catch(() => null);
    const loadingEl = await page.$('[class*="loading"], [class*="spinner"]').catch(() => null);
    if (resultsEl) pass('Scanner', 'Scan results/output visible');
    else if (loadingEl) info('Scanner', 'Scan running (loading state visible)');
    else warn('Scanner', 'No scan results or loading indicator after clicking scan');
  } else {
    warn('Scanner', 'No scan button found');
  }
} catch (e) {
  fail('Scanner', `Scanner test error: ${e.message}`);
}

// ── 7. BREACH MONITOR ────────────────────────────────────────────────────────
head('7. BREACH MONITOR');
try {
  const breachNav = await page.$('a[href*="breach"], .s-item:has-text("breach"), .s-item:has-text("Breach")').catch(() => null);
  if (breachNav) {
    await breachNav.click();
    await page.waitForTimeout(2500);
    pass('Breach', 'Navigated to breach monitor');
  } else {
    await page.evaluate(() => {
      const items = document.querySelectorAll('.s-item, [data-page]');
      for (const i of items) { if (i.textContent.toLowerCase().includes('breach')) { i.click(); break; } }
    });
    await page.waitForTimeout(1500);
  }

  const breachContent = await page.$('[class*="breach"], [id*="breach"], text=/breach|dark web|credential/i').catch(() => null);
  if (breachContent) pass('Breach', 'Breach monitor content visible');
  else               warn('Breach', 'No breach monitor content detected');

  const breachStatus = await page.textContent('body');
  if (/no breach|clear|safe|0 breach/i.test(breachStatus)) info('Breach', 'Breach status: clear / no breaches found');
  else if (/breach found|compromised|alert/i.test(breachStatus)) info('Breach', 'Breach status: alerts present');
} catch (e) {
  fail('Breach', `Breach monitor error: ${e.message}`);
}

// ── 8. AI TRAINING ───────────────────────────────────────────────────────────
head('8. AI TRAINING');
try {
  const trainingNav = await page.$('a[href*="train"], .s-item:has-text("train"), .s-item:has-text("Train"), .s-item:has-text("AI")').catch(() => null);
  if (trainingNav) {
    await trainingNav.click();
    await page.waitForTimeout(2000);
    pass('Training', 'Navigated to AI training');
  } else {
    await page.evaluate(() => {
      const items = document.querySelectorAll('.s-item, [data-page]');
      for (const i of items) { if (/train|AI/i.test(i.textContent)) { i.click(); break; } }
    });
    await page.waitForTimeout(1500);
  }

  const trainingContent = await page.$('[class*="train"], [id*="train"], text=/training|phishing|quiz|lesson/i').catch(() => null);
  if (trainingContent) pass('Training', 'AI training content visible');
  else                 warn('Training', 'No AI training content detected');
} catch (e) {
  fail('Training', `AI training error: ${e.message}`);
}

// ── 9. BILLING PAGE ──────────────────────────────────────────────────────────
head('9. BILLING / PRICING');
try {
  // Try billing via API call to see if endpoint exists
  const token = await page.evaluate(() => sessionStorage.getItem('cs_token'));
  if (token) {
    const billingRes = await page.request.get(`${API}/billing/portal`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => null);
    if (billingRes) {
      info('Billing', `Billing API: HTTP ${billingRes.status()}`);
      if (billingRes.ok()) pass('Billing', 'Billing portal API endpoint responds');
      else warn('Billing', `Billing API returned ${billingRes.status()}`);
    }
  }

  // Look for billing in dashboard nav
  const billingNav = await page.$('.s-item:has-text("billing"), .s-item:has-text("Billing"), .s-item:has-text("plan"), a[href*="billing"]').catch(() => null);
  if (billingNav) {
    await billingNav.click();
    await page.waitForTimeout(2000);
    const billingContent = await page.$('[class*="billing"], [class*="plan"], text=/\$49|\$199|\$599|upgrade|subscription/i').catch(() => null);
    if (billingContent) pass('Billing', 'Billing/plan content visible in dashboard');
    else                warn('Billing', 'No billing content found after click');
  } else {
    warn('Billing', 'No billing nav item in dashboard sidebar');
  }

  // Landing page pricing
  await page.goto(`${BASE}/index.html#pricing`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const prices = await page.$$eval('[class*="price"], [class*="plan"]', els => els.map(el => el.textContent.trim().slice(0,40)));
  if (prices.length) {
    pass('Billing', `Pricing on landing: ${prices.slice(0,3).join(' | ')}`);
  } else {
    warn('Billing', 'No pricing cards found on landing page');
  }
} catch (e) {
  fail('Billing', `Billing test error: ${e.message}`);
}

// ── 10. ABOUT PAGE ───────────────────────────────────────────────────────────
head('10. ABOUT PAGE');
try {
  const res = await page.goto(`${BASE}/about.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  pass('About', `about.html loaded (HTTP ${res.status()})`);
  await page.waitForTimeout(1500);

  await checkVisible(page, 'nav', 'About', 'Navigation bar');
  await checkVisible(page, 'footer', 'About', 'Footer');

  const h1 = await page.$eval('h1, .hero-title, [class*="hero"] h2', el => el.textContent.trim()).catch(() => '');
  if (h1) pass('About', `Hero text: "${h1.slice(0,60)}"`);
  else    warn('About', 'No h1/hero heading found on about page');

  // founder card
  const founderEl = await page.$('text=/Njiru|Sankar|founder/i').catch(() => null);
  if (founderEl) pass('About', 'Founder section visible');
  else           warn('About', 'No founder section found');

  // LinkedIn / GitHub links
  const linkedIn = await page.$('a[href*="linkedin"]').catch(() => null);
  const github   = await page.$('a[href*="github"]').catch(() => null);
  if (linkedIn) pass('About', 'LinkedIn link present');
  else          fail('About', 'LinkedIn link missing on about page');
  if (github)   pass('About', 'GitHub link present');
  else          fail('About', 'GitHub link missing on about page');

  // design tokens (dark bg)
  const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  info('About', `Body background: ${bgColor}`);
  if (bgColor.includes('8') || bgColor.includes('11') || bgColor.includes('18')) {
    pass('About', 'Dark background confirmed (#080b12 range)');
  } else {
    warn('About', `Unexpected background color: ${bgColor}`);
  }
} catch (e) {
  fail('About', `About page error: ${e.message}`);
}

// ── 11. MOBILE RESPONSIVENESS ────────────────────────────────────────────────
head('11. MOBILE RESPONSIVENESS');
const mobileViewports = [
  { name: 'iPhone 14',  width: 390,  height: 844 },
  { name: 'Pixel 7',    width: 412,  height: 915 },
  { name: 'iPad',       width: 768,  height: 1024 },
];
for (const vp of mobileViewports) {
  try {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1200);

    // horizontal scroll = layout broken
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 10);
    if (hasHScroll) fail('Mobile', `${vp.name} (${vp.width}px) — horizontal scroll detected (layout overflow)`);
    else            pass('Mobile', `${vp.name} (${vp.width}px) — no horizontal overflow`);

    // hamburger menu
    const hamb = await page.$('.hamb, [aria-label="Menu"], button[class*="menu"]').catch(() => null);
    if (vp.width < 769) {
      if (hamb) {
        const hambVisible = await hamb.isVisible();
        if (hambVisible) pass('Mobile', `${vp.name} — hamburger menu visible`);
        else             warn('Mobile', `${vp.name} — hamburger in DOM but not visible`);

        await hamb.click().catch(() => {});
        await page.waitForTimeout(400);
        const mobileMenu = await page.$('.mobile-menu.open, [class*="mobile-menu"][class*="open"]').catch(() => null);
        if (mobileMenu) pass('Mobile', `${vp.name} — mobile menu opens on tap`);
        else            warn('Mobile', `${vp.name} — mobile menu did not open`);
        // close it
        await page.keyboard.press('Escape').catch(() => {});
        const closeBtn = await page.$('.mm-close').catch(() => null);
        if (closeBtn) await closeBtn.click().catch(() => {});
      } else {
        fail('Mobile', `${vp.name} — no hamburger menu at ${vp.width}px`);
      }
    }

    // auth page mobile
    await page.goto(`${BASE}/auth.html`, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(800);
    const authHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 10);
    if (authHScroll) fail('Mobile', `${vp.name} — auth.html horizontal overflow`);
    else             pass('Mobile', `${vp.name} — auth.html no overflow`);

  } catch (e) {
    fail('Mobile', `${vp.name} viewport test error: ${e.message}`);
  }
}

// Reset to desktop
await page.setViewportSize({ width: 1440, height: 900 });

// ── 12. BACKEND API HEALTH ───────────────────────────────────────────────────
head('12. BACKEND API HEALTH');
const endpoints = [
  { method: 'GET',  path: '/health',          auth: false, label: 'Health check' },
  { method: 'GET',  path: '/dashboard/threats', auth: true,  label: 'Threat feed' },
  { method: 'GET',  path: '/dashboard/stats',  auth: true,  label: 'Dashboard stats' },
  { method: 'GET',  path: '/auth/me',          auth: true,  label: 'Auth /me' },
];
const token = await page.evaluate(() => sessionStorage.getItem('cs_token')).catch(() => null);
for (const ep of endpoints) {
  try {
    const headers = ep.auth && token ? { Authorization: `Bearer ${token}` } : {};
    const res = await page.request.fetch(`${API}${ep.path}`, { method: ep.method, headers, timeout: 8000 });
    const status = res.status();
    if (status < 400)      pass('API', `${ep.label} → ${status}`);
    else if (status === 401) warn('API', `${ep.label} → 401 Unauthorized${!token ? ' (no token)' : ''}`);
    else if (status === 404) fail('API', `${ep.label} → 404 Not Found (${API}${ep.path})`);
    else                     warn('API', `${ep.label} → ${status}`);
  } catch (e) {
    fail('API', `${ep.label} → network error: ${e.message.slice(0,60)}`);
  }
}

// ── CONSOLE ERRORS SUMMARY ───────────────────────────────────────────────────
head('CONSOLE ERRORS COLLECTED');
if (pageErrors.length === 0) {
  pass('Console', 'No JS console errors detected');
} else {
  for (const e of pageErrors.slice(0, 20)) {
    fail('Console', `[${e.url.replace(BASE,'')}] ${e.text.slice(0,120)}`);
  }
  if (pageErrors.length > 20) warn('Console', `...and ${pageErrors.length - 20} more errors`);
}

// ── FINAL REPORT ─────────────────────────────────────────────────────────────
await browser.close();

const passes  = results.filter(r => r.status.includes('PASS'));
const fails   = results.filter(r => r.status.includes('FAIL'));
const warns   = results.filter(r => r.status.includes('WARN'));

console.log(`
${'═'.repeat(62)}
  CYBERSHIELD E2E TEST REPORT
${'═'.repeat(62)}

  ✅ Passed : ${passes.length}
  ❌ Failed : ${fails.length}
  ⚠️  Warnings: ${warns.length}
  🔗 Broken links: ${brokenLinks.length}

${'─'.repeat(62)}
  FAILURES
${'─'.repeat(62)}`);
for (const f of fails) console.log(`  ❌ [${f.section}] ${f.msg}`);

console.log(`\n${'─'.repeat(62)}
  WARNINGS
${'─'.repeat(62)}`);
for (const w of warns) console.log(`  ⚠️  [${w.section}] ${w.msg}`);

if (brokenLinks.length) {
  console.log(`\n${'─'.repeat(62)}
  BROKEN LINKS
${'─'.repeat(62)}`);
  for (const l of brokenLinks) console.log(`  ❌ [${l.status}] ${l.url}\n     "${l.text}"`);
}

console.log(`\n${'═'.repeat(62)}\n`);
