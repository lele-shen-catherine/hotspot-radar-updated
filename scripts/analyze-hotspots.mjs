#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = JSON.parse(await readFile(join(ROOT, "data/processed/candidates.json"), "utf8"));

const HIGH_RISK = /死亡|遇难|伤亡|坠亡|自杀|杀人|强奸|猥亵|诈骗|被捕|刑拘|被查|违法|事故|爆炸|火灾|地震|洪水|灾情|塌方|泥石流|救援|失联|溺水|战争|冲突|丑闻|翻车|道歉|召回|维权|病危|疫情/;
const PUBLIC_SERVICE = /台风|暴雨|高温|降温|寒潮|大风|天气|预警/;
const FOOD = /美食|餐|吃|喝|咖啡|奶茶|水果|蔬菜|生鲜|外卖|面包|甜品/;
const TRAVEL = /旅行|旅游|景区|酒店|出行|假期|周末|攻略/;
const LIFESTYLE = /穿搭|挑战|教程|测评|生活|家庭|宠物|运动|庆祝|开学|毕业|节日/;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 10) / 10;

function assess(candidate) {
  const title = candidate.title || "";
  const highRisk = HIGH_RISK.test(title);
  const publicService = PUBLIC_SERVICE.test(title);
  const businessRelevant = candidate.businessKeywordMatch || FOOD.test(title) || TRAVEL.test(title) || LIFESTYLE.test(title);
  const relevanceScore = highRisk ? 10 : businessRelevant ? 82 : candidate.crossPlatform ? 58 : 38;
  const timelinessScore = clamp(92 - Math.min(...candidate.platforms.map((item) => item.rank || 30)) * 1.2);
  const creativityScore = highRisk ? 5 : FOOD.test(title) || LIFESTYLE.test(title) ? 82 : TRAVEL.test(title) ? 72 : publicService ? 45 : 42;
  const totalScore = round(candidate.ruleScore * 0.5 + relevanceScore * 0.25 + timelinessScore * 0.15 + creativityScore * 0.1);
  const worthLeveraging = !highRisk && businessRelevant && totalScore >= 55;
  const level = highRisk ? "reject" : worthLeveraging ? (totalScore >= 85 ? "S" : totalScore >= 70 ? "A" : "B") : "observe";
  const riskLevel = highRisk ? "high" : publicService ? "medium" : "low";

  let businessAction = "暂不发布，继续观察榜单持续时间与跨平台扩散情况。";
  let communicationIdea = "保留为趋势观察，不直接追热点。";
  if (worthLeveraging && publicService) {
    businessAction = "仅发布权威天气信息、履约调整和民生保障提醒，不做娱乐化营销。";
    communicationIdea = "用服务通知形式说明配送时效、安全提示与客服入口。";
  } else if (worthLeveraging && FOOD.test(title)) {
    businessAction = "结合相关餐饮或到家商品制作当日主题推荐，并设置短时活动入口。";
    communicationIdea = `围绕“${title}”给出可直接尝试的菜单、做法或购买清单。`;
  } else if (worthLeveraging && TRAVEL.test(title)) {
    businessAction = "整理目的地、出行或周末消费清单，并明确价格与适用条件。";
    communicationIdea = `围绕“${title}”制作实用攻略，避免夸大承诺。`;
  } else if (worthLeveraging) {
    businessAction = "制作轻量互动内容或主题商品集合，先小范围发布并观察反馈。";
    communicationIdea = `用“${title}”作为内容切入点，提供具体参与方式。`;
  }

  return {
    ...candidate, worthLeveraging, riskLevel, relevanceScore,
    timelinessScore: round(timelinessScore), creativityScore, totalScore, level,
    reason: highRisk ? "命中高风险事件规则，不建议商业借势。" : worthLeveraging ? "热度、业务相关性和可执行性达到入选阈值。" : "当前业务相关性或可执行性不足，建议观察。",
    eventSummary: title, businessAction, communicationIdea,
    riskNote: highRisk ? "禁止商业借势，必要时仅转发权威公共信息。" : publicService ? "只允许权威信息、履约提醒和民生保障，不渲染灾情。" : "发布前复核事实、版权和品牌语境。"
  };
}

const decisions = input.candidates.map(assess).sort((a, b) => b.totalScore - a.totalScore);
const radar = {
  schemaVersion: 1, generatedAt: new Date().toISOString(), date: input.date,
  sourceGeneratedAt: input.sourceGeneratedAt, provider: "local-rules", model: "auditable-score-v1",
  summary: {
    analyzed: decisions.length,
    selected: decisions.filter((item) => item.worthLeveraging).length,
    rejected: decisions.filter((item) => !item.worthLeveraging).length
  },
  hotspots: decisions.filter((item) => item.worthLeveraging),
  watchlist: decisions.filter((item) => !item.worthLeveraging)
};

const targets = [join(ROOT, "public/data/radar.json"), join(ROOT, `public/data/history/${input.date}-radar.json`)];
for (const target of targets) {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(radar, null, 2) + "\n", "utf8");
}
console.log(`本地评分完成：${radar.summary.selected} 个可借势热点，${radar.summary.rejected} 个排除/观察`);
