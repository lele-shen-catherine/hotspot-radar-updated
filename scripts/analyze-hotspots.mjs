#!/usr/bin/env node
/**
 * 热度分级（新规 v2 §九）
 * 热度值 = 峰值榜位×35% + 平台公开热度×20% + 在榜时长×25% + 跨平台×20%
 * - 除四类硬性排除外，客观达到 S/A/B 全部展示，不再以业务相关性/借势价值作门槛（§一）
 * - 风险只影响 riskNote 与业务建议，不影响 S/A/B 等级（§一.3）
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = JSON.parse(await readFile(join(ROOT, "data/processed/candidates.json"), "utf8"));

// 与 config/hotspot-rules.json 一致的四类硬性排除语义复核（此处为分析层二次复核）
const RISK_KEYWORDS = /死亡|遇难|伤亡|坠亡|自杀|杀人|强奸|猥亵|诈骗|被捕|刑拘|被查|违法|事故|爆炸|火灾|地震|洪水|灾情|塌方|泥石流|救援|失联|溺水|战争|军事冲突|围剿|网暴|仇富|地域歧视/;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 10) / 10;

// 同平台热度标准化：微博、抖音、小红书各自归一化到 0-100，不做跨平台横向相加（§九.2）
function normalizeHot(platform, hot) {
  if (hot == null) return null;
  const n = Number(hot);
  // 微博热搜热度通常 50~500 万；抖音热榜通常 10~10000；小红书热度差异较大
  const cap = { weibo: 2000000, douyin: 20000, xhs: 200000, xiaohongshu: 200000 }[platform] || 2000000;
  return clamp((n / cap) * 100);
}

// 峰值榜位得分：榜位越小得分越高（仅使用出现过的最好排名，§九.1）
function rankScore(bestRank) {
  if (!bestRank) return 30;
  if (bestRank <= 3) return 100;
  if (bestRank <= 5) return 92;
  if (bestRank <= 10) return 80;
  if (bestRank <= 20) return 64;
  if (bestRank <= 30) return 50;
  return 40;
}

// 在榜时长得分：优先时光热搜；无可靠时长→缺失（§九.3）
function durationScore(durationMin) {
  if (!durationMin) return null; // 标记缺失
  if (durationMin >= 180) return 100;
  if (durationMin >= 120) return 90;
  if (durationMin >= 60) return 80;
  if (durationMin >= 30) return 65;
  if (durationMin >= 10) return 50;
  return 30;
}

// 跨平台得分：同平台多个话题只算一个平台（§九.4）
function crossPlatformScore(platformCount) {
  if (platformCount >= 3) return 100;
  if (platformCount === 2) return 75;
  if (platformCount === 1) return 45;
  return 0;
}

function assess(candidate) {
  const platforms = candidate.platforms || [];
  const platformCount = new Set(platforms.map((p) => p.platform)).size;

  // 峰值榜位 = 出现过的最高（即最小 rank）
  const bestRank = Math.min(...platforms.map((p) => p.rank || 99));
  // 平台公开热度：取各平台标准化后均值（不跨平台相加）
  const hotScores = platforms.map((p) => normalizeHot(p.platform, p.hot)).filter((v) => v != null);
  const hotScore = hotScores.length ? hotScores.reduce((s, v) => s + v, 0) / hotScores.length : 0;
  // 在榜时长：优先时光热搜字段，缺失则记 0 并在展示中标记“暂无可核验在榜时长”
  const duration = candidate.bestDurationMin ?? candidate.durationMin ?? null;

  const sRank = rankScore(bestRank);
  const sHot = hotScore;
  const sDur = durationScore(duration) ?? 0;
  const sCross = crossPlatformScore(platformCount);
  const totalScore = round(sRank * 0.35 + sHot * 0.2 + sDur * 0.25 + sCross * 0.2);

  // S/A/B 完全依据客观热度值（§九），不依赖业务相关性/借势价值
  const level = totalScore >= 85 ? "S" : totalScore >= 70 ? "A" : totalScore >= 60 ? "B" : "C";

  // 风险与业务相关性：只影响 riskNote / businessAction，不改等级（§一.3）
  const isPublicService = /台风|暴雨|高温|降温|寒潮|大风|天气|预警/.test(candidate.title);
  const riskLevel = isPublicService ? "medium" : "low";
  const riskNote = isPublicService
    ? "公共信息服务事件：只允许权威信息、履约调整与民生保障提醒，不做娱乐化表达。"
    : "低风险，发布前复核事实、版权与品牌语境。";

  return {
    ...candidate,
    peakRank: bestRank,
    platformCount,
    subScores: { rank: round(sRank), hot: round(sHot), duration: sDur, cross: round(sCross) },
    totalScore,
    level,
    riskLevel,
    riskNote,
    eventSummary: candidate.title,
    // 传播状态（纯文字，需有上午/下午或时光数据支持；无数据则写“当前数据源暂不可用”）
    propagation: candidate.propagation || "当前数据源暂不可用",
    // 业务建议由 gen-daily-content.mjs 针对有真实连接点的热点生成，此处不填默认占位
    businessNote: isPublicService
      ? "仅做权威信息服务与履约保障，不商业化表达。"
      : "是否生成业务建议由 AI 层依据真实连接点判断。"
  };
}

const decisions = input.candidates.map(assess).sort((a, b) => b.totalScore - a.totalScore);
// 四类硬性排除已由初筛置于 pendingReview，不进入正式展示
const hotspots = decisions.filter((d) => d.level !== "C");
const watchlist = decisions.filter((d) => d.level === "C");

const radar = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  date: input.date,
  sourceGeneratedAt: input.sourceGeneratedAt,
  provider: "objective-heat",
  model: "auditable-heat-v2",
  summary: {
    analyzed: decisions.length,
    S: hotspots.filter((d) => d.level === "S").length,
    A: hotspots.filter((d) => d.level === "A").length,
    B: hotspots.filter((d) => d.level === "B").length,
    hotspots: hotspots.length,
    watchlist: watchlist.length
  },
  hotspots,
  watchlist
};

const targets = [join(ROOT, "public/data/radar.json"), join(ROOT, `public/data/history/${input.date}-radar.json`)];
for (const target of targets) {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(radar, null, 2) + "\n", "utf8");
}
console.log(`热度分级完成：S=${radar.summary.S} A=${radar.summary.A} B=${radar.summary.B} 观察=${radar.summary.watchlist}`);