import fs from "fs";
const ai = JSON.parse(fs.readFileSync("public/data/ai-analysis.json","utf-8"));
const radar = JSON.parse(fs.readFileSync("public/data/radar.json","utf-8"));
const analyses = ai.analyses || {};

// 规则1: 为什么热度高(propagation) = 纯动因，无借势建议尾巴
const bannedTail = ["借势须","借势宜","品牌可借","品牌可","借势建议","可借势营销","借势营销"];
console.log("======== 规则核对 ========\n");

let fail = 0;

// 规则1 + 规则2 核对（用 radar.json 的 propagation 和 eventSummary）
for (const h of radar.hotspots) {
  console.log("【" + h.title + "】 等级=" + h.level + " 分数=" + h.score);
  const prop = h.propagation || "";
  const summary = h.eventSummary || "";
  const why = h.whyHot || "";

  // 规则1
  let r1 = true;
  for (const kw of bannedTail) {
    if (prop.includes(kw) || why.includes(kw)) { r1 = false; console.log("  ❌ 规则1违规: 含禁词[" + kw + "]"); }
  }
  if (prop.length < 10) { r1 = false; console.log("  ❌ 规则1: propagation 过短/空"); }
  if (!r1) fail++;

  // 规则2: eventSummary 不应是标题复制
  let r2 = true;
  const tShort = h.title.length > 8 ? h.title.substring(0,8) : h.title;
  if (summary.startsWith(h.title) || summary.startsWith(tShort)) { r2=false; console.log("  ❌ 规则2违规: eventSummary 复制了标题"); }
  if (summary.length < 15) { r2=false; console.log("  ❌ 规则2: 解释过短"); }
  if (!r2) fail++;

  console.log("  事件解释: " + summary);
  console.log("  为什么热: " + prop);
  console.log("  canBorrow: " + h.canBorrow + " | " + (h.borrowReason||""));
  console.log("");
}

console.log("======== 规则3: 本地建议检查 ========\n");
const adv = JSON.parse(fs.readFileSync("public/data/business-advice.json","utf-8"));
// 检查 businesses
const businesses = adv.businesses || {};
// 从 ai-analysis 每条 business 建议检查"借哪个热点"
for (const t of Object.keys(analyses)) {
  const a = analyses[t];
  console.log("【" + t + "】");
  (a.business||[]).forEach(b=>{
    const act = b.action || "";
    if (b.business && b.business.includes("整体") && !act.includes("不可借势")) {
      // 检查是否明确借了热点
      if (!act.includes("借【")) {
        console.log("  ⚠️ ["+b.business+"] 未明确写'借哪个热点'");
      }
    }
  });
}
console.log("\n总违规数:", fail);