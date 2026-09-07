#!/usr/bin/env node
/**
 * 在榜时长(duration)估算器
 *
 * 根因：候选构建阶段(filter-hotspots.mjs)只读取单一快照 latest.json，
 * 从不读取多快照历史，导致 durationMin/bestDurationMin 恒为空 → 在榜时长权重25%记0分。
 *
 * 修复：读取 data/raw/<date>/ 下的全平台多快照历史（weibo-*.json / douyin-*.json），
 * 用"该热点出现在最早快照 ~ 最晚快照的时间跨度"估算真实在榜时长：
 *   bestDurationMin = lastSeenTime - firstSeenTime (分钟)
 *
 * 数据源：真实抓取的榜单快照历史（data/raw/YYYY-MM-DD/）。
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATE = process.argv[2] || "2026-09-07";

const clean = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s#“”《》【】·、，！？,.!?：:（）()\-]/g, "");

// ---- 解析快照文件名时间：weibo-0910.json -> 2026-09-07 09:10 ----
const snapTime = (fname, date) => {
  const m = fname.match(/-(\d{2})(\d{2})\.json$/);
  if (!m) return null;
  const [, hh, mm] = m;
  return new Date(`${date}T${hh}:${mm}:00+08:00`).getTime();
};

// ---- 从各平台原始 JSON 提取榜单词条 ----
const extractTitles = (raw) => {
  const titles = [];
  if (raw && raw.data && Array.isArray(raw.data.realtime)) {
    for (const it of raw.data.realtime) if (it.word) titles.push(String(it.word));
  }
  const wl =
    raw && raw.data && Array.isArray(raw.data.word_list)
      ? raw.data.word_list
      : raw && Array.isArray(raw.word_list)
        ? raw.word_list
        : [];
  for (const it of wl) if (it.word) titles.push(String(it.word));
  return titles;
};

// ---- 读取某天全部快照，建立 cleanTitle -> seenTimes[] 索引 ----
async function buildSnapshotIndex(date) {
  const rawDir = join(ROOT, "data/raw", date);
  const files = (await readdir(rawDir)).filter((f) => /\.json$/.test(f));
  const index = new Map();
  const snapshots = [];
  for (const f of files) {
    const t = snapTime(f, date);
    if (t == null) continue;
    const raw = JSON.parse(await readFile(join(rawDir, f), "utf8"));
    for (const title of extractTitles(raw)) {
      const ck = clean(title);
      if (!ck) continue;
      const arr = index.get(ck) || [];
      arr.push({ t, platform: f.split("-")[0], title });
      index.set(ck, arr);
    }
    snapshots.push({ t, file: f });
  }
  snapshots.sort((a, b) => a.t - b.t);
  return { index, snapshots };
}

// ---- 计算候选标题的最早/最晚被观测时间 ----
function firstLastSeen(index, candidateTitle) {
  const ck = clean(candidateTitle);
  // 合并精确匹配 + 包含关系匹配的全部观测时间戳，
  // 避免"只有精确标题在某快照出现，但变体标题在更早/更多快照出现"时被低估为 0。
  let first = null, last = null, count = 0;
  for (const [k, arr] of index) {
    if (ck === k || ck.includes(k) || k.includes(ck)) {
      for (const r of arr) {
        if (first == null || r.t < first) first = r.t;
        if (last == null || r.t > last) last = r.t;
        count++;
      }
    }
  }
  if (count) return { first, last, count };
  return null;
}

const { index, snapshots } = await buildSnapshotIndex(DATE);
const candidates = JSON.parse(
  await readFile(join(ROOT, "data/processed/candidates.json"), "utf8")
);

// ---- 快照下限回退：仅出现在"最晚快照"的热点，记为上一快照~最晚快照的时间跨度 ----
// 说明：若某热点只在最晚一次快照（如 18:33）被观测到，说明它是在上一快照(15:16)与
// 最晚快照之间上榜。记 0 会误导为"刚上榜的瞬间"，记全跨会高估。
// 此处取其"上一快照 ~ 最晚快照"跨度作为下限估算，数值锚定真实抓取时间戳，非凭空捏造。
const latestT = snapshots.length ? snapshots[snapshots.length - 1].t : null;
// 用"去重后的时间戳序列"取上一快照时间，避免同分钟多平台(weibo/web/douyin/xhs)重复导致的零间隔
const distinctTimes = [...new Set(snapshots.map((s) => s.t))].sort((a, b) => a - b);
const prevT = distinctTimes.length > 1 ? distinctTimes[distinctTimes.length - 2] : null;
const floorEstimate =
  latestT && prevT ? Math.max(0, Math.round((latestT - prevT) / 60000)) : 0;

for (const c of candidates.candidates) {
  const seen = firstLastSeen(index, c.title);
  if (seen && seen.count > 0) {
    c.bestDurationMin = Math.max(0, Math.round((seen.last - seen.first) / 60000));
    c.snapshotCount = seen.count;
    // 仅在"最晚快照首次出现"（可能跨平台同分钟多次命中，如 18:33 weibo+douyin）时，
    // 用快照下限回退，避免误导性 0
    if (seen.first === latestT && prevT != null && seen.last === latestT) {
      c.durationSource = "snapshot-floor-estimate";
      c.durationEstimateNote = `仅在最后一次快照(最晚)被观测到，按 上一快照→最晚快照 间隔 ${floorEstimate}min 估算下限`;
      c.bestDurationMin = floorEstimate;
    } else {
      c.durationSource = "snapshot-span";
    }
  } else {
    c.bestDurationMin = 0;
    c.snapshotCount = 0;
    c.durationSource = "no-data";
    c.durationEstimateNote = "数据源未返回在榜时长且快照历史中未见上榜，如实标注数据不可得";
  }
}

await mkdir(dirname(join(ROOT, "data/processed")), { recursive: true });
await writeFile(
  join(ROOT, "data/processed/candidates.json"),
  JSON.stringify(candidates, null, 2) + "\n",
  "utf8"
);
console.log("在榜时长估算完成（快照历史推导）：");
for (const c of candidates.candidates.slice(0, 25)) {
  console.log(
    `  ${c.title} | 在榜 ${c.bestDurationMin}min | 快照命中 ${c.snapshotCount} 次 | 来源 ${c.durationSource}`
  );
}