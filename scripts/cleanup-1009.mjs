import fs from 'fs';
import path from 'path';

const dir = 'public/data';
const banned = ['蔡康永', '台独', '台湾'];

function load(f) { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
function save(f, o) { fs.writeFileSync(path.join(dir, f), JSON.stringify(o, null, 2)); }

// 1. radar.json — remove 蔡康永 hotspot
const radar = load('radar.json');
const beforeR = radar.hotspots.length;
radar.hotspots = radar.hotspots.filter(h => !banned.some(b => String(h.title||h.eventName||h.topic||'').includes(b)));
radar.note = radar.note.replace(/固定\s*6\s*席/g, '固定 5 席').replace('固定6席', '固定5席');
save('radar.json', radar);

// 2. ai-analysis.json — remove 蔡康永 analysis (analyses is a dict keyed by title)
const ai = load('ai-analysis.json');
const beforeA = Object.keys(ai.analyses||{}).length;
for (const b of banned) {
  for (const k of Object.keys(ai.analyses||{})) {
    if (String(k).includes(b)) delete ai.analyses[k];
  }
}
if (ai.businessAdvice && Array.isArray(ai.businessAdvice)) {
  ai.businessAdvice = ai.businessAdvice.filter(s => !banned.some(b => String(s).includes(b)));
}
save('ai-analysis.json', ai);

// 3. gen-daily-content.json — remove 蔡康永 event
const gen = load('gen-daily-content.json');
const beforeG = gen.events.length;
gen.events = gen.events.filter(e => {
  const t = typeof e === 'string' ? e : String(e.title||e.topic||'');
  return !banned.some(b => t.includes(b));
});
if (gen.businessAdvice && Array.isArray(gen.businessAdvice)) {
  // ensure no banned strings in businessAdvice text
  gen.businessAdvice = gen.businessAdvice.filter(s => !banned.some(b => String(s).includes(b)));
}
save('gen-daily-content.json', gen);

// 4. business-advice.json — remove 蔡康永 from coreThemes
const ba = load('business-advice.json');
const beforeT = (ba.coreThemes||[]).length;
ba.coreThemes = (ba.coreThemes||[]).filter(t => !banned.some(b => String(t).includes(b)));
save('business-advice.json', ba);

// 5. latest.json — remove 蔡康永 from platform items if present
const latest = load('latest.json');
let removedLatest = 0;
for (const k of Object.keys(latest.platforms||{})) {
  const items = latest.platforms[k].items||[];
  latest.platforms[k].items = items.filter(it => {
    const t = String(it.title||'');
    if (banned.some(b => t.includes(b))) { removedLatest++; return false; }
    return true;
  });
  latest.platforms[k].count = latest.platforms[k].items.length;
}
save('latest.json', latest);

console.log('radar hotspots:', beforeR, '->', radar.hotspots.length);
console.log('ai analyses:', beforeA, '->', Object.keys(ai.analyses||{}).length);
console.log('gen events:', beforeG, '->', gen.events.length);
console.log('business-advice coreThemes:', beforeT, '->', ba.coreThemes.length);
console.log('latest removed:', removedLatest);