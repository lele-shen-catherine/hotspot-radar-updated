// 2026-10-09 15:00 叙事规则修复（下午场）：
// 1) 删除「蔡康永现身台独分子竞选会场」（政治敏感，四类不展示，抓到即删不上页面）
// 2) 事件解释 = 叙事（不复制标题）；为什么热度高 = 纯动因（无借势尾巴）
// 3) 本地生活建议 = 先写借哪个热点 + 单热点；不借死亡/悲剧热点
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/data');
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const save = (f, d) => fs.writeFileSync(path.join(dir, f), JSON.stringify(d, null, 2), 'utf8');

const POLITICAL = '蔡康永现身台独分子竞选会场';

// ---- 1. radar.json：删除政治敏感热点 ----
const radar = load('radar.json');
radar.hotspots = radar.hotspots.filter(h => h.title !== POLITICAL && h.eventName !== POLITICAL);
// 修正 note 席位数说明
radar.note = '固定席位: 知微Top+抖音Top1+微博Top1; 去重后按热度值降序; 热度值仅用于S/A/B分级; 已剔除政治敏感热点';
save('radar.json', radar);

// ---- 2. ai-analysis.json：删除政治热点 + 重写叙事解释与纯动因 ----
const ai = load('ai-analysis.json');
delete ai.analyses[POLITICAL];

const newExpl = {
  '江淮汽车回应尊界V800刹车踏板断裂': '华为与赛力斯调整双方在智能汽车业务上的合作模式，涉及技术、渠道与分成安排，行业关注合作走向。',
  '小米集团股价盘中大涨超9%': '小米集团当日股价在盘中快速拉升，涨幅一度超过9%，背后或与新产品发布节奏、市场对增长预期的重新定价相关，投资者情绪回暖推动股价走高。',
  '桂花香是一种非牛顿流体': '有博主用科普方式解释桂花香气与"非牛顿流体"的类比，把抽象的物理概念和日常桂花意象结合，形成趣味科普内容，网友在转发和二次创作中扩散。',
  '俄罗斯“鼠疫事件”': '近期俄罗斯出现疑似"鼠疫/不明肺炎"的公共卫生传闻，引发舆论关注与担忧，世卫组织及俄方先后回应澄清，围绕信息真实性、防控措施与公众恐慌的讨论持续发酵。',
  '安妮·卡森斩获2026诺贝尔文学奖': '加拿大诗人、学者安妮·卡森获得2026年诺贝尔文学奖，这一文学界最高荣誉公布后引发关注，公众围绕其诗歌成就、获奖意义与文化影响展开讨论。'
};
const newWhy = {
  '江淮汽车回应尊界V800刹车踏板断裂': '品牌公关事件触发信任议题；公众关注品牌态度与整改诚意，道歉-回应-后续处理构成完整叙事，评论区两极分化推动持续上榜。',
  '小米集团股价盘中大涨超9%': '股价大涨自带强信号属性，牵动投资者情绪与市场信心；涨幅数字直观、易引发"为什么涨"的讨论，叠加品牌热点形成持续关注。',
  '桂花香是一种非牛顿流体': '用生活化比喻讲科学，降低了理解门槛，自带"涨知识"与趣味性；桂花是当下时令意象，贴近季节氛围，容易激发分享与二次创作。',
  '俄罗斯“鼠疫事件”': '公共卫生事件天然触发公众对健康安全的担忧与信息求证需求，恐慌与澄清交替形成一波波关注；涉境外疫情易牵动大众对防控措施的讨论，信息差放大传播。',
  '安妮·卡森斩获2026诺贝尔文学奖': '诺贝尔文学奖是全球性文化事件，自带权威性与话题性；获奖消息公布的时间节点与奖项稀缺性共同推高关注，文学圈与大众舆论同步聚焦。'
};
for (const k of Object.keys(ai.analyses || {})) {
  if (newExpl[k]) ai.analyses[k].explanation = newExpl[k];
  if (newWhy[k]) ai.analyses[k].whyHot = newWhy[k];
  // 兜底：清掉残留的借势尾巴
  ai.analyses[k].whyHot = String(ai.analyses[k].whyHot || '')
    .replace(/，借势时[^。]*。/g, '')
    .replace(/借势(须|宜|可|时)[^。]*。?/g, '')
    .trim();
}
save('ai-analysis.json', ai);

// ---- 3. business-advice.json：剔除政治热点 + 京东本地生活去掉死亡借势 + 所有业务点明借哪个热点 ----
const adv = load('business-advice.json');
adv.coreThemes = (adv.coreThemes || []).filter(t => t !== POLITICAL);

// 京东本地生活（整体）：之前误借「新郎婚礼当天去医院看病后离世」死亡热点 → 改常规运营
const localLife = adv.businesses['京东本地生活（整体）'];
if (localLife) {
  localLife.action = '今日无可真实结合的借势热点（涉及逝者的悲剧事件不作借势），回归本地生活整体的日常常规运营：围绕门店履约、服务保障与优惠信息做常规告知，不强行蹭热点。';
  localLife.comms = '围绕本地生活日常服务场景，传播以真实可兑现的门店活动、服务保障与用户权益为主，用真诚的内容建立信任；对任何悲剧/逝者类事件一律不作借势营销。';
}

// 其余业务：确保 action 首行「借xxx热点：」点明单热点，comms 沿用同一热点不重复点名
// （当前版本多数已是单热点+点明，只需补对齐）
const themeMap = {
  '京东外卖': '足不出户吃遍东南亚美食',
  '京东秒送（即时零售）': '节日节点',
  '京东家政': '节日节点',
  '七鲜小厨': '足不出户吃遍东南亚美食',
  '七鲜美食MALL': '节日节点'
};
for (const [biz, theme] of Object.entries(themeMap)) {
  const b = adv.businesses[biz];
  if (b && !/^借/.test(b.action)) {
    b.action = `借「${theme}」热点：` + b.action.replace(/^(聚焦|围绕)[^：]*[：]?\s*/, '');
  }
}
save('business-advice.json', adv);

console.log('fix-1500 done: 删除蔡康永政治热点; 事件解释叙事化; whyHot纯动因; 京东本地生活去死亡借势; 业务建议点明单热点.');