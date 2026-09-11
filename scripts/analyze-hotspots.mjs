#!/usr/bin/env node
/**
 * 热点雷达 · 每日分析（新规：固定6席 + 新热度公式分级）
 * 规则（用户自定义，2026-09-09 定稿）:
 *  - 固定6席 = 需要详细呈现的6个热点（选定不看热度值）:
 *      知微事见Top4 + 抖音Top1 + 微博Top1，同平台内先删四类禁区再顺延补足
 *  - 热度值只用来给这6席划分 S/A/B 等级:
 *      热度值 = 榜位35% + 平台热度20% + 趋势/持续性25% + 跨平台共振20%
 *  - 榜位/平台热度: 同平台同批次内转 0-100 百分位
 *  - 趋势: 上升100/高位85/平稳70/刚上榜或未知60/下降40; 缺时长记60
 *  - 共振: 三源100/两源80/单源但有外部讨论证据60/仅单平台45
 *  - 分级: S≥80, A=65~79.9, B<65
 *  - radar.json 只存这6席（页面只展示6张卡），按固定席位顺序
 *
 * 数据源: public/data/latest.json（含 webwide/douyin/weibo）
 *         + data/raw/<date>/webwide-<batch>.json（rankHour 历史批次，用于趋势）
 * 输出:   public/data/radar.json（6席，含 level 字段）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LATEST = path.join(root, "public", "data", "latest.json");
const OUT = path.join(root, "public", "data", "radar.json");
const RAW_DIR = path.join(root, "data", "raw");

// ---------- 四类禁区（与 config/hotspot-rules.json 一致，含语义复核关键词） ----------
const EXCLUDE = {
  gender_antagonism: ["男女对立","性别对立","性别攻击","性别歧视","婚恋污名","彩礼","生育对立","性别仇恨","网暴某一性别"],
  populism: ["阶层仇恨","地域歧视","敌我叙事","职业对立","集体抵制","围攻","群体攻击","极端民族主义"],
  animal_protection: ["虐狗","虐猫","偷狗","毒狗","捕杀流浪动物","爱狗人士冲突","爱猫人士冲突","宠物伤人争议","动物救助道德审判","宠物极端对立"],
  political_sensitive: ["中美关系","外交冲突","台湾","香港","新疆","西藏","领导人","政要","战争","军事冲突","军事演习","国家安全","选举","领土主权","外交制裁","政治传闻"],
};
function isExcluded(title) {
  const t = String(title || "").replace(/\u200c/g, ""); // 去零宽字符
  for (const [cat, kws] of Object.entries(EXCLUDE)) {
    for (const kw of kws) {
      if (t.includes(kw)) return cat;
    }
  }
  return null;
}

// ---------- 读取 latest.json ----------
let latest;
try {
  latest = JSON.parse(fs.readFileSync(LATEST, "utf8"));
} catch (e) {
  console.error("[analyze] latest.json 读取失败:", e.message);
  process.exit(1);
}
const date = latest.date;
const platforms = latest.platforms || {};
const webwideItems = (platforms.webwide?.items || []).map((it, i) => ({
  platform: "知微", title: String(it.title).replace(/\u200c/g, ""), hot: it.hot,
  rank: i + 1, url: it.url, eventId: extractEventId(it.url),
}));
const douyinItems = (platforms.douyin?.items || []).map((it, i) => ({
  platform: "抖音", title: String(it.title).replace(/\u200c/g, ""), hot: it.hot,
  rank: i + 1, url: it.url, label: it.label,
}));
const weiboItems = (platforms.weibo?.items || []).map((it, i) => ({
  platform: "微博", title: String(it.title).replace(/\u200c/g, ""), hot: it.hot,
  rank: i + 1, url: it.url, label: it.label,
}));

function extractEventId(url) {
  const m = String(url || "").match(/eventRk\/([\w]+)/);
  return m ? m[1] : null;
}

// ---------- 读取当天最新 webwide 原始 JSON（含 rankHour 历史批次，用于趋势） ----------
let rank = [];
let zhiweiRaw = null;
(function loadRankHour() {
  const dateDir = path.join(RAW_DIR, date);
  if (!fs.existsSync(dateDir)) return;
  const files = fs.readdirSync(dateDir).filter(f => f.startsWith("webwide-") && f.endsWith(".json"));
  if (!files.length) return;
  // 取最新批次文件
  files.sort();
  const f = files[files.length - 1];
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dateDir, f), "utf8"));
    rank = raw?.data?.rankHour || [];
  } catch (e) { console.warn("[warn] 读取 webwide 原始 rankHour 失败:", e.message); }
})();

// 历史: eventId -> { firstBatch, batches, ranks }
const hist = {};
rank.forEach((r, ri) => {
  (r.info || []).forEach((it, i) => {
    if (!it.eventId || it.eventId === "other_hidden" || it.eventId === "otherEventId") return;
    if (!hist[it.eventId]) hist[it.eventId] = { firstBatch: ri, batches: [], ranks: [] };
    hist[it.eventId].batches.push(ri);
    hist[it.eventId].ranks.push(i + 1);
  });
});

// ---------- 百分位工具 ----------
function percentileRank(arr, value, dir) {
  if (!arr.length) return 0;
  if (dir === "desc") { // 排名越小越好
    const below = arr.filter(x => x > value).length;
    return (below / arr.length) * 100;
  } else { // 热度越大越好
    const eq = arr.filter(x => x === value).length;
    const lt = arr.filter(x => x < value).length;
    return (lt + eq / 2) / arr.length * 100;
  }
}

// ---------- 趋势/持续性 ----------
function trendScoreZhiwei(item) {
  const h = hist[item.eventId || ""];
  const latestIdx = rank.length - 1;
  if (!h || !h.batches.length || latestIdx < 0) return { score: 60, evidence: "缺少在榜时长(按未知60)" };
  if (!h.batches.includes(latestIdx)) return { score: 60, evidence: "当前不在最新批次" };
  const span = latestIdx - Math.min(...h.batches);
  const lastRank = h.ranks[h.ranks.length - 1];
  const prevRank = h.ranks.length > 1 ? h.ranks[h.ranks.length - 2] : null;
  if (span === 0 && h.batches.length === 1) return { score: 60, evidence: `刚上榜(在榜${span}小时)` };
  if (prevRank !== null && prevRank > lastRank && (prevRank - lastRank) >= 1)
    return { score: 100, evidence: `排名上升 ${prevRank}→${lastRank}, 在榜${span}小时` };
  if (lastRank <= 4 && span >= 5) return { score: 85, evidence: `持续高位(第${lastRank}名, 在榜${span}小时)` };
  return { score: 70, evidence: `平稳(第${lastRank}名, 在榜${span}小时)` };
}
function trendScoreDouyin(item) {
  if (item.label === 3 || item.label === "爆") return { score: 85, evidence: "抖音标记'爆'" };
  if (item.label === 2 || item.label === "热") return { score: 70, evidence: "抖音标记'热'" };
  if (item.label === 1 || item.label === "新") return { score: 60, evidence: "抖音标记'新'(刚上榜)" };
  return { score: 60, evidence: "抖音无在榜时长(按60)" };
}
function trendScoreWeibo() { return { score: 60, evidence: "微博单次快照无在榜时长(按60)" }; }

// ---------- 跨平台共振（语义合并，排除自身平台） ----------
function resonanceScore(title, ownPlatform) {
  const norm = t => String(t || "").replace(/[：:，,。.!！?？\s"'"（）()\u200c]/g, "");
  const core = norm(title);
  const kw = core.slice(0, 8);
  const others = [];
  if (ownPlatform !== "抖音") others.push(...douyinItems.map(i => i.title));
  if (ownPlatform !== "微博") others.push(...weiboItems.map(i => i.title));
  if (ownPlatform !== "知微") others.push(...webwideItems.map(i => i.title));
  const matched = others.filter(t => {
    const n = norm(t);
    return n.includes(kw) || kw.includes(n.slice(0, 8)) || core.includes(n.slice(0, 6));
  });
  if (matched.length >= 1) return { score: 80, evidence: `两源共振(其他: ${matched.slice(0,2).join("、")})` };
  return { score: 45, evidence: "仅单平台, 未确认外部讨论证据" };
}

// ---------- 构建固定6席（删禁区后顺延） ----------
const fixed = [];
// 1) 知微 Top4（顺延）
const zhiweiValid = webwideItems.filter(i => !isExcluded(i.title));
zhiweiValid.slice(0, 4).forEach(i => fixed.push({ ...i, seat: "知微Top" + i.rank }));

// 2) 抖音 Top1（顺延）
const douyinValid = douyinItems.filter(i => !isExcluded(i.title));
if (douyinValid.length) fixed.push({ ...douyinValid[0], seat: "抖音Top" + douyinValid[0].rank });

// 3) 微博 Top1（顺延）
const weiboValid = weiboItems.filter(i => !isExcluded(i.title));
if (weiboValid.length) fixed.push({ ...weiboValid[0], seat: "微博Top" + weiboValid[0].rank });

// ---------- 各平台有效榜位/热度百分位 ----------
function pctPos(list) { return list.map(i => ({ item: i, pct: percentileRank(list.map(x => x.rank), i.rank, "desc") })); }
function pctHot(list) {
  const hots = list.map(i => i.hot).filter(v => typeof v === "number" && !isNaN(v) && v > 0);
  return list.map(i => ({ item: i, pct: hots.length ? percentileRank(hots, i.hot, "asc") : 0 }));
}
const posZ = pctPos(zhiweiValid), hotZ = pctHot(zhiweiValid);
const posD = pctPos(douyinValid), hotD = pctHot(douyinValid);
const posW = pctPos(weiboValid), hotW = pctHot(weiboValid);
function getPct(list, item) { const f = list.find(x => x.item.title === item.title); return f ? f.pct : null; }

// ---------- 计算每席热度值 + 分级 ----------
const hotspots = fixed.map(it => {
  let posPct, hotPct, trend, reson;
  if (it.platform === "知微") {
    posPct = getPct(posZ, it); hotPct = getPct(hotZ, it);
    trend = trendScoreZhiwei(it); reson = resonanceScore(it.title, "知微");
  } else if (it.platform === "抖音") {
    posPct = getPct(posD, it); hotPct = getPct(hotD, it);
    trend = trendScoreDouyin(it); reson = resonanceScore(it.title, "抖音");
  } else {
    posPct = getPct(posW, it); hotPct = getPct(hotW, it);
    trend = trendScoreWeibo(); reson = resonanceScore(it.title, "微博");
  }
  const score = (posPct || 0) * 0.35 + (hotPct || 0) * 0.20 + trend.score * 0.25 + reson.score * 0.20;
  const grade = score >= 80 ? "S" : (score >= 65 ? "A" : "B");
  return {
    level: grade,
    seat: it.seat,
    title: it.title,
    topic: it.title,
    eventName: it.title,
    platform: it.platform,
    rank: it.rank,
    hot: it.hot ?? null,
    hotValue: it.hot ?? null,
    url: it.url,
    platforms: [{ platform: it.platform, rank: it.rank, hot: it.hot ?? null }],
    totalScore: Math.round(score * 10) / 10,
    posScore: Math.round((posPct || 0) * 10) / 10,
    hotScore: Math.round((hotPct || 0) * 10) / 10,
    trendScore: trend.score,
    trendEvidence: trend.evidence,
    resonanceScore: reson.score,
    resonanceEvidence: reson.evidence,
    duration: trend.evidence,
    rankChange: trend.evidence,
    excludeCat: isExcluded(it.title),
    collectedAt: latest.generatedAt || new Date().toISOString(),
  };
});

// 保留原始排序（固定席位顺序：知微4 + 抖音 + 微博）
const radarData = {
  generatedAt: latest.generatedAt || new Date().toISOString(),
  date: date,
  note: "固定6席: 知微Top4 + 抖音Top1 + 微博Top1; 热度值仅用于S/A/B分级",
  hotspots: hotspots,
};

// ---------- 写入 radar.json ----------
try {
  fs.writeFileSync(OUT, JSON.stringify(radarData, null, 2));
  console.log(`[analyze] 已写入 radar.json: ${hotspots.length} 席`);
} catch (e) {
  console.error("[❌] 写入 radar.json 失败:", e.message);
  process.exit(1);
}

// ---------- 打印 ----------
console.log("======== 热点雷达 · 固定6席分级 ========  " + date);
hotspots.forEach(h => {
  console.log(`\n【${h.level}】 ${h.platform} ${h.seat} · ${h.title}  总分=${h.totalScore}`);
  console.log(`  榜位分=${h.posScore}/100(35%) 热度分=${h.hotScore}/100(20%) 趋势分=${h.trendScore}(25%) 共振分=${h.resonanceScore}(20%)`);
  console.log(`  趋势: ${h.trendEvidence}`);
  console.log(`  禁区: ${h.exclude ? h.exclude : "无"}`);
});