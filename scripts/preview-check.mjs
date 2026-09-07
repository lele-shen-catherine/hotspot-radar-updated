import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  const url = 'http://localhost:8899/public/dashboard.html';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 截图
  await page.screenshot({ path: '/tmp/dashboard-preview.png', fullPage: true });

  // 抓取关键文本验证
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasDate: text.includes('2026-09-07'),
      hotCount: (text.match(/原来学习好|老派少女|葫芦娃爷爷|贫困生喝咖啡/g) || []).length,
      hasMeme: text.includes('可复刻模板') || text.includes('入选理由'),
      hasBusiness: text.includes('京东外卖') && text.includes('七鲜咖啡'),
      hasWhyHot: text.includes('为什么热度高'),
      hasTrendToggle: !!document.querySelector('.trend-toggle'),
      bodyStart: text.slice(0, 100),
    };
  });

  console.log('=== 渲染检查 ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== console errors ===', errors.length ? errors : '无');
  await browser.close();
})();