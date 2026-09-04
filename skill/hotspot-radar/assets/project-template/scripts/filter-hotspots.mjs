#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const latest = JSON.parse(await readFile(join(ROOT, "public/data/latest.json"), "utf8"));
const rules = JSON.parse(await readFile(join(ROOT, "config/hotspot-rules.json"), "utf8"));

const clean = (value) => String(value || "").toLowerCase().replace(/[\s#“”《》【】·、，！？,.!?：:（）()\-]/g, "");
const containsAny = (title, patterns) => patterns.some((pattern) => title.includes(clean(pattern)));
const byKey = new Map();

for (const [platform, payload] of Object.entries(latest.platforms || {})) {
  if (platform === "webwide") continue;
  for (const [index, item] of (payload.items || []).slice(0, rules.maxRankPerPlatform).entries()) {
    const title = String(item.title || "").trim();
    const key = clean(title);
    if (!key) continue;
    const excluded = containsAny(key, rules.excludePatterns);
    const businessMatch = containsAny(key, rules.businessPatterns);
    const rank = index + 1;
    const rankScore = Math.max(0, 36 - rank);
    const hotScore = Number(item.hot) > 0 ? Math.min(25, Math.log10(Number(item.hot) + 1) * 3) : 0;
    const ruleScore = Math.round((rankScore + hotScore + (businessMatch ? 20 : 0)) * 10) / 10;
    const occurrence = { platform, rank, hot: item.hot ?? null, url: item.url || "" };
    const existing = byKey.get(key);
    if (existing) {
      existing.platforms.push(occurrence);
      existing.ruleScore = Math.min(100, Math.round((existing.ruleScore + 15) * 10) / 10);
      existing.crossPlatform = true;
    } else {
      byKey.set(key, {
        id: `${platform}-${rank}-${key.slice(0, 18)}`,
        title,
        ruleScore,
        crossPlatform: false,
        businessKeywordMatch: businessMatch,
        excluded,
        exclusionReason: excluded ? "命中高风险/不宜借势关键词" : "",
        platforms: [occurrence]
      });
    }
  }
}

const candidates = [...byKey.values()]
  .filter((item) => !item.excluded && item.ruleScore >= rules.minimumRuleScore)
  .sort((a, b) => b.ruleScore - a.ruleScore)
  .slice(0, rules.maxCandidates);

const rejected = [...byKey.values()]
  .filter((item) => item.excluded || item.ruleScore < rules.minimumRuleScore)
  .map(({ id, title, ruleScore, exclusionReason }) => ({ id, title, ruleScore, exclusionReason: exclusionReason || "规则得分不足" }));

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: latest.generatedAt,
  date: latest.date,
  rulesSummary: {
    maxRankPerPlatform: rules.maxRankPerPlatform,
    minimumRuleScore: rules.minimumRuleScore,
    candidateCount: candidates.length,
    rejectedCount: rejected.length
  },
  candidates,
  rejected
};

const target = join(ROOT, "data/processed/candidates.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`规则初筛完成：${candidates.length} 个候选，${rejected.length} 个排除`);
