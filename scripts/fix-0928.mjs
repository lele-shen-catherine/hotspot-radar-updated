// fix-0928.mjs — 修正 2026-09-28 09:16 生成的数据文件（三条规则 + 政治删除 + 业务建议借势修正）
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const genAt = '2026-09-28T09:16:07.333Z';
const date = '2026-09-28';
const time = '0916';

// ============ 1. 定义修正后的核心热点（4个，删政治，纯叙事 + 纯动因） ============
const hotspots = [
  {
    level: 'S', seat: '总榜Top1', title: '日本爱知・名古屋亚运会',
    topic: '日本爱知・名古屋亚运会', eventName: '日本爱知・名古屋亚运会',
    platform: '知微', rank: 1, hot: 20112, hotValue: 20112,
    url: 'https://ef.zhiweidata.com/eventRk/b0b747a8306ce82110180141/profil',
    platforms: [{ platform: '知微', rank: 1, hot: 20112 }],
    totalScore: 91.0, posScore: 90, hotScore: 97, trendScore: 92,
    trendEvidence: '知微全网Top1, 在榜11小时, 热度高',
    resonanceScore: 60, resonanceEvidence: '亚运赛事贯穿抖音/微博多榜',
    duration: '知微全网Top1, 在榜11小时', rankChange: '持续高位',
    excludeCat: null, collectedAt: genAt,
    eventSummary: '第十九届亚运会在日本爱知・名古屋举行，中国代表团在多项目夺金，赛事全程成为全网关注焦点。',
    propagation: '综合性国际大赛自带全民关注度，赛场夺金时刻密集出现，公众在"看比赛-数金牌-为运动员喝彩"中形成集体参与感；赛事进程天然自带强情绪峰值与传播节点，各平台实时战报持续推高热度。',
    riskNote: '风险等级：低。可自然关联观赛聚餐、即时零售等本地生活场景，不夸大功效、不使用未经授权的赛事素材。'
  },
  {
    level: 'A', seat: '总榜Top2', title: '严子怡破纪录夺金',
    topic: '严子怡破纪录夺金', eventName: '严子怡破纪录夺金',
    platform: '抖音', rank: 2, hot: 12068000, hotValue: 12068000,
    url: 'https://www.douyin.com/search/%E4%B8%A5%E5%AD%90%E6%80%A1%E7%A0%B4%E7%BA%AA%E5%BD%95%E5%A4%BA%E9%87%91',
    platforms: [{ platform: '抖音', rank: 1, hot: 12068000 }],
    totalScore: 84.4, posScore: 92, hotScore: 99, trendScore: 85,
    trendEvidence: "抖音标记'爆'",
    resonanceScore: 50, resonanceEvidence: '竞技夺金话题易跨平台扩散',
    duration: "抖音标记'爆'", rankChange: "抖音标记'爆'",
    excludeCat: null, collectedAt: genAt,
    eventSummary: '亚运会赛场上，运动员严子怡在所在项目中打破纪录并夺得金牌，成绩亮眼，成为当日竞技高光时刻。',
    propagation: '"破纪录+首金"自带稀缺性与荣誉感，公众在为运动员加油、见证与欢呼中完成集体庆祝，观赛情绪和分享欲同步高涨，短时间形成强热点峰值。',
    riskNote: '风险等级：低。可自然关联观赛庆祝、即时零售等场景，注意不夸大功效、不做虚假承诺。'
  },
  {
    level: 'A', seat: '总榜Top3', title: '国乒男双战胜日本夺冠',
    topic: '国乒男双战胜日本夺冠', eventName: '国乒男双战胜日本夺冠',
    platform: '抖音', rank: 3, hot: 11525083, hotValue: 11525083,
    url: 'https://www.douyin.com/search/%E5%9B%BD%E4%B9%92%E7%94%B7%E5%8F%8C%E6%88%98%E8%83%9C%E6%97%A5%E6%9C%AC%E5%A4%BA%E5%86%A0',
    platforms: [{ platform: '抖音', rank: 2, hot: 11525083 }],
    totalScore: 82.0, posScore: 90, hotScore: 98, trendScore: 85,
    trendEvidence: '抖音Top2, 热度高',
    resonanceScore: 50, resonanceEvidence: '国球荣誉感强, 易跨平台扩散',
    duration: '抖音Top2, 热度高', rankChange: '高位',
    excludeCat: null, collectedAt: genAt,
    eventSummary: '亚运会乒乓球男双决赛中，国乒组合战胜日本组合夺得冠军，为国争光的荣誉时刻引发全网喝彩。',
    propagation: '"国球+战胜日本+夺冠"叠加民族荣誉感与强情绪价值，公众在"赢球-骄傲-庆祝"中形成集体共鸣，话题自带传播爆发力与二创素材。',
    riskNote: '风险等级：低。可自然关联观赛庆祝、外卖下单等场景，不使用未经授权的赛事权益素材。'
  },
  {
    level: 'A', seat: '总榜Top4', title: '张家齐综艺节目表现引争议',
    topic: '张家齐综艺节目表现引争议', eventName: '张家齐综艺节目表现引争议',
    platform: '知微', rank: 4, hot: 2723, hotValue: 2723,
    url: 'https://ef.zhiweidata.com/eventRk/39170a54dcac26ab10180186/profil',
    platforms: [{ platform: '知微', rank: 2, hot: 2723 }],
    totalScore: 75.3, posScore: 70, hotScore: 85, trendScore: 85,
    trendEvidence: '知微Top2, 在榜11小时',
    resonanceScore: 50, resonanceEvidence: '娱乐争议话题易引发讨论',
    duration: '知微Top2, 在榜11小时', rankChange: '高位',
    excludeCat: null, collectedAt: genAt,
    eventSummary: '跳水运动员张家齐在一档综艺节目中的表现引发网友讨论与争议，话题持续发酵。',
    propagation: '运动员与综艺表现的"跨界反差"自带话题性，公众对"赛场形象 vs 综艺表现"的观感差异引发共情与质疑两极，讨论参与度高，带动话题持续被关注。',
    riskNote: '风险等级：高。涉及个体表现争议，仅做公共信息服务与理性引导，不披露隐私、不站队审判、不煽动对立。'
  }
];

