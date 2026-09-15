import { chromium } from 'playwright';

const url = 'http://127.0.0.1:8899/dashboard.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
const pageErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(err.message));

const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
const status = resp ? resp.status() : 'NO_RESPONSE';
await page.waitForTimeout(2500);

const data = await page.evaluate(() => {
  const text = document.body.innerText;
  // count S-level and A-level hotspot markers in rendered text
  const sMatch = text.match(/S级|S\b/g) || [];
  const aMatch = text.match(/A级|A\b/g) || [];
  return {
    bodyTextLen: text.length,
    hasGuo: /郭德纲/.test(text),
    hasHuawei: /华为/.test(text),
    hasOat: /燕麦/.test(text),
    hasQing: /青春华章/.test(text),
    hasZheng: /郑钦文/.test(text),
    hasWomen: /女篮/.test(text),
    sOccurrences: sMatch.length,
    aOccurrences: aMatch.length,
    // look for explicit level badges like "S" near titles
    sample: text.slice(0, 800)
  };
});

console.log(JSON.stringify({ httpStatus: status, consoleErrors, pageErrors, data }, null, 2));
await browser.close();