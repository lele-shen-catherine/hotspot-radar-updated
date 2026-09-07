import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const url = 'https://hotspot-radar-kaikai-v2.netlify.app/dashboard.html';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/tmp/live-v2.png', fullPage: true });
  const data = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasDate07: t.includes('2026-09-07'),
      eventCount: (t.match(/原来学习好有肉吃|老派少女的穿搭|葫芦娃爷爷|贫困生喝咖啡/g) || []).length,
      whyHotCount: (t.match(/为什么热度高/g) || []).length,
      memeCount: (t.match(/可复刻模板/g) || []).length,
      hasBusiness: t.includes('京东外卖') && t.includes('七鲜咖啡') && t.includes('京东点评'),
      hasRisk: t.includes('风险边界'),
      hasTrendToggle: !!document.querySelector('.trend-toggle, .trend-inner, #live-chart'),
      hasReplacement: (t.replace(/[^\u4e00-\u9fa5]/g,'').includes('万千气象看北京')) || (t.replace(/[^\u4e00-\u9fa5]/g,'').includes('自然里长出生命力')),
      historyLatest: t.match(/2026-09-\d\d/g),
      httpStatus: 'loaded',
      memeCards: document.querySelectorAll('.meme-card').length,
      businessOptions: [...document.querySelectorAll('.business-select option')].map(o=>o.textContent),
    };
  });
  console.log('=== 线上验收 ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== errors ===', errors.length ? errors : '无');
  await browser.close();
})();