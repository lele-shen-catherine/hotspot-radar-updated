#!/usr/bin/env node
/**
 * 热点雷达 · 固定6席分析（仅计算展示，不写入/不部署）
 * 规则（用户自定义）:
 *  - 固定6席: 知微事见Top4 + 抖音1条 + 微博1条（同平台内顺延补足，先删四类禁区）
 *  - 热度值 = 榜位35% + 平台热度20% + 趋势/持续性25% + 跨平台共振20%
 *  - 榜位/平台热度: 同平台同批次内转 0-100 百分位
 *  - 趋势: 上升100/高位85/平稳70/刚上榜或未知60/下降40; 缺时长记60
 *  - 共振: 三源100/两源80/单源但有外部讨论证据60/仅单平台45; 语义合并
 *  - 分级: S≥80, A=65~79.9, B<65
 */
import fs from "fs";
import path from "path";

const RAW_DIR = path.resolve("data/raw/2026-09-09");
const date = "2026-09-09";
const batch = "1420";

// ---------- 四类禁区（含语义复核关键词） ----------
const EXCLUDE = {
  gender_antagonism: ["男女对立","性别对立","性别攻击","性别歧视","婚恋污名","彩礼","生育对立","性别仇恨","网暴某一性别"],
  populism: ["阶层仇恨","地域歧视","敌我叙事","职业对立","集体抵制","围攻","群体攻击","极端民族主义"],
  animal_protection: ["虐狗","虐猫","偷狗","毒狗","捕杀流浪动物","爱狗人士冲突","爱猫人士冲突","宠物伤人争议","动物救助道德审判","宠物极端对立"],
  political_sensitive: ["中美关系","外交冲突","台湾","香港","新疆","西藏","领导人","政要","战争","军事冲突","军事演习","国家安全","选举","领土主权","外交制裁","政治传闻"],
};
function isExcluded(title) {
  for (const [cat, kws] of Object.entries(EXCLUDE)) {
    for (const kw of kws) {
      if (title.includes(kw)) return cat;
    }
  }
  return null;
}

// ---------- 读取原始数据 ----------
const wj = JSON.parse(fs.readFileSync(path.join(RAW_DIR, `webwide-${batch}.json`), "utf8"));
const dj = JSON.parse(fs.readFileSync(path.join(RAW_DIR, `douyin-${batch}.json`), "utf8"));
const wb = JSON.parse(fs.readFileSync(path.join(RAW_DIR, `weibo-${batch}.json`), "utf8"));

// 知微 rankHour（12个批次）→ 最新批次 top list + 历史排名 map
const rank = wj?.data?.rankHour || [];
const latest = rank.at(-1);
const zhiweiItems = (latest.info || []).filter(i => i.eventId && i.eventId !== "otherEventId");
// 历史: eventId -> { 各批排名, 首次出现批次idx, 出现次数 }
const hist = {};
rank.forEach((r, ri) => {
  (r.info || []).forEach((it, i) => {
    if (!it.eventId || it.eventId === "other_hidden") return;
    if (!hist[it.eventId]) hist[it.eventId] = { firstBatch: ri, batches: [], ranks: [] };
    hist[it.eventId].batches.push(ri);
    hist[it.eventId].ranks.push(i + 1);
  });
});

// 抖音
const douyinItems = (dj.word_list || []).map((it, i) => ({ title: it.word, hot: it.hot_value, label: it.label, rank: i + 1 }));
// 微博 realtime
const weiboItems = (wb?.data?.realtime || []).map((it, i) => ({ title: it.word || it.note, hot: it.num, label: it.label, rank: i + 1 }));

// ---------- 百分位工具 ----------
function percentileRank(arr, value, dir) {
  // dir: 'asc' 越大越好 / 'desc' 越小越好(排名)
  if (!arr.length) return 0;
  if (dir === "desc") {
    // value 是排名，越小越好: 百分位= 低于当前排名的占比
    let below = arr.filter(x => x > value).length;
    return (below / arr.length) * 100;
  } else {
    // value 越大越好: 百分位 = 小于等于当前值占比
    const eq = arr.filter(x => x === value).length;
    const lt = arr.filter(x => x < value).length;
    return (lt + eq / 2) / arr.length * 100;
  }
}

// ---------- 趋势/持续性判断 ----------
function trendScoreZhiwei(item) {
  const h = hist[item.eventId];
  const latestIdx = rank.length - 1;
  if (!h || !h.batches.length) return { score: 60, evidence: "缺少在榜时长(按未知60)" };
  const appearsNow = h.batches.includes(latestIdx);
  if (!appearsNow) return { score: 60, evidence: "当前不在最新批次" };
  const appearCount = h.batches.length;
  const firstBatch = Math.min(...h.batches);
  const span = latestIdx - firstBatch; // 在榜时长(小时)
  const lastRank = h.ranks[h.ranks.length - 1];
  const prevRank = h.ranks.length > 1 ? h.ranks[h.ranks.length - 2] : null;
  if (span === 0 && appearCount === 1) return { score: 60, evidence: `刚上榜(在榜${span}时)` };
  if (prevRank !== null && prevRank > lastRank && (prevRank - lastRank) >= 1) {
    // 排名提升 -> 上升
    return { score: 100, evidence: `排名上升 ${prevRank}→${lastRank}, 在榜${span}小时` };
  }
  if (lastRank <= 4 && span >= 5) return { score: 85, evidence: `持续高位(第${lastRank}名, 在榜${span}小时)` };
  return { score: 70, evidence: `平稳(第${lastRank}名, 在榜${span}小时)` };
}

