// Captures the documentation screenshots from a running HamLog demo instance.
//
// Prerequisites:
//   - The throwaway demo instance is running (see README.md in this folder)
//   - It is seeded with demo-seed.sql
//   - `npm install && npx playwright install chromium` has been run here
//
// Usage:  node capture.mjs   (optionally set BASE_URL, default http://localhost:8060)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../docs/screenshots');
const BASE = process.env.BASE_URL || 'http://localhost:8060';
const USER = 'demo';
const PASS = 'demo1234';

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`captured ${name}.png`);
};

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="text"]').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL(`${BASE}/`);
  await page.getByText('New QSO').waitFor();
}

async function main() {
  const browser = await chromium.launch();

  // ---- Desktop ----
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktop.newPage();

  // Logged-out pages
  await page.goto(`${BASE}/login`);
  await page.getByRole('button', { name: 'Log In' }).waitFor();
  await shot(page, 'login');

  await page.goto(`${BASE}/register`);
  await page.getByRole('button', { name: 'Register' }).waitFor();
  await shot(page, 'register');

  // Logged-in
  await login(page);
  await page.mouse.move(0, 0); // clear any accidental hover so the table is clean
  await page.waitForTimeout(500);
  await shot(page, 'log-table');

  // Search panel
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder('W1ABC').fill('VE3');
  await page.waitForTimeout(400);
  await shot(page, 'search-bar');
  // clear + close
  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(300);

  // Sort by Frequency (click header, show arrow)
  await page.getByText('Frequency', { exact: true }).click();
  await page.waitForTimeout(400);
  await shot(page, 'sort-columns');
  // reset to date desc by clicking Date twice if needed — leave as is, reload for clean state
  await page.goto(`${BASE}/`);
  await page.getByText('New QSO').waitFor();
  await page.waitForTimeout(400);

  // Callsign hover -> floating info panel (QSO 1 is VE3XMP)
  await page.getByText('VE3XMP', { exact: true }).first().hover();
  await page.waitForTimeout(900);
  await shot(page, 'callsign-hover');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // Expanded row — QSO 5 (DL1DMO) has POTA + notes + RST. Expand the first chevron.
  const chevrons = page.locator('table tbody button:has(svg)');
  // find the row for DL1DMO and click its expand chevron
  const row = page.locator('tr', { has: page.getByText('DL1DMO', { exact: true }) }).first();
  await row.locator('button').first().click();
  await page.waitForTimeout(500);
  await shot(page, 'expanded-row');
  await row.locator('button').first().click();
  await page.waitForTimeout(300);

  // Add QSO modal
  await page.getByText('New QSO').click();
  await page.waitForTimeout(400);
  await shot(page, 'add-qso');
  // Add a POTA record row
  await page.getByRole('button', { name: 'POTA' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'add-qso-pota');
  // close modal
  await page.keyboard.press('Escape').catch(() => {});
  await page.goto(`${BASE}/`);
  await page.getByText('New QSO').waitFor();

  // Map
  await page.goto(`${BASE}/map`);
  await page.waitForTimeout(3500); // allow tiles + markers to load
  // Zoom out so the whole world (all markers) fits in the viewport
  for (let i = 0; i < 3; i++) {
    await page.locator('.leaflet-control-zoom-out').click();
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(2000); // let the wider tiles load
  await shot(page, 'map-view');
  // Click a marker near the center of the viewport so its popup is visible
  const marker = page.locator('.leaflet-marker-icon').first();
  await marker.click({ force: true });
  await page.waitForTimeout(1200);
  await shot(page, 'map-popup');

  // Settings
  await page.goto(`${BASE}/settings`);
  await page.getByText('Appearance').waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'settings-theme');
  // Focused shot of just the Callsign Data / Backfill card
  const backfillCard = page.locator('.shadow-card', { hasText: 'Callsign Data' }).first();
  await backfillCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await backfillCard.screenshot({ path: path.join(OUT, 'settings-backfill.png') });
  console.log('captured settings-backfill.png');

  await desktop.close();

  // ---- Mobile ----
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mpage = await mobile.newPage();
  await login(mpage);
  await mpage.waitForTimeout(600);
  await shot(mpage, 'log-mobile');
  await mobile.close();

  await browser.close();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
