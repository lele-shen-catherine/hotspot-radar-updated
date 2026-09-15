import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8899/dashboard.html', { waitUntil: 'networkidle', timeout: 20000 });
const result = await page.evaluate(async () => {
  const resp = await fetch('business-advice.json');
  const text = await resp.text();
  return { status: resp.status, head: text.slice(0, 400) };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