function trendScoreDouyin(item) {
  // label: 1=新, 2=热, 3=爆
  if (item.label === 1) return { score: 60, evidence: "抖音标记'新'(刚上榜)" };
  if (item.label === 3) return { score: 85, evidence: "抖音标记'爆'" };
  if (item.label === 2) return { score: 70, evidence: "抖音标记'热'" };
  return { score: 60, evidence: "抖音无在榜时长(按未知60)" };
}
function trendScoreWeibo() { return { score: 60, evidence: "微博单次快照无在榜时长(按未知60)" }; }

// ---------- 跨平台共振（语义合并，排除自身平台） ----------
function resonanceScore(title, ownPlatform) {
  const norm = t => t.replace(/[：:，,。.!！?？\s"'"（）()]/g, "");
  const core = norm(title);
  const kw = core.slice(0, 8);
  const otherSources = [];
  if (ownPlatform !== "抖音") otherSources.push(...douyinItems.map(i => i.title));
  if (ownPlatform !== "微博") otherSources.push(...weiboItems.map(i => i.title));
  const matched = otherSources.filter(t => {
    const n = norm(t);
    return n.includes(kw) || kw.includes(n.slice(0, 8)) || core.includes(n.slice(0, 6));
  });
  if (matched.length >= 1) return { score: 80, evidence: `两源共振(其他平台: ${matched.slice(0,2).join("、")})` };
  return { score: 45, evidence: "仅单平台, 未确认外部讨论证据" };
}

// ---------- 构建固定6席 ----------
const fixed = [];
// 1) 知微 Top4（删禁区后顺延）
let zhiweiPool = zhiweiItems.map((it, idx) => ({
  platform: "知微", title: it.name, hot: it.hE, rank: idx + 1,
  eventId: it.eventId, url: `https://ef.zhiweidata.com/eventRk/${it.eventId}/profil`,
}));
const zhiweiValid = zhiweiPool.filter(i => !isExcluded(i.title));
zhiweiValid.slice(0, 4).forEach(i => fixed.push({ ...i, seat: "知微Top" + i.rank }));

// 2) 抖音 Top1（删禁区后顺延）
const douyinValid = douyinItems.filter(i => !isExcluded(i.title));
if (douyinValid.length) fixed.push({ platform: "抖音", ...douyinValid[0], seat: "抖音Top" + douyinValid[0].rank });

// 3) 微博 Top1（删禁区后顺延）
const weiboValid = weiboItems.filter(i => !isExcluded(i.title));
if (weiboValid.length) fixed.push({ platform: "微博", ...weiboValid[0], seat: "微博Top" + weiboValid[0].rank });

// ---------- 计算每席热度值 ----------
function percentiles(items, hotField) {
  const hots = items.map(i => i[hotField]).filter(v => typeof v === "number" && !isNaN(v) && v > 0);
  return items.map(i => ({ item: i, pct: hots.length ? percentileRank(hots, i[hotField], "asc") : 0 }));
}
// 榜位百分位: 各平台内
const posZ = zhiweiValid.map((i, idx) => ({ item: i, pct: percentileRank(zhiweiValid.map(x=>x.rank), i.rank, "desc") }));
const posD = douyinValid.map((i, idx) => ({ item: i, pct: percentileRank(douyinValid.map(x=>x.rank), i.rank, "desc") }));
const posW = weiboValid.map((i, idx) => ({ item: i, pct: percentileRank(weiboValid.map(x=>x.rank), i.rank, "desc") }));
const hotZhiwei = percentiles(zhiweiValid, "hot");
const hotDouyin = percentiles(douyinValid, "hot");
const hotWeibo = percentiles(weiboValid, "hot");

function getPct(list, item) { const f = list.find(x => x.item.title === item.title); return f ? f.pct : null; }

console.log("======== 热点雷达 · 固定6席分析 ========  日期 " + date + " " + batch);
console.log("（仅展示计算，未写入 dashboard、未部署）\n");

let totalRows = [];
fixed.forEach(it => {
  let posPct, hotPct, trend, reson;
  if (it.platform === "知微") {
    posPct = getPct(posZ, it);
    hotPct = getPct(hotZhiwei, it);
    trend = trendScoreZhiwei(it);
    reson = resonanceScore(it.title, "知微");
  } else if (it.platform === "抖音") {
    posPct = getPct(posD, it);
    hotPct = getPct(hotDouyin, it);
    trend = trendScoreDouyin(it);
    reson = resonanceScore(it.title, "抖音");
  } else {
    posPct = getPct(posW, it);
    hotPct = getPct(hotWeibo, it);
    trend = trendScoreWeibo();
    reson = resonanceScore(it.title, "微博");
  }
  const score = (posPct||0)*0.35 + (hotPct||0)*0.20 + trend.score*0.25 + reson.score*0.20;
  const grade = score >= 80 ? "S" : (score >= 65 ? "A" : "B");
  totalRows.push({ ...it, posPct, hotPct, trend, reson, score: Math.round(score*10)/10, grade });
  console.log(`\n【${grade}】 ${it.platform} ${it.seat} · ${it.title}  总分=${score.toFixed(1)}`);
  console.log(`  热度=${it.hot ?? "无"} 源=${it.url}`);
  console.log(`  榜位分=${(posPct||0).toFixed(1)}/100(35%) 平台热度分=${(hotPct||0).toFixed(1)}/100(20%)`);
  console.log(`  趋势分=${trend.score}(25%) ${trend.evidence}`);
  console.log(`  共振分=${reson.score}(20%) ${reson.evidence}`);
  console.log(`  禁区检测: ${isExcluded(it.title) ? isExcluded(it.title) : "无"}`);
});