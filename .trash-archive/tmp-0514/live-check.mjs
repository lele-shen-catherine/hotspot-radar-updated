import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://lele-shen-catherine.github.io/hotspot-radar-updated/dashboard.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
const r = await page.evaluate(() => {
  const sel = document.getElementById('business-select');
  const action = document.getElementById('business-action');
  const comms = document.getElementById('business-comms');
  const list = document.getElementById('business-advice-list');
  return {
    url: location.href,
    options: sel ? [...sel.options].map(o=>o.textContent) : [],
    selectValue: sel ? sel.value : null,
    hasActionCard: !!action,
    actionText: action ? action.textContent.slice(0,110) : null,
    commsText: comms ? comms.textContent.slice(0,110) : null,
    hasLegacyList: !!list
  };
});
console.log(JSON.stringify(r,null,2));
await browser.close();
