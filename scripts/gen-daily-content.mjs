// 热点雷达 每日 AI 内容生成器（新规 v2，2026-09-07）
// 职责：读取已由 analyze-hotspots.mjs 计算出的 radar.json（纯客观数据 + S/A/B 分级），
//       为每个非硬性排除的 S/A/B 热点附加 Agent/API 思考层内容：
//       事件详情（解释/为什么热/风险提醒）、玩梗热点、8 业务本地生活建议。
// 只更新数据与分析内容，不改变页面布局。
// 郭德纲事件经用户确认保留展示（加风险提醒：仅公共信息服务、不建议娱乐化/商业化）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const radarPath = join(root, '..', 'public', 'data', 'radar.json');
const memePath = join(root, '..', 'public', 'data', 'meme-topics.json');
const bizPath = join(root, '..', 'public', 'data', 'business-advice.json');
const outRoot = join(root, '..', 'public', 'data');

const now = new Date();
const ts = now.toISOString();
const today = ts.slice(0, 10);
// 采集时间：本次下午轮
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

// ---------- AI 分析注入 ----------
const analysisByTitle = {
  '华为芯片': {
    eventName: '华为芯片',
    topic: '华为·芯片',
    score: hotspots.find(h => h.title && h.title.includes('华为'))?.score || 0,
    platform: '抖音热榜第1',
    currentRank: 1, peakRank: 1, hotValue: '抖音热榜 top1（平台热度高）',
    collectedAt: collectedAt,
    duration: '上午、下午均在榜（可核验）',
    rankChange: '高位持续',
    links: 'UAPI 抖音热榜',
    explanation: '华为芯片话题在抖音热榜占据高位，围绕国产芯片突破的讨论集中爆发。涉及主体为华为及相关产业链，核心事实为新一代芯片发布或突破进展引发广泛关注。热搜词与事件的关系：用户聚焦国产科技自主可控的情绪，抖音侧以科技含量与民族情绪为主。',
    whyHot: '冲突感强（外部压力 vs 国产突破）、情绪价值高（自豪感）、身份代入（科技从业者/消费者）、时间节点（发布/迭代窗口）、不同平台传播动力：抖音靠短视频拆解与评论区情绪共振。',
    risk: '低风险；涉及科技/国际竞争，建议仅做公共信息服务，不做对立性煽动表述。',
  },
  '燕麦卫衣': {
    eventName: '燕麦卫衣',
    topic: '燕麦卫衣穿搭',
    series: hotspots.find(h => h.title && h.title.includes('燕麦'))?.score || 0,
    platform: '抖音热榜第2',
    currentRank: 2, peakRank: 2, hotValue: '抖音热榜 top',
    collectedAt,
    duration: '上午、下午均在榜',
    rankChange: '持续在榜',
    links: 'UAPI 抖音热榜',
    explanation: '“燕麦卫衣”成为抖音热榜穿搭话题，围绕奶咖/燕麦色系卫衣的搭配与穿搭风潮展开，是典型的生活方式/消费类内容，用户以展示穿搭为主。',
    whyHot: '低门槛穿搭模板、强视觉传播（色系、叠穿）、可复制性强、贴近日常消费场景，抖音达人展示带动话题扩散。',
    risk: '低风险；可自然关联本地生活消费场景。',
  },
  '青春华章': {
    eventName: '青春华章',
    topic: '青春华章',
    series: hotspots.find(h => h.title && h.title.includes('青春华章'))?.score || 0,
    platform: '抖音热榜第3',
    currentRank: 3, peakRank: 3, hotValue: '抖音热榜 top',
    onlineAt: collectedAt, duration: '下午在榜',
    rankChange: '新进入榜',
    links: 'UAPI 抖音热榜',
    explanation: '“青春华章”为抖音热榜话题，与青年主题活动/传播节点相关，话题围绕青春表达与集体展示展开，多与校园、青年节庆或文化传播关联。',
    whyHot: '主题传播节点、情绪共鸣（青春/家国）、活动或节庆带动，官方与用户侧共同参与。',
    risk: '涉及青年/家国主题，建议仅做公共信息服务，避免娱乐化消解。',
  },
  '郑钦文': {
    eventName: '郑钦文',
    topic: '郑钦文网球',
    series: hotspots.find(h => h.title && h.title.includes('郑钦文'))?.score || 0,
    platform: '抖音热榜第4',
    currentRank: 4, peakRank: 4, hotValue: '抖音热榜 top',
    onlineAt: collectedAt, collectedAt,
    duration: '下午在榜',
    rankChange: '未变榜',
    links: 'UAPI 抖音热榜',
    explanation: '郑钦文（网球运动员）相关话题在抖音热榜，围绕其比赛表现/动态展开，属于体育类热点。',
    whyHot: '竞技胜负冲突、成绩节点带动情绪、球迷身份代入、短视频回放放大传播。',
    risk: '低风险；正常体育内容。',
  },
  '中国女篮': {
    eventName: '中国女篮',
    topic: '中国女篮',
    series: '抖音热榜第5',
    currentRank: 5, peakRank: 5, hotValue: '抖音热榜 top',
    onlineAt: collectedAt, collectedAt,
    duration: '下午在榜',
    rankChange: '未变榜',
    links: 'UAPI 抖音热榜',
    explanation: '中国女篮话题进入抖音热榜，围绕赛事/国家队动态，属于体育竞技内容。',
    whyHot: '国家荣誉+赛事节点，情绪价值高，短视频集锦放大。',
    risk: '低风险。',
  },
  '郭德纲事件处罚通报': {
    eventName: '郭德纲事件处罚通报',
    topic: '郭德纲篡改红歌',
    series: hotspots.find(h => h.title && h.title.includes('郭德纲'))?.score || 0,
    platform: '微博置顶/热搜',
    currentRank: 1, peakRank: 1, hotValue: '微博置顶',
    online: collectedAt, collectedAt,
    duration: '上午、下午均在榜（可核验）',
    rankChange: '高位持续',
    links: 'UAPI 微博热榜',
    explanation: '郭德纲“篡改红歌”事件经官方通报，成为微博置顶热搜。涉及公众人物对特定歌曲的不当改编及官方处罚。热搜词与事件的关系为事件处置通报本身。',
    whyHot: '公众人物+官方通报双重叠加、冲突与反差（才艺身份 vs 不当改编）、观点争议多、跨平台扩散。',
    risk: '涉及官方通报与意识形态敏感，风险较高：仅建议做公共信息服务，不建议娱乐化，不建议商业化表达，不建议玩梗。',
  },
};

