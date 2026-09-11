// 热点雷达 每日 AI 内容生成器（新规 v2，2026-09-07）
// 职责：读取已由 analyze-hotspots.mjs 计算出的 radar.json（纯客观数据 + S/A/B 分级），
//       并为每个非硬性排除的 S/A/B 热点附加 Agent/API 思考层内容。
//
// 【整改 v2.1】2026-09-07 21:36
//   移除硬编码 analysisByTitle / memeTopics / businessAdvice（旧标题 key 导致匹配失败、
//   内容空字段、引用不存在热点如"郑钦文"）。
//   改为统一读取 ai-analysis.json（Agent 逐条深度思考产物，按 radar.json 真实标题为 key）。
//   本脚本退化为"纯渲染器"，AI 思考内容全部来自 ai-analysis.json，永远与真实标题匹配。
//
// 只更新数据与分析内容，不改变页面布局。
// 郭德纲事件经用户确认保留展示（加风险提醒：仅公共信息服务、不建议娱乐化/商业化）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const radarPath = join(root, '..', 'public', 'data', 'radar.json');
const aiAnalysisPath = join(root, '..', 'public', 'data', 'ai-analysis.json');
const memePath = join(root, '..', 'public', 'data', 'meme-topics.json');
const bizPath = join(root, '..', 'public', 'data', 'business-advice.json');
const outRoot = join(root, '..', 'public', 'data');

const now = new Date();
const ts = now.toISOString();
const today = ts.slice(0, 10);
const collectedAt = ts;

// ---------- 读取真实热点 ----------
let radarData = { hotspots: [] };
try {
  radarData = JSON.parse(readFileSync(radarPath, 'utf8'));
} catch (e) {
  console.error('[gen] radar.json 读取失败', e.message);
}

const hotspots = (radarData.hotspots || []).filter(h => h && h.title);
console.log('[gen] 从 radar.json 读取热点数:', hotspots.length);

// ---------- 读取 AI 逐条思考产物 ----------
let aiAnalysis = { analyses: {} };
try {
  aiAnalysis = JSON.parse(readFileSync(aiAnalysisPath, 'utf8'));
} catch (e) {
  console.error('[gen] ai-analysis.json 读取失败', e.message);
}
const analyses = aiAnalysis.analyses || {};

// 统计匹配情况
const matchedCount = hotspots.filter(h => analyses[h.title]).length;
const unmatched = hotspots.filter(h => !analyses[h.title]).map(h => h.title);
console.log('[gen] AI 分析匹配:', matchedCount + '/' + hotspots.length);
if (unmatched.length) console.warn('[gen] 未匹配到 AI 分析的热点:', unmatched);

// ---------- 注入分析到热点 ----------
const events = hotspots.map(h => {
  const a = analyses[h.title] || {};
  const score = h.totalScore ?? h.score ?? 0;
  // radar 真实热度/平台在 h.platforms[]（platform/rank/hot），顶层通常没有 platform/hotValue
  const p0 = (h.platforms && h.platforms[0]) || {};
  const srcPlat = p0.platform || h.platform || '';
  const srcHot = p0.hot ?? h.hotValue ?? null;
  const srcRank = p0.rank ?? h.rank ?? null;
  return {
    level: h.level || 'B',
    eventName: h.title,
    topic: h.title,
    score: Number(score.toFixed(1)),
    platform: srcPlat,
    platformDetail: {
      platform: srcPlat,
      currentRank: srcRank,
      peakRank: srcRank,
      hotValue: srcHot != null ? (typeof srcHot === 'number' ? (srcHot >= 10000 ? (srcHot / 10000).toFixed(1) + 'w' : String(srcHot)) : String(srcHot)) : (srcRank != null ? '抖音热榜 top' + srcRank : ''),
      collectedAt,
      duration: h.duration || '上午、下午均在榜（可核验）',
      rankChange: h.rankChange || '持续在榜',
      link: h.url || '',
    },
    explanation: a.explanation || '',
    whyHot: a.whyHot || '',
    risk: a.risk || '',
    // ---- dashboard 渲染对齐字段（供 data-bindings.js 消费）----
    title: h.title,
    eventSummary: a.explanation || '',
    riskNote: a.risk || '',
    totalScore: Number(score.toFixed(1)),
    source: srcPlat || '抖音',
    heat: srcHot != null ? (typeof srcHot === 'number' ? (srcHot >= 10000 ? (srcHot / 10000).toFixed(1) + 'w' : String(srcHot)) : String(srcHot)) : (srcRank != null ? '抖音热榜 top' + srcRank : ''),
    crossPlatform: srcPlat ? [srcPlat] : [],
    platforms: h.platforms || [],
  };
});

// ---------- 固定6席：radar.json 只存6席(知微Top4+抖音Top1+微博Top1)，保留席位顺序不重排 ----------
const TOP6_LIMIT = 6;
const topEvents = events.slice(0, TOP6_LIMIT);
console.log('[gen] 固定6席生效：', events.length, '→', topEvents.length, '（保留固定席位顺序）');

