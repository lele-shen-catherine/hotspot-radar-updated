import { readFileSync } from 'node:fs';

const base = '/root/.joyclaw/workspace/hotspot-radar-updated/public/data/';
const b = JSON.parse(readFileSync(base + 'business-advice.json', 'utf8'));

console.log('business-advice top keys:', Object.keys(b));
const bus = b.businesses || {};
const keys = Object.keys(bus);
console.log('businesses:', keys.join(' | '));

let r3 = 0;
keys.forEach(k => {
  const item = bus[k];
  const action = (item.action || '');
  const comms = (item.comms || '');
  const hasHotspot = /借「|借"|借」|结合.*热点|围绕.*借/.test(action + comms);
  if (!hasHotspot) { r3++; console.log('R3可能违规:', k, '->', action.slice(0, 80)); }
  else console.log('R3通过:', k, '->', action.slice(0, 80));
});
console.log('=== 规则3(先写明借哪个热点) 违规:', r3, '/', keys.length);