// Renders banner.html to docs/social-banner.png (1280x640) for the GitHub
// social preview card. Local dev tooling only — reuses the Playwright install
// from this folder. Run: node make-banner.mjs

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = pathToFileURL(path.join(__dirname, 'banner.html')).href;
const OUT = path.resolve(__dirname, '../../docs/social-banner.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
await page.goto(SRC, { waitUntil: 'networkidle' });
await page.waitForTimeout(600); // let the webfont settle
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1280, height: 640 } });
await browser.close();
console.log(`Wrote ${OUT}`);
