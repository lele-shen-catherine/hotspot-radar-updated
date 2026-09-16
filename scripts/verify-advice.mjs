import fs from "fs";
const ai = JSON.parse(fs.readFileSync("public/data/ai-analysis.json","utf-8"));
const analyses = ai.analyses || {};
for (const t of Object.keys(analyses)) {
  const a = analyses[t];
  console.log("\n===== " + t + " =====");
  console.log("explanation: " + a.explanation);
  console.log("whyHot: " + a.whyHot);
  console.log("canBorrow: " + a.canBorrow + " | borrowReason: " + (a.borrowReason||""));
  (a.business||[]).forEach(b=>{
    console.log("  ["+b.business+"] " + (b.action||""));
  });
}
// 检查 business-advice.json 是否也有南方医科
const adv = JSON.parse(fs.readFileSync("public/data/business-advice.json","utf-8"));
console.log("\n\n===== business-advice.json 顶层 ===== ");
console.log("keys:", Object.keys(adv));