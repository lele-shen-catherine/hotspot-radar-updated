import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8899/dashboard.html', { waitUntil: 'networkidle', timeout: 20000 });
const result = await page.evaluate(async () => {
  // Re-fetch directly and inspect what render() sees
  const resp = await fetch('business-advice.json');
  const data = await resp.json();
  const wm = data.businesses['京东外卖'];
  return {
    fileKeys: Object.keys(data.businesses),
    wmAction: wm ? wm.action : 'MISSING',
    wmComms: wm ? wm.comms : 'MISSING',
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
