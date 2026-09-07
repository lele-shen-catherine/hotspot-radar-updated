#!/usr/bin/env node
/**
 * 注入最新数据到 dashboard.html 内嵌区
 * 流程:
 *  1. 读 public/data/radar.json (最新核心数据)
 *  2. 读取 public/data/business-advice.json 与 public/data/meme-topics.json (若无当日则生成占位)
 *  3. 用最新数据替换 dashboard.html 注入区区块
 * 用法: node scripts/inject-dashboard-data.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const htmlPath = path.join(publicDir, 'dashboard.html');
const radarPath = path.join(publicDir, 'data', 'radar.json');
const advicePath = path.join(publicDir, 'data', 'business-advice.json');
const memePath = path.join(publicDir, 'data', 'meme-topics.json');

function readJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

const radar = readJson(radarPath);
if (!radar) {
  console.error('❌ 缺少 radar.json，无法注入');
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf-8');
const date = radar.date || '';

// ---------- 读取 BUSINESS_ADVICE ----------
// 业务建议由 gen-daily-content.mjs 基于当天热点完整生成，此处直接读取注入，绝不复用旧事件建议。
const hotspots = radar.hotspots || [];
const advice = readJson(advicePath) || { date, basis: '智能分析本次暂未生成', coreThemes: [], businesses: {} };

// ---------- MEME_TOPICS ----------
// 玩梗由 gen-daily-content.mjs 完成内容级核验后生成，此处直接读取注入，绝不从热点自动拼凑或沿用旧玩梗。
const meme = readJson(memePath) || { date, items: [] };

// ---------- 替换三个注入区 ----------
function replaceBlock(html, id, varName, data) {
  const startTag = `<script id="${id}">window.${varName}=`;
  const start = html.indexOf(startTag);
  if (start < 0) {
    console.error(`❌ 未找到 ${id} 注入区`);
    return html;
  }
  const end = html.indexOf('</script>', start);
  if (end < 0) { console.error(`❌ ${id} 无闭合`); return html; }
  const jsonStr = JSON.stringify(data, null, 2);
  const newBlock = `<script id="${id}">window.${varName}=${jsonStr};</script>`;
  return html.slice(0, start) + newBlock + html.slice(end + '</script>'.length);
}

html = replaceBlock(html, 'radar-current-data', '__RADAR_DATA__', radar);
html = replaceBlock(html, 'business-advice-data', '__BUSINESS_ADVICE__', advice);
html = replaceBlock(html, 'meme-data', '__MEME_TOPICS__', meme);

writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ dashboard.html 已注入 ${date} 数据 (radar=${radar.hotspots?.length || 0} hotspots, advice=${Object.keys(advice.businesses||{}).length})`);