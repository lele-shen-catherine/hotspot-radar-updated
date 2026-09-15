import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
// 拦截 fetch，把 business-advice.json 指向本地 data/ 目录，模拟 CDN 正确路径
await page.route('**/business-advice.json', r => r.fulfill({
  status: 200,
  contentType: 'application/json',
  body: require('fs').readFileSync('public/data/business-advice.json','utf8')
}));
await page.goto('http://127.0.0.1:8899/dashboard.html', { waitUntil: 'networkidle', timeout: 20000 });
const result = await page.evaluate(() => {
  const sel = document.getElementById('business-select');
  const action = document.getElementById('business-action');
  const comms = document.getElementById('business-comms');
  return {
    options: sel ? [...sel.options].map(o=>o.textContent) : [],
    selectValue: sel ? sel.value : null,
    actionText: action ? action.textContent.slice(0,120) : null,
    commsText: comms ? comms.textContent.slice(0,120) : null
  };
});
console.log(JSON.stringify(result,null,2));
await browser.close();
