#!/usr/bin/env node
/**
 * 把 ai-analysis.json 中 AI 深度分析注入 radar.json 的事件解释/为什么热/风险
 * 使页面展示的"事件解释/为什么热度高/风险提醒"来自 AI 思考而非原始爬取标题。
 * 用法: node scripts/patch-radar-with-ai.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const radarPath = path.join(root, 'public', 'data', 'radar.json');
const aiPath = path.join(root, 'public', 'data', 'ai-analysis.json');

if (!existsSync(radarPath) || !existsSync(aiPath)) {
  console.error('❌ 缺少 radar.json 或 ai-analysis.json');
  process.exit(1);
}

const radar = JSON.parse(readFileSync(radarPath, 'utf-8'));
const ai = JSON.parse(readFileSync(aiPath, 'utf-8'));
const analyses = ai.analyses || {};

let patched = 0, missing = 0;
for (const h of radar.hotspots || []) {
  const a = analyses[h.title];
  if (!a) { missing++; console.warn(`⚠️ 无 AI 分析: ${h.title}`); continue; }
  h.eventSummary = a.explanation || h.eventSummary;
  h.propagation   = a.whyHot    || h.propagation;
  h.riskNote      = a.risk      || h.riskNote;
  patched++;
}

writeFileSync(radarPath, JSON.stringify(radar, null, 2), 'utf-8');
console.log(`✅ 已用 AI 深度分析修补 radar.json: ${patched} 条注入, ${missing} 条缺失`);