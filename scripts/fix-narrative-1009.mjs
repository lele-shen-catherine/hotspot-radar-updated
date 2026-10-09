// 2026-10-09 叙事规则修复：事件解释=叙事不复制标题；为什么热度高=纯动因无借势尾巴；本地生活不借死亡热点
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/data');
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const save = (f, d) => fs.writeFileSync(path.join(dir, f), JSON.stringify(d, null, 2), 'utf8');

// ---- 1. ai-analysis.json：重写事件解释(叙事) + 为什么热度高(纯动因) ----
const ai = load('ai-analysis.json');
const newExpl = {
  '己立 再立人': '「己立 再立人」是近期在短视频平台走红的一句主题口号，围绕"先把自己立起来、再去成就他人"的自立与成长话题展开，带动大量用户分享个人奋斗与自我提升的经历，形成一股强调独立自强的情绪共鸣。',
  '请回答1988': '韩剧《请回答1988》因怀旧题材再次翻红，网友围绕剧中亲情、邻里与青春记忆展开讨论，大量片段剪辑与"童年回忆杀"内容重新流传，带动对老剧、旧时光的情感回望。',
  '俄罗斯“鼠疫事件”': '近期俄罗斯出现疑似"鼠疫/不明肺炎"的公共卫生传闻，引发舆论关注与担忧，世卫组织及俄方先后回应澄清，围绕信息真实性、防控措施与公众恐慌的讨论持续发酵。',
  '安妮·卡森斩获2026诺贝尔文学奖': '加拿大诗人、学者安妮·卡森获得2026年诺贝尔文学奖，这一文学界最高荣誉公布后引发关注，公众围绕其诗歌成就、获奖意义与文化影响展开讨论。'
};
const newWhy = {
  '己立 再立人': '该话题自带正能量与自我提升属性，恰好切中年轻人对独立、成长与"做自己的光"的心理诉求；情绪正向、易转发，短视频平台助推形成持续传播。',
  '请回答1988': '怀旧是高频共鸣的情绪锚点，老剧翻红自带"童年记忆"标签，容易激发集体回忆与分享欲；片段化传播降低参与门槛，讨论与二创持续带动热度。',
  '俄罗斯“鼠疫事件”': '公共卫生事件天然触发公众对健康安全的担忧与信息求证需求，恐慌与澄清交替形成一波波关注；涉境外疫情易牵动大众对防控措施的讨论，信息差放大传播。',
  '安妮·卡森斩获2026诺贝尔文学奖': '诺贝尔文学奖是全球性文化事件，自带权威性与话题性；获奖消息公布的时间节点与奖项稀缺性共同推高关注，文学圈与大众舆论同步聚焦。'
};
for (const k of Object.keys(ai.analyses || {})) {
  if (newExpl[k]) ai.analyses[k].explanation = newExpl[k];
  if (newWhy[k]) ai.analyses[k].whyHot = newWhy[k];
  // 兜底：清掉残留的借势尾巴（"借势时…"、"可借…"等）
  ai.analyses[k].whyHot = ai.analyses[k].whyHot.replace(/，借势时[^。]*。/g, '').replace(/借势(须|宜|可|时)[^。]*。?/g, '').trim();
}
save('ai-analysis.json', ai);

// ---- 2. business-advice.json：京东本地生活不借死亡热点，改为常规运营 ----
const adv = load('business-advice.json');
const localLife = adv.businesses['京东本地生活（整体）'];
if (localLife) {
  localLife.action = '今日无可真实结合的借势热点（涉及逝者的悲剧事件不作借势），回归本地生活整体的日常常规运营：围绕门店履约、服务保障与优惠信息做常规告知，不强行蹭热点。';
  localLife.comms = '围绕本地生活日常服务场景，传播以真实可兑现的门店活动、服务保障与用户权益为主，用真诚的内容建立信任；对任何悲剧/逝者类事件一律不作借势营销。';
}
save('business-advice.json', adv);

console.log('fix-narrative done: ai explanations/whyHot rewritten, 京东本地生活 death-hotspot removed.');