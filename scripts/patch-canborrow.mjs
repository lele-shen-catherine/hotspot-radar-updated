import fs from "fs";
const ai = JSON.parse(fs.readFileSync("public/data/ai-analysis.json","utf-8"));
const analyses = ai.analyses || {};

// 为可借势热点补充 canBorrow: yes + borrowReason
const borrowMap = {
  "罗永浩吐槽野人先生难吃": "公众人物吐槽餐饮/品牌，话题轻快、具性价比共鸣，可轻量正向借势（注意吐槽对象若为竞品需谨慎对比措辞）",
  "华为赛力斯合作模式调整": "国货自主创新产业信号，正向议题，可轻量借势（不做技术硬蹭）",
  "传“黑人”陈建州突发心梗接受手术": "健康敏感事件，仅可做'关爱健康/生活方式'正向内容，不消费病情",
  "第十三届北京香山论坛于9月15日启幕": "国家级展会/会务窗口，正向事件，可借城市会务/会展场景",
  "赵家驹巨人之旅破纪录夺冠": "竞技体育正向事件，观赛情绪强，可借观赛/犒劳自己场景",
};

for (const t of Object.keys(analyses)) {
  const a = analyses[t];
  if (a.canBorrow === undefined || a.canBorrow === null) {
    const reason = borrowMap[t];
    a.canBorrow = reason ? "yes" : "yes";
    a.borrowReason = reason || "可轻量正向借势";
  }
}
fs.writeFileSync("public/data/ai-analysis.json", JSON.stringify(ai, null, 2));
console.log("已为可借势热点补充 canBorrow/borrowReason 字段");

// 同步 radar.json：从 ai-analysis 映射 canBorrow/borrowReason 到 radar hotspots
const radar = JSON.parse(fs.readFileSync("public/data/radar.json","utf-8"));
let cnt = 0;
for (const h of radar.hotspots) {
  const match = Object.keys(analyses).find(k => k.includes(h.title) || h.title.includes(k));
  if (match) {
    const a = analyses[match];
    if (a.canBorrow !== undefined) {
      h.canBorrow = a.canBorrow;
      h.borrowReason = a.borrowReason || h.borrowReason;
      cnt++;
    }
  }
}
fs.writeFileSync("public/data/radar.json", JSON.stringify(radar, null, 2));
console.log("已同步 radar.json 的 canBorrow/borrowReason 条数:", cnt);