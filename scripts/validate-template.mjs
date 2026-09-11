#!/usr/bin/env node
/**
 * Hotspot Radar 全链路质量门禁（loader 版 dashboard 适配）
 *
 * 架构说明：
 *  dashboard 已是 loader 版 —— 运行时从 data/latest.json / jsDelivr CDN 动态拉取
 *  radar.json 渲染 AI 深度思考字段，HTML 内不再硬编码 eventSummary 等字段名。
 *  因此本脚本不再检查 dashboard HTML 里的 AI 字段字符串，
 *  改为直接校验数据文件本身是否真实包含 AI 字段 + 业务建议 + meme 数据。
 */
import { access, readFile } from "node:fs/promises";

// ---------- 1. 必需文件存在性 ----------
const required = [
  "public/dashboard.html",
  "public/history-view.html",
  "public/data/latest.json",
  "public/data/radar.json",
  "public/data/business-advice.json",
  "public/data/meme-topics.json",
  "config/hotspot-rules.json",
  ".github/workflows/update-hotspot.yml"
];

for (const path of required) await access(path);

// ---------- 2. JSON 可解析性 ----------
for (const path of [
  "public/data/latest.json",
  "public/data/radar.json",
  "public/data/business-advice.json",
  "public/data/meme-topics.json",
  "config/hotspot-rules.json"
]) {
  JSON.parse(await readFile(path, "utf8"));
}

// ---------- 3. dashboard 板块 UI 存在性（随页面结构同步） ----------
const dashboard = await readFile("public/dashboard.html", "utf8");
const markers = ["S级热点", "A级热点", "B级热点", "热度值排行榜", "小红书等平台热榜预览", "本地生活业务建议", "可复刻模板"];
for (const marker of markers) {
  if (!dashboard.includes(marker)) throw new Error(`Dashboard module missing: ${marker}`);
}

// ---------- 4. 数据文件 AI 深度字段真实存在（loader 版真正的质量门禁） ----------
const radar = JSON.parse(await readFile("public/data/radar.json", "utf8"));
const hotspots = radar.hotspots || [];
if (!hotspots.length) throw new Error("radar.json 无热点数据");

// 每条热点必须含 AI 深度分析三要素
const AI_FIELDS = ["eventSummary", "propagation", "riskNote"];
for (let i = 0; i < hotspots.length; i++) {
  const h = hotspots[i];
  for (const f of AI_FIELDS) {
    if (!h[f]) throw new Error(`radar.json 第 ${i + 1} 条热点缺失 AI 字段: ${f}`);
  }
}
console.log(`[门禁] radar.json ${hotspots.length} 条热点 AI 字段完整`);

// ---------- 5. business-advice 与 meme-topics 非空 ----------
const advice = JSON.parse(await readFile("public/data/business-advice.json", "utf8"));
if (!advice.date || !advice.businesses || !Object.keys(advice.businesses).length) {
  throw new Error("business-advice.json 缺少当日业务建议（businesses 非空）");
}
console.log(`[门禁] business-advice.json 当日业务建议完整 (${Object.keys(advice.businesses).length} 类)`);

const meme = JSON.parse(await readFile("public/data/meme-topics.json", "utf8"));
if (!meme.date || !Array.isArray(meme.items) || !meme.items.length) {
  throw new Error("meme-topics.json 缺少当日 meme 话题");
}
console.log(`[门禁] meme-topics.json ${meme.items.length} 条 meme 话题完整`);

console.log("Hotspot radar template validation passed. ✅");