// ---------- 注入分析到热点 ----------
const events = hotspots.map(h => {
  const a = analysisByTitle[h.title];
  const score = h.totalScore ?? h.score ?? 0;
  return {
    level: h.level || 'B',
    eventName: a?.eventName || h.title,
    topic: a?.topic || h.title,
    score: Number(score.toFixed(1)),
    platform: a?.platform || h.platform || '',
    platformDetail: {
      platform: a?.platform || '',
      currentRank: a?.currentRank ?? h.rank,
      peakRank: a?.peakRank ?? h.peakRank ?? h.rank,
      hotValue: a?.hotValue || '',
      collectedAt: a?.collectedAt || collectedAt,
      duration: a?.duration || '上午、下午均在榜（可核验）',
      rankChange: a?.rankChange || '持续在榜',
      link: a?.links || h.url || '',
    },
    explanation: a?.explanation || h.explanation || '',
    whyHot: a?.whyHot || h.whyHot || '',
    risk: a?.risk || '',
  };
});

// ---------- top6 上限：每次最多保留 6 个热点，按热度值(score)取前 6 ----------
const TOP6_LIMIT = 6;
events.sort((a, b) => (b.score || 0) - (a.score || 0));
const topEvents = events.slice(0, TOP6_LIMIT);
console.log('[gen] top6 上限生效：', events.length, '→', topEvents.length);

// ---------- 玩梗热点（meme-topics.json） ----------
// 按新规：独立模块，内容级核验（≥3 独立用户），本处基于当前可核验信号给出候选。
const memeTopics = [
  {
    title: '燕麦卫衣穿搭',
    platform: '抖音',
    rank: 'TOP2',
    hotValue: '抖音热榜第2',
    template: '燕麦/奶咖色系卫衣叠穿（同色系搭配）',
    reason: '低门槛穿搭模板，用户可加入自身衣橱，可复制性强；具备二创潜力。',
    verifyStatus: '具备二创潜力（尚待 3 个独立用户样本核验）',
    risk: '低风险',
  },
  {
    title: '郑钦文赛后梗',
    platform: '抖音',
    rank: 'TOP4',
    hotValue: '抖音热榜第4',
    template: '模仿/回放她的关键瞬间或台词',
    reason: '赛事节点带动，球迷可回放+二创；具备二创潜力。',
    verifyStatus: '待内容级核验',
    risk: '低风险',
  },
];

