// 下午 14:30 更新修复脚本：删除蔡康永(政治敏感) + 重写三条规则(叙事/纯动因/真实热点单热点)
import fs from 'fs';
const base = '/root/.joyclaw/workspace/hotspot-radar-updated/public/data';

// ---- 读取 ----
const radar = JSON.parse(fs.readFileSync(`${base}/radar.json`, 'utf8'));
const ai = JSON.parse(fs.readFileSync(`${base}/ai-analysis.json`, 'utf8'));
const adv = JSON.parse(fs.readFileSync(`${base}/business-advice.json`, 'utf8'));

// ---- 1. 删除「蔡康永现身台独分子竞选会场」(政治敏感) ----
const EXCLUDE = '蔡康永';
radar.hotspots = radar.hotspots.filter(h => !(h.title||'').includes(EXCLUDE));
delete ai.analyses['蔡康永现身台独分子竞选会场'];
adv.coreThemes = adv.coreThemes.filter(t => !(t||'').includes(EXCLUDE));
// businessAdvice 里可能引用，也过滤
if (ai.businessAdvice) {
  ai.businessAdvice = ai.businessAdvice.filter(b => !(JSON.stringify(b)||'').includes(EXCLUDE));
}

// ---- 2. 重写事件解释(叙事) + 为什么热度高(纯动因)，基于真实数据 ----
const REWRITE = {
  '尊界V800': {
    eventSummary: '华为与江淮汽车合作打造的鸿蒙智行旗舰轿车尊界V800，测试阶段被曝出刹车踏板支架断裂，引发对新车安全性与品控的讨论，品牌尚未正式回应。',
    propagation: '新能源旗舰新车自带高关注度与话题性；"刹车踏板支架断裂"这类涉及行车安全的负面细节冲击力强，戳中消费者对可靠性的核心担忧，加上鸿蒙智行品牌光环，讨论在"质疑品控—对比竞品—等官方回应"之间快速发酵。',
    riskNote: '风险等级：中。涉产品质量安全争议，不建议本地生活业务借势，避免蹭负面舆情。'
  },
  '国庆假期就这样结束了': {
    eventSummary: '国庆长假结束，上班族返工、学生返校，全网"假期结束"的情绪集中爆发，晒返程、晒状态、吐槽开工成为主流话题。',
    propagation: '长假结束是全民共同的时间节点，情绪高度同步；"不想上班""假期过太快"是普适共鸣，人人都能接话，配合晒图、段子、返程攻略等内容，形成高强度情绪宣泄与围观。',
    riskNote: '风险等级：低。可自然关联本地生活消费场景（返工聚餐、换季整理），注意不夸大功效、不做虚假承诺。'
  },
  '国庆高速新能源车充电遇堵': {
    eventSummary: '国庆返程高峰，多地高速服务区新能源车排队充电、桩少车多，充电排队成堵点，车主吐槽"充电1小时排队3小时"。',
    propagation: '新能源车保有量激增与假期集中出行叠加，充电难是刚需痛点且亲历者众；"排队充电"的画面感强、吐槽自带共鸣，既反映真实出行困境，也牵动"新能源替代油车"的大众讨论，情绪+利益双重驱动。',
    riskNote: '风险等级：低。可自然关联本地生活消费场景（出行补给、应急充电），注意不夸大功效、不做虚假承诺。'
  },
  '电影《神探之痕迹》': {
    eventSummary: '新片《神探之痕迹》上映后热度攀升，围绕剧情、案件设定与演员表现引发观众讨论，票房与口碑同步走高。',
    propagation: '悬疑探案题材自带强剧情讨论点，观众热衷"猜凶手、解谜题"，上映期话题集中、二创与解读密集；主演粉丝与推理爱好者叠加，形成"看片—讨论—推荐"的传播循环。',
    riskNote: '风险等级：低。可自然关联本地生活消费场景（观影聚会、影院餐饮），注意不夸大功效、不做虚假承诺。'
  },
  '青海祁连县文旅局免费安置游客到学生宿舍': {
    eventSummary: '青海祁连县因天气等突发情况，文旅局将滞留游客免费安置到学生宿舍，提供临时住宿保障，暖心举措获网友点赞。',
    propagation: '突发状况下官方主动兜底的暖心做法自带正向感染力，与"游客被困"的担忧形成反差；"免费安置到学生宿舍"的具体细节真实可感，契合大众对公共服务温情与担当的期待，情绪共鸣强烈、易于传播。',
    riskNote: '风险等级：低。可自然关联本地生活消费场景（旅行住宿、文旅体验），注意不夸大功效、不做虚假承诺。'
  }
};

for (const h of radar.hotspots) {
  const t = h.title;
  const rw = REWRITE[t];
  if (rw) {
    h.eventSummary = rw.eventSummary;
    h.propagation = rw.propagation;
    h.riskNote = rw.riskNote;
    if (ai.analyses[t]) {
      ai.analyses[t].explanation = rw.eventSummary;
      ai.analyses[t].whyHot = rw.propagation;
      ai.analyses[t].risk = rw.riskNote;
    }
  }
}

// ---- 3. 业务建议：无蔡康永引用、且均为真实热点 ----
// businesses 已确认不含蔡康永硬套；coreThemes 已删。逐条核对 action 是否引用「节日节点」等捏造热点
const businessKeys = Object.keys(adv.businesses);
// 「节日节点」是捏造热点，替换为真实热点「国庆假期就这样结束了」
const fabricated = ['借「节日节点」热点', '借节日节点', '节日节点场景'];
for (const k of businessKeys) {
  const b = adv.businesses[k];
  for (const field of ['action','comms']) {
    for (const f of fabricated) {
      if ((b[field]||'').includes(f)) {
        b[field] = b[field].split(f).join('借「国庆假期就这样结束了」热点');
      }
    }
  }
}

// ---- 写回 ----
fs.writeFileSync(`${base}/radar.json`, JSON.stringify(radar, null, 2) + '\n');
fs.writeFileSync(`${base}/ai-analysis.json`, JSON.stringify(ai, null, 2) + '\n');
fs.writeFileSync(`${base}/business-advice.json`, JSON.stringify(adv, null, 2) + '\n');
console.log('修复完成');
console.log('radar 热点数:', radar.hotspots.length);
console.log('radar 含蔡康永:', JSON.stringify(radar).includes('蔡康永'));
console.log('ai 含蔡康永:', JSON.stringify(ai).includes('蔡康永'));
console.log('advice 含蔡康永:', JSON.stringify(adv).includes('蔡康永'));
console.log('advice 含节日节点(捏造):', JSON.stringify(adv).includes('节日节点'));
// 输出核对摘要
for (const h of radar.hotspots) {
  console.log('【'+h.title+'】');
  console.log('  解释: '+(h.eventSummary||'').slice(0,80));
  console.log('  为什么热: '+(h.propagation||'').slice(0,80));
}