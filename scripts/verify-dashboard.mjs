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
  return {
    bodyTextLen: text.length,
    // meme cards
    memeCards: document.querySelectorAll('[class*="meme"], [class*="meme-item"], .meme-card').length,
    memeText: (text.match(/燕麦卫衣|郑钦文|玩梗/g) || []).length,
    // biz
    bizHasOuts: /京东外卖/.test(text),
    bizHasSec: /京东秒送/.test(text),
    bizHasHome: /京东家政/.test(text),
    // hotspot titles
    hasGuo: /郭德纲/.test(text),
    hasHuawei: /华为/.test(text),
    hasOat: /燕麦/.test(text),
    sample: text.slice(0, 500)
  };
});

await page.screenshot({ path: '/root/.joyclaw/workspace/hotspot-radar-updated/verify-dashboard-final.png', fullPage: true });

console.log(JSON.stringify({ httpStatus: status, consoleErrors, pageErrors, data }, null, 2));
await browser.close();