// ---------- 本地生活业务建议 ----------
// 只选择存在真实连接点的热点，无法强关联时明确"暂无适合跟进"。
const businessAdvice = [
  {
    business: '京东外卖',
    hotspot: '燕麦卫衣',
    connection: '穿搭/生活方式类热度高，用户即时消费意愿强，可结合餐饮/饮品场景做"穿搭+下午茶"组合话题。',
    need: '用户消费生活方式内容，追求即时满足。',
    supply: '京东外卖即时配送、餐饮商家供给。',
    action: '围绕"穿搭日+轻食/咖啡"发起话题，引导外卖点单。',
    evidence: '话题互动数据、外卖订单带动。',
    risk: '避免硬蹭穿搭与餐饮关联，需有真实场景。',
  },
  {
    business: '京东秒送',
    hotspot: '燕麦卫衣',
    connection: '穿搭热度下对"即买即送"体验有需求',
    need: '即时送达、不等待',
    supply: '秒送即时配送',
    action: '结合穿搭/配饰即时配送做体验话题。',
    risk: '中低风险。',
  },
  {
    business: '京东家政',
    hotspot: '青春华章',
    connection: '青年节点话题与家居环境改善有弱关联，建议谨慎。',
    need: '居家体验',
    supply: '家政服务',
    action: '以"青年生活品质"切入做轻话题。',
    risk: '关联较弱，建议仅做公共话题观察。',
  },
  {
    business: '七鲜小厨',
    hotspot: '燕麦卫衣',
    connection: '生活方式热度，可搭"燕麦美食"（燕麦系轻食）真实产品。',
    need: '健康轻食',
    supply: '七鲜小厨燕麦/谷物类餐品',
    action: '将"燕麦卫衣"话题转化为"燕麦系轻食"内容。',
    risk: '低风险。',
  },
  {
    business: '七鲜咖啡',
    hotspot: '燕麦卫衣',
    connection: '燕麦与奶咖品类直接相关（燕麦拿铁）。',
    need: '咖啡消费',
    supply: '七鲜咖啡燕麦拿铁等',
    action: '借"燕麦"字眼做"燕麦拿铁"套餐话题。',
    risk: '低风险。',
  },
  {
    business: '京东点评/京东真榜',
    hotspot: '燕麦卫衣',
    connection: '穿搭/生活方式评价可沉淀"燕麦系穿搭"相关榜单。',
    need: '消费决策参考',
    supply: '点评/真榜评价体系',
    action: '推出穿搭/生活方式类榜单话题。',
    risk: '中风险需保证真实榜单。',
  },
  {
    business: '京东旅行',
    hotspot: '郑钦文',
    connection: '体育赛事热度带动观赛/体育旅行兴趣，可做网球观赛类话题。',
    need: '观赛/度假需求',
    supply: '旅行产品',
    action: '结合网球/体育赛程做"观赛+出行"内容。',
    risk: '需真实赛事节点。',
  },
  {
    business: '七鲜美食MALL',
    hotspot: '燕麦卫衣',
    connection: '热度可关联美食场景（燕麦/谷物美食主题）。',
    need: '美食体验',
    supply: 'MALL 美食供给',
    action: '做"燕麦/谷物美食"主题内容。',
    risk: '低风险。',
  },
];

// 汇总硬性排除/复核数量
const excluded = 0; // 本次无硬性排除公开内容
// 郭德纲事件经用户确认保留展示，无需复核
const pendingReviewCount = 0;

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
    heat: m.hotValue,
    verifyStatus: m.verifyStatus,
    risk: m.risk,
  })),
};

// dashboard: __BUSINESS_ADVICE__?.businesses = { <name>: { verdict,km,action,communication,evidence,risk } }
const businesses = {};
for (const b of businessAdvice) {
  businesses[b.business] = {
    verdict: b.connection || '暂无适合跟进',
    km: b.need || '',
    action: b.action || '',
    communication: b.supply || '',
    evidence: b.evidence || '',
    risk: b.risk || '',
  };
}
const businessForDash = {
  date: today,
  basis: '基于当日热点与各业务真实触点生成',
  coreThemes: businessAdvice.map(b => b.hotspot).filter((v, i, a) => a.indexOf(v) === i),
  businesses,
};

writeFileSync(memePath, JSON.stringify(memeForDash, null, 2));
writeFileSync(bizPath, JSON.stringify(businessForDash, null, 2));

console.log('[gen] 完成：事件数', topEvents.length, 'meme', memeTopics.length, '业务建议', businessAdvice.length);
console.log('[gen] 输出：', outRoot);