// ---------- 玩梗热点（meme-topics.json）：从 ai-analysis 生成 ----------
// 仅取 analyses 中带 meme 字段的热点；meme 含 template/reason/verifyStatus/risk。
const memeTopics = [];
for (const h of topEvents) {
  const a = analyses[h.eventName] || {};
  if (a.meme && a.meme.template) {
    // radar 热点真实结构：热度在 h.platforms[]（platform/rank/hot），顶层无 platformDetail/hotValue
    const p0 = (h.platforms && h.platforms[0]) || {};
    const srcPlat = p0.platform || h.platform || '抖音';
    const rankText = p0.rank != null ? 'TOP' + p0.rank : '';
    const hotText = p0.hot != null ? (typeof p0.hot === 'number' ? (p0.hot >= 10000 ? (p0.hot / 10000).toFixed(1) + 'w' : String(p0.hot)) : String(p0.hot)) : '';
    memeTopics.push({
      title: h.eventName,
      platform: srcPlat,
      rank: rankText,
      hotValue: hotText,
      template: a.meme.template,
      reason: a.meme.reason || '',
      verifyStatus: a.meme.verifyStatus || '待内容级核验',
      risk: a.meme.risk || '低风险',
      // ---- dashboard 渲染对齐字段 ----
      keyword: a.meme.template,
      source: srcPlat,
      heat: hotText || rankText,
    });
  }
}
console.log('[gen] 玩梗热点:', memeTopics.length, '条');

// ---------- 本地生活业务建议：从 ai-analysis.json 的 business 字段生成 ----------
// 只选择存在真实连接点的热点，无法强关联时明确"暂无适合跟进"。
const businessAdvice = [];
for (const h of topEvents) {
  const a = analyses[h.eventName] || {};
  const bizs = Array.isArray(a.business) ? a.business : [];
  for (const b of bizs) {
    businessAdvice.push({
      business: b.business || '',
      hotspot: h.eventName,
      connection: b.connection || '',
      need: b.need || '',
      supply: b.supply || '',
      action: b.action || '',
      evidence: b.evidence || '',
      risk: b.risk || '',
    });
  }
}
// 对无 business 建议的热点不做占位；businessAdvice 只保留有真实建议的条目
console.log('[gen] 业务建议:', businessAdvice.length, '条');

// ---------- 写文件 ----------
mkdirSync(outRoot, { recursive: true });
const output = {
  updatedAt: ts,
  collectedAt,
  date: today,
  events: topEvents,
  memeTopics,
  businessAdvice,
  meta: {
    dataSource: 'UAPI(微博/抖音/小红书) + 时光热搜 + 知微观察',
    hardExcluded: 0,
    pendingReview: 0,
    note: '郭德纲事件经用户确认保留展示；趋势图已按新规删除；问点点已删除。',
  },
};
writeFileSync(join(outRoot, 'gen-daily-content.json'), JSON.stringify(output, null, 2));

// ---------- reshape 为 dashboard 消费的 schema ----------
// dashboard: __MEME_TOPICS__?.items = [{keyword,template,reason,source,heat}]
const memeForDash = {
  date: today,
  items: memeTopics.map(m => ({
    keyword: m.title,
    template: m.template,
    reason: m.reason,
    source: m.platform,
    heat: m.hotValue || m.rank || '',
    verifyStatus: m.verifyStatus,
    risk: m.risk,
  })),
};

// dashboard: __BUSINESS_ADVICE__?.businesses = { <业务名>: [ {hotspot,connection,action,evidence,risk}, ... ] }
// 按业务为核心：下拉框 = 业务列表，选某业务显示该业务可借势的热点清单；无借势点的业务不放入下拉。
const businesses = {};
for (const b of businessAdvice) {
  const bizName = b.business || '未归类';
  if (!businesses[bizName]) businesses[bizName] = [];
  businesses[bizName].push({
    hotspot: b.hotspot,
    connection: b.connection || '',
    action: b.action || (b.risk && b.risk.indexOf('高') !== -1 ? '仅观察不借势' : '暂不发起业务动作'),
    evidence: b.evidence || '',
    risk: b.risk || '',
  });
}
const businessForDash = {
  date: today,
  basis: '以业务为核心：按京东本地生活各业务维度聚合当日可借势热点清单，选择业务即展示该业务对应热点借势建议',
  coreThemes: businessAdvice.map(b => b.hotspot).filter((v, i, a) => a.indexOf(v) === i),
  businesses,
};

writeFileSync(memePath, JSON.stringify(memeForDash, null, 2));
writeFileSync(bizPath, JSON.stringify(businessForDash, null, 2));

// ---------- 同步注入 dashboard.html 内嵌块（保持前端与数据单一来源一致） ----------
try {
  const dashPath = join(outRoot, '../dashboard.html');
  let dash = readFileSync(dashPath, 'utf8');
  const re = /<script id="business-advice-data">window\.__BUSINESS_ADVICE__=\{[\s\S]*?\};<\/script>/;
  const inject = '<script id="business-advice-data">window.__BUSINESS_ADVICE__=' + JSON.stringify(businessForDash, null, 2) + ';</script>';
  if (re.test(dash)) {
    dash = dash.replace(re, inject);
    writeFileSync(dashPath, dash);
    console.log('[gen] ✅ 已注入 businessForDash 到 dashboard.html');
  } else {
    console.log('[gen] ⚠️ dashboard.html 未匹配到内嵌块，跳过注入（请人工检查）');
  }
} catch (e) {
  console.log('[gen] ⚠️ dashboard.html 注入失败：', e.message);
}

console.log('[gen] 完成：事件数', topEvents.length, 'meme', memeTopics.length, '业务建议', businessAdvice.length);
console.log('[gen] 输出：', outRoot);