// ============ 2. 业务建议（action先写借哪个热点 + comms单热点，不硬凑） ============
// 今日核心可借势：亚运会/观赛聚餐(外卖/秒送/小厨/MALL/咖啡)、破纪录首金(外卖/秒送)
// 无可结合业务 → 常规运营，绝不硬凑
const businessAdvice = [
  {
    business: '京东外卖',
    action: '借「亚运会观赛聚餐」热点：围绕赛事日用户"边看比赛边点餐"的真实场景，主推可履约的观赛套餐、宵夜小吃与赛事夜宵档，突出商家、菜品、价格与送达时效。',
    comms: '用"看比赛，好吃不缺席""赢球了犒劳一顿"连接真实餐饮场景，优惠、库存与配送承诺必须可兑现，不擅自使用赛事标识或公众人物形象。'
  },
  {
    business: '京东秒送（即时零售）',
    action: '借「国乒男双战胜日本夺冠」热点：承接"庆祝胜利"场景的零食饮料、观赛补给与即时送达需求，突出"即买即送"的极速履约动线，主推可兑现的即时优惠。',
    comms: '围绕胜利庆祝场景用"欢呼不等待，即刻送达"展示真实到家组合；不夸大送达时效、不做虚假承诺。'
  },
  {
    business: '京东家政',
    action: '今日无与家政服务直接相关的可借势热点，做常规运营：聚焦换季/国庆节点的家庭清洁与收纳整理需求，明确服务范围、时长与价格。',
    comms: '以"干干净净迎接长假"为主题展示标准流程、人员资质与价格边界；不强行关联赛事或公共话题。'
  },
  {
    business: '七鲜小厨',
    action: '借「亚运会观赛聚餐」热点：围绕赛事日到店/外卖的观赛餐场景，主推双人餐、家庭餐与限时加菜，明确门店、菜品、价格与可用时段。',
    comms: '用"今天值得好好吃一顿""边看比赛边吃鲜"记录真实出餐与分享内容；不使用受保护的赛事素材，重点呈现菜品分量、口味与可用时段。'
  },
  {
    business: '七鲜咖啡',
    action: '借「国乒男双战胜日本夺冠」热点：围绕观赛熬夜/胜利庆祝的提神咖啡轻量场景，用真实门店优惠或新品试饮承接；无可兑现活动时保持常规运营。',
    comms: '围绕胜利庆祝场景，传播只说真实门店活动、产品风味与可用时段，用日常小事表达轻量仪式感；不强行关联赛事权益。'
  },
  {
    business: '京东旅行',
    action: '借「日本爱知・名古屋亚运会」热点：聚焦赛事观赛出行与国庆假期的短途/换季出行需求，主推真实余位与退改条件清晰的观赛/度假线路。',
    comms: '围绕赛事观赛出行与假期出行场景，传播重点是"安心安排行程"和权威信息入口，交通/签证结论链接官方来源；不制造"最后机会"焦虑。'
  },
  {
    business: '七鲜美食MALL',
    action: '借「亚运会观赛聚餐」热点：围绕赛事日家庭聚餐/到店聚会场景，组织可执行的观赛聚餐/打卡路线，明确参与商户、楼层、营业时段与现场可兑现信息。',
    comms: '围绕观赛聚餐场景，用"来 MALL 边看边吃"呈现真实餐饮路线与用户聚会体验；不使用未授权赛事素材，所有活动时间、商户和权益以现场可兑现为准。'
  },
  {
    business: '京东本地生活（整体）',
    action: '借「亚运会观赛聚餐」热点：整合赛事日餐饮、即时零售与出行服务，突出京东本地生活一站式服务能力，围绕亚运会观赛场景做正向内容。',
    comms: '围绕观赛聚餐与假期生活主线，以正向价值内容为主，不硬蹭、不消费负面；公共事件只做服务提醒与权威信息引导。'
  }
];

