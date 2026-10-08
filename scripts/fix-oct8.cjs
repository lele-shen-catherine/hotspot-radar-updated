const fs = require('fs');
const path = '/root/.joyclaw/workspace/hotspot-radar-updated/public/data/';

// 1. radar.json：删除蔡康永条目
const radar = JSON.parse(fs.readFileSync(path + 'radar.json', 'utf8'));
radar.hotspots = radar.hotspots.filter(i => !JSON.stringify(i).includes('蔡康永') && !JSON.stringify(i).includes('台独'));
fs.writeFileSync(path + 'radar.json', JSON.stringify(radar, null, 2));
console.log('radar.json hotspots:', radar.hotspots.length, '(蔡康永已删)');

// 2. ai-analysis.json：删除 analyses 里的蔡康永 key
const ai = JSON.parse(fs.readFileSync(path + 'ai-analysis.json', 'utf8'));
if (ai.analyses) {
  Object.keys(ai.analyses).forEach(k => {
    if (k.includes('蔡康永') || k.includes('台独')) delete ai.analyses[k];
  });
  // 也检查 analyses 若是数组
}
ai.updatedAt = new Date().toISOString();
fs.writeFileSync(path + 'ai-analysis.json', JSON.stringify(ai, null, 2));
console.log('ai-analysis.json analyses keys:', Object.keys(ai.analyses||{}).length, '(蔡康永已删)');

// 3. business-advice.json：删除借势热点里的蔡康永 + 修正3个业务借真实热点
const bs = JSON.parse(fs.readFileSync(path + 'business-advice.json', 'utf8'));
// 删除借势热点列表里的蔡康永
if (bs.hotspots) bs.hotspots = bs.hotspots.filter(h => !String(h).includes('蔡康永') && !String(h).includes('台独'));
// 修正3个业务
const bz = bs.businesses;
bz['京东秒送（即时零售）'].action = '借「国庆假期就这样结束了」热点：承接假期结束返程的即时需求，围绕零食饮料、应急物资、收心场景做"即买即送"极速履约，突出确定性配送与随时到家';
bz['京东秒送（即时零售）'].comms = '结合返程收心场景，用"有事没事犒劳一下"展示真实到家组合，强调即时可送达的确定性；不夸大时效、不做虚假承诺';
bz['京东家政'].action = '借「国庆假期就这样结束了」热点：假期结束正是换季整理与收心清洁的需求节点，明确清洁/收纳服务范围、时长与价格，主打"干干净净过季"';
bz['京东家政'].comms = '围绕假期结束收心场景，以"给生活做一次整理""干干净净过季"为主题展示标准流程、人员资质与价格边界；不做抢热点营销';
bz['七鲜美食MALL'].action = '借「电影《神探之痕迹》」热点：观影热点带动到店聚餐打卡，组织可执行的观影+聚餐路线，明确参与商户、楼层、营业时段与现场可兑现信息';
bz['七鲜美食MALL'].comms = '结合观影聚会场景，用"看完电影来 MALL 好好吃一顿"呈现真实餐饮路线与用户聚会体验；不使用未授权素材，活动时间/商户/权益以现场可兑现为准';
fs.writeFileSync(path + 'business-advice.json', JSON.stringify(bs, null, 2));
console.log('business-advice.json 已修正: 删蔡康永 + 3业务借真实热点');
console.log('  秒送→借「国庆假期就这样结束了」');
console.log('  家政→借「国庆假期就这样结束了」');
console.log('  MALL→借「电影《神探之痕迹》」');

// 4. latest.json：删除蔡康永
const latest = JSON.parse(fs.readFileSync(path + 'latest.json', 'utf8'));
const ls = JSON.stringify(latest);
if (ls.includes('蔡康永') || ls.includes('台独')) {
  if (Array.isArray(latest)) {
    latest = latest.filter(i => !JSON.stringify(i).includes('蔡康永') && !JSON.stringify(i).includes('台独'));
  }
  fs.writeFileSync(path + 'latest.json', JSON.stringify(latest, null, 2));
  console.log('latest.json 已尝试清理');
}
console.log('=== 修复完成 ===');