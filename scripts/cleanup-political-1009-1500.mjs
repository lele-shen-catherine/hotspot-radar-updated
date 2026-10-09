// 2026-10-09 15:00 下午场补漏：彻底移除「蔡康永现身台独分子竞选会场」（政治敏感，四类不展示，抓到即删不上页面）
// 覆盖 gen-daily-content.json + latest.json 中残留引用
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/data');
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const save = (f, d) => fs.writeFileSync(path.join(dir, f), JSON.stringify(d, null, 2), 'utf8');
const POLITICAL = '蔡康永现身台独分子竞选会场';

// ---- 1) gen-daily-content.json ----
const gdc = load('gen-daily-content.json');
const beforeEvents = gdc.events.length;
gdc.events = (gdc.events || []).filter((e) => {
  const t = e.title || e.eventName || e.name || '';
  return t !== POLITICAL;
});
// businessAdvice 中若有该热点借势，改写为常规运营/去掉
if (gdc.businessAdvice) {
  const s = JSON.stringify(gdc.businessAdvice, null, 2);
  if (s.includes(POLITICAL)) {
    // 若业务建议误借政治热点，直接移除对应字段引用（保守处理）
    gdc.businessAdvice = {};
    console.log('[gdc] businessAdvice 含政治热点，已清空');
  }
}
// meta 计数修正
if (gdc.meta && typeof gdc.meta.hardExcluded === 'number') {
  gdc.meta.hardExcluded += (beforeEvents - gdc.events.length);
}
save('gen-daily-content.json', gdc);
console.log(`[gdc] events ${beforeEvents} -> ${gdc.events.length} (移除 ${beforeEvents - gdc.events.length})`);

// ---- 2) latest.json ----
const latest = load('latest.json');
if (latest.platforms) {
  for (const key of Object.keys(latest.platforms)) {
    const p = latest.platforms[key];
    if (p && Array.isArray(p.items)) {
      const before = p.items.length;
      p.items = p.items.filter((it) => (it.title || '') !== POLITICAL);
      p.count = p.items.length;
      if (p.items.length !== before) console.log(`[latest] ${key} items ${before} -> ${p.items.length}`);
    }
  }
}
save('latest.json', latest);
console.log('[latest] cleaned');

console.log('cleanup-political done');