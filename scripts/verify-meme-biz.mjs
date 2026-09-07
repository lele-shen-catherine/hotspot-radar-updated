import { chromium } from 'playwright';
const url = 'http://127.0.0.1:8899/dashboard.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const r = await page.evaluate(() => ({
  bodyText: document.body.innerText.slice(0, 4000),
  memeCards: document.querySelectorAll('.meme-card').length,
  memeStatus: document.querySelector('.meme-status')?.textContent,
  bizOptions: Array.from(document.querySelectorAll('#business-select option')).map(o=>o.textContent),
  bizAction: document.getElementById('business-action')?.textContent,
}));
console.log(JSON.stringify(r, null, 2));
await browser.close();