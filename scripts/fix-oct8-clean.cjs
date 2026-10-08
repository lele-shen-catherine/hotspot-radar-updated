const fs = require('fs');
const path = '/root/.joyclaw/workspace/hotspot-radar-updated/public/data/';

// 1. business-advice.json: coreThemes 删蔡康永
const b = JSON.parse(fs.readFileSync(path + 'business-advice.json', 'utf8'));
if (Array.isArray(b.coreThemes)) {
  b.coreThemes = b.coreThemes.filter(t => !t.includes('蔡康永') && !t.includes('台独'));
}
fs.writeFileSync(path + 'business-advice.json', JSON.stringify(b, null, 2));
console.log('business-advice.coreThemes:', b.coreThemes.length, '(蔡康永已删)');

// 2. latest.json: platforms.*.items 过滤蔡康永/台独
const l = JSON.parse(fs.readFileSync(path + 'latest.json', 'utf8'));
let removed = 0;
Object.keys(l.platforms || {}).forEach(pk => {
  const items = l.platforms[pk].items;
  if (Array.isArray(items)) {
    const before = items.length;
    l.platforms[pk].items = items.filter(i => {
      const s = JSON.stringify(i);
      if (s.includes('蔡康永') || s.includes('台独')) { removed++; return false; }
      return true;
    });
    if (items.length !== before) console.log('  platforms.' + pk + '.items: ' + before + ' -> ' + l.platforms[pk].items.length);
  }
});
l.generatedAt = new Date().toISOString();
fs.writeFileSync(path + 'latest.json', JSON.stringify(l, null, 2));
console.log('latest.json 已清理, 移除', removed, '条');