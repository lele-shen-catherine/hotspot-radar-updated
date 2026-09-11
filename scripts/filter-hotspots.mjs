#!/usr/bin/env node
/**
 * 规则初筛（新规 v2 §六）
 * - 不做业务相关性门槛（§一：业务相关性不得作为 S/A/B 展示条件）
 * - 只对四类硬性排除做关键词语义复核提示，不凭单个关键词硬删（§六.5）
 * - 保留排名、热度、来源、原始链接等客观字段
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const latest = JSON.parse(await readFile(join(ROOT, "public/data/latest.json"), "utf8"));
const rules = JSON.parse(await readFile(join(ROOT, "config/hotspot-rules.json"), "utf8"));

const clean = (value) => String(value || "").toLowerCase().replace(/[\s#“”《》【】·、，！？,.!?：:（）()\-]/g, "");
const hitCategory = (title, categories) => {
  const t = clean(title);
  for (const [catId, cat] of Object.entries(categories)) {
    if (cat.keywords.some((k) => t.includes(clean(k)))) {
      return { category: catId, label: cat.label, keywordHit: true };
    }
  }
  return null;
};

const byKey = new Map();

for (const [platform, payload] of Object.entries(latest.platforms || {})) {
  // webwide 全网榜纳入候选(固定6席需知微Top4)，同样参与四类硬性排除语义复核
  for (const [index, item] of (payload.items || []).slice(0, rules.maxRankPerPlatform).entries()) {
    const title = String(item.title || "").trim();
    const key = clean(title);
    if (!key) continue;
    const rank = index + 1;
    const occurrence = {
      platform,
      rank,
      hot: item.hot ?? null,
      url: item.url || "",
      sourceName: item.sourceName || item.source || platform,
      sourceUpdatedAt: item.sourceUpdatedAt || null,
      collectedAt: item.collectedAt || null
    };
    const existing = byKey.get(key);
    if (existing) {
      existing.platforms.push(occurrence);
      existing.crossPlatform = true;
    } else {
      const hit = hitCategory(title, rules.hardExclusionCategories);
      byKey.set(key, {
        id: `${platform}-${rank}-${key.slice(0, 18)}`,
        title,
        crossPlatform: false,
        hardExclusionHit: !!hit,
        hardExclusionCategories: hit ? [hit] : [],
        platforms: [occurrence]
      });
    }
  }
}

// 待语义复核（疑似硬性排除）→ 进入非公开复核队列，不进入正式候选
const candidates = [];
const pendingReview = [];
for (const item of byKey.values()) {
  if (item.hardExclusionHit) {
    pendingReview.push({
      id: item.id,
      title: item.title,
      categories: item.hardExclusionCategories.map((c) => c.label),
      reason: item.hardExclusionCategories.map((c) => `命中「${c.label}」关键词`).join("；")
    });
  } else {
    candidates.push({
      id: item.id,
      title: item.title,
      crossPlatform: item.crossPlatform,
      platforms: item.platforms
    });
  }
}

candidates.sort((a, b) => b.platforms.length - a.platforms.length || a.platforms[0].rank - b.platforms[0].rank);
const output = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: latest.generatedAt,
  date: latest.date,
  rulesSummary: {
    maxRankPerPlatform: rules.maxRankPerPlatform,
    candidateCount: candidates.length,
    pendingReviewCount: pendingReview.length
  },
  candidates,
  pendingReview
};

const target = join(ROOT, "data/processed/candidates.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`规则初筛完成：${candidates.length} 个候选，${pendingReview.length} 个待语义复核（四类硬性排除）`);