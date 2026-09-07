import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + ' | stack: ' + (e.stack||'').slice(0,400)));
  const url = 'http://localhost:8899/dashboard.html';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      memeTopicsLen: (window.__MEME_TOPICS__ && window.__MEME_TOPICS__.items) ? window.__MEME_TOPICS__.items.length : 'undefined',
      businessKeys: window.__BUSINESS_ADVICE__ && window.__BUSINESS_ADVICE__.businesses ? Object.keys(window.__BUSINESS_ADVICE__.businesses) : 'undefined',
      radarHotspots: window.__RADAR_DATA__ && window.__RADAR_DATA__.hotspots ? window.__RADAR_DATA__.hotspots.length : 'undefined',
      memeGroupExists: !!document.querySelector('.meme-group'),
      memeGroupHtmlLen: (document.querySelector('.meme-group')||{}).innerHTML ? document.querySelector('.meme-group').innerHTML.length : 0,
      hasMemeText: text.includes('可复刻模板') || text.includes('入选理由'),
      hotCount: (text.match(/原来学习好|老派少女|葫芦娃爷爷|贫困生喝咖啡/g) || []).length,
      hasDate: text.includes('2026-09-07'),
      bodyStart: text.slice(0, 80).replace(/\n/g,' | '),
    };
  });
  console.log('=== 渲染检查 ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('=== errors ===', errors.length ? errors : '无');
  await browser.close();
})();