// ============ 3. 写 radar.json ============
const radar = {
  generatedAt: genAt, date, note: '固定4席(知微Top1+抖音Top2+知微娱乐): 删政治热点; 纯叙事解释+纯动因why; 业务建议先写借哪个热点+单热点',
  hotspots
};
fs.writeFileSync(path.join(ROOT, 'public/data/radar.json'), JSON.stringify(radar, null, 2) + '\n');
console.log('radar.json 已修正');

// ============ 4. 写 ai-analysis.json ============
const analyses = {};
for (const h of hotspots) {
  analyses[h.title] = {
    explanation: h.eventSummary,
    whyHot: h.propagation,
    risk: h.riskNote,
    business: businessAdvice.map(b => ({ business: b.business, suggestion: b.action }))
  };
}
const ai = {
  updatedAt: genAt, generatedBy: 'fix-0928.mjs (人工修正)', date,
  note: '删政治热点; 叙事解释+纯动因; 业务建议借势修正',
  analyses,
  businessAdvice
};
fs.writeFileSync(path.join(ROOT, 'public/data/ai-analysis.json'), JSON.stringify(ai, null, 2) + '\n');
console.log('ai-analysis.json 已修正');

// ============ 5. 写 gen-daily-content.json ============
const events = hotspots.map(h => ({
  level: h.level, eventName: h.title, topic: h.title, score: h.totalScore,
  platform: h.platform,
  platformDetail: {
    platform: h.platform, currentRank: h.rank, peakRank: h.rank,
    hotValue: h.hot >= 1000000 ? (h.hot / 10000).toFixed(1) + 'w' : (h.hot / 10000).toFixed(1) + 'w',
    collectedAt: genAt, duration: h.duration, rankChange: h.rankChange,
    link: h.url
  },
  explanation: h.eventSummary, whyHot: h.propagation, risk: h.riskNote,
  title: h.title, eventSummary: h.eventSummary, riskNote: h.riskNote,
  totalScore: h.totalScore, source: h.platform,
  heat: h.hot >= 1000000 ? (h.hot / 10000).toFixed(1) + 'w' : String(h.hot),
  crossPlatform: h.platforms.map(p => p.platform), platforms: h.platforms
}));
const gdc = {
  updatedAt: genAt, collectedAt: genAt, date, events, businessAdvice,
  meta: { coreCount: hotspots.length, removedForbidden: ['习近平将对美国进行国事访问', '中美经贸磋商', '商务部解读中美经贸'] }
};
fs.writeFileSync(path.join(ROOT, 'public/data/gen-daily-content.json'), JSON.stringify(gdc, null, 2) + '\n');
console.log('gen-daily-content.json 已修正');

// ============ 6. 写 candidates.json ============
const candidates = hotspots.map(h => ({
  title: h.title, topic: h.title, eventName: h.title, level: h.level,
  totalScore: h.totalScore, platform: h.platform, hot: h.hot,
  url: h.url, eventSummary: h.eventSummary, propagation: h.propagation,
  riskNote: h.riskNote, platforms: h.platforms
}));
fs.writeFileSync(path.join(ROOT, 'data/processed/candidates.json'), JSON.stringify(candidates, null, 2) + '\n');
console.log('candidates.json 已修正');

// ============ 7. 写 latest.json（同步核心平台 items 的 title 级去政治） ============
// 保留 raw 全量，但过滤掉政治事件条目
const latestRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/latest.json'), 'utf8'));
const forbidden = ['习近平将对美国进行国事访问', '中美经贸磋商', '商务部解读第八轮中美经贸磋商成果', '商务部解读中美经贸'];
for (const key of Object.keys(latestRaw.platforms)) {
  const p = latestRaw.platforms[key];
  if (p && Array.isArray(p.items)) {
    p.items = p.items.filter(it => {
      const t = (it.title || it.name || '').trim();
      return !forbidden.some(f => t.includes(f));
    });
    p.count = p.items.length;
  }
}
latestRaw.date = date;
fs.writeFileSync(path.join(ROOT, 'public/data/latest.json'), JSON.stringify(latestRaw, null, 2) + '\n');
console.log('latest.json 已修正(过滤政治)');

// ============ 8. 写 business-advice.json ============
const baFile = {
  date, basis: '核心可借势: 亚运会观赛聚餐(外卖/小厨/MALL) + 国乒夺冠/破纪录首金(外卖/秒送/咖啡) + 亚运观赛出行(旅行); 无可结合业务写常规运营',
  coreThemes: hotspots.map(h => h.title),
  businesses: businessAdvice
};
fs.writeFileSync(path.join(ROOT, 'public/data/business-advice.json'), JSON.stringify(baFile, null, 2) + '\n');
console.log('business-advice.json 已修正');

console.log('\n=== 全部数据文件修正完成 ===');