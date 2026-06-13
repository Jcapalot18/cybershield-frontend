import { chromium } from 'playwright';
const BASE = 'https://cybrshieldtech.com';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const viewports = [
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'Pixel 7',   width: 412, height: 915 },
  { name: 'iPad',      width: 768, height: 1024 },
];
// Note: testing against deployed site — need to test local file for immediate fix
// Load auth.html from local file to test the fix before pushing
const localPath = 'file:///C:/Users/jfine/Downloads/cybershield-site/auth.html';
for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(localPath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const scrollW = await page.evaluate(() => document.body.scrollWidth);
  const vw      = await page.evaluate(() => window.innerWidth);
  const overflow = scrollW > vw + 5;
  console.log(`${overflow ? '❌' : '✅'} ${vp.name} (${vp.width}px): scrollWidth=${scrollW} innerWidth=${vw} ${overflow ? 'OVERFLOW' : 'OK'}`);
}
await browser.close();
