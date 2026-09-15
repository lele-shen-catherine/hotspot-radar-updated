import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('public/data/radar.json','utf8'));
console.log('date:', r.date);
for (const h of r.hotspots||[]) {
  console.log(h.level, '|', h.title, '| totalScore=', h.totalScore,
    '| eventSummary=', !!h.eventSummary, '| whyHot=', !!h.whyHot, '| riskNote=', !!h.riskNote,
    '| platforms=', JSON.stringify((h.platforms||[]).map(p=>({pl:p.platform,rk:p.rank,hot:p.hot}))));
}