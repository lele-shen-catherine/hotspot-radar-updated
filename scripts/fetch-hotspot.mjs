#!/usr/bin/env node
/**
 * fetch-hotspot.mjs
 *
 * 抓取微博/抖音/小红书热榜数据，写入 JSON 文件。
 * 设计为 GitHub Actions 定时调用（每天 08:15 / 15:00 CST）。
 *
 * 数据源（已全部移除 60s API，其国内镜像对 GitHub Actions 的境外 IP 返回 403）：
 *   微博:   微博官方 AJAX 接口 → aipromptnav HotData → imsyy → vvhan
 *   抖音:   抖音官方热词榜（iesdouyin）→ aipromptnav HotData → imsyy → vvhan
 *   小红书: JustOneAPI 热搜（需要 JUSTONE_API_TOKEN，海外服务器）
 *           → vvhan 小红书热榜
 *
 * JustOneAPI token 通过环境变量 JUSTONE_API_TOKEN 传入，
 * GitHub Actions 里配置为 repo secret。没有 token 时自动跳过该源。
 *
 * 输出：
 *   1. data/raw/YYYY-MM-DD/{weibo,douyin,xhs}-HHMM.json  — 原始快照存档
 *   2. public/data/latest.json                            — 前端动态加载用合并数据
 *   3. public/data/meta.json                              — 元数据
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FETCH_TIMEOUT = 15_000;
const MIN_ITEMS = 5; // 至少拿到 N 条才算成功

const JUSTONE_TOKEN = process.env.JUSTONE_API_TOKEN || "";
const JUSTONE_BASE =
  process.env.JUSTONE_BASE || "https://api.justoneapi.com";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
};

// aipromptnav HotData 的公开 key（内嵌在其前端 JS 中，属公开接口）
const APN_KEY = "zIisgRZJLLXgqKCwBirNLegtNNRuL70eBsbHXPxEBWU=";

// ---- 数据源定义 ----
//
// 每个数据源提供：
//   - name: 标识，用于在 latest.json.sources 里记录
//   - base: API 基址
//   - path: 路径模板
//   - timeout: 可选，覆盖默认超时（毫秒）
//   - parse(json) -> [{title, url, hot?, desc?, cover?}, ...]
//     把不同数据源的数据统一成相同结构，供前端使用
//
// 顺序很重要：前面的源优先尝试；都失败才走下一个。

const SOURCES = {
  webwide: [
    {
      name: "zhiwei-event-rank",
      base: "https://ef.zhiweidata.com",
      path: "/index/indexUp.do",
      parse(json) {
        const snapshots = json?.data?.rankHour || [];
        const latest = snapshots.at(-1) || {};
        return (latest.info || [])
          .filter((item) => item.eventId && item.eventId !== "otherEventId")
          .slice(0, 10)
          .map((item) => ({
            title: item.name || "",
            url: `https://ef.zhiweidata.com/eventRk/${encodeURIComponent(item.eventId)}/profil`,
            hot: item.hE ?? null,
            proportion: item.pro ?? null,
            category: item.firstType || "",
            snapshotTime: latest.time || "",
            eventId: item.eventId,
          }));
      },
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://ef.zhiweidata.com/",
      },
    },
  ],
  // 官方接口第一优先级（站内主要面向国内用户，官方数据最准最实时），
  // 聚合 API（imsyy/vvhan）作为兜底，官方接口异常时自动切换。
  weibo: [
    {
      name: "weibo-official",
      base: "https://weibo.com",
      path: "/ajax/side/hotSearch",
      parse(json) {
        // 官方: { ok, data: { realtime: [{ word, word_scheme, label, num, onboard_time }] } }
        const list = json?.data?.realtime || [];
        return list.map((it) => ({
          title: it.word || it.note || "",
          url: it.word_scheme
            ? `https://s.weibo.com/weibo?q=%23${encodeURIComponent(it.word)}%23`
            : it.url || "",
          hot: it.num ?? it.hot ?? null,
          label: it.label || null,
        }));
      },
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://weibo.com/",
      },
    },
    {
      name: "aipromptnav",
      base: "https://w-hotdata.aipromptnav.com",
      path: "/api/hot-data/weibohot",
      parse(json) {
        // aipromptnav: { data_id, data_day, data_time, list: [{ hotword, hotwordnum, hottag }] }
        // hotwordnum 是带空格的字符串，需清洗成数字
        const list = json?.list || [];
        return list.map((it) => ({
          title: it.hotword || "",
          url: it.hotword
            ? `https://s.weibo.com/weibo?q=%23${encodeURIComponent(it.hotword)}%23`
            : "",
          hot: parseNumish(it.hotwordnum),
          label: it.hottag || null,
        }));
      },
      headers: { "X-API-Key": APN_KEY },
    },
    {
      name: "imsyy",
      base: "https://api-hot.imsyy.top",
      path: "/weibo",
      parse(json) {
        // imsyy: { code, data: [{ word, word_scheme, label, onboard_time, url, num }] }
        const list = json?.data || [];
        return list.map((it) => ({
          title: it.word || it.title || it.note || "",
          url:
            it.url ||
            (it.word_scheme
              ? `https://s.weibo.com/weibo?q=%23${encodeURIComponent(it.word)}%23`
              : ""),
          hot: it.num ?? it.hot ?? it.score ?? it.hot_value ?? null,
          label: it.label || null,
        }));
      },
    },
    {
      name: "vvhan",
      base: "https://api.vvhan.com",
      path: "/api/hotlist?type=weiboHot",
      parse(json) {
        // vvhan: { success, data: [{ title, hot, url, ... }] }
        const list = json?.data || [];
        return list.map((it) => ({
          title: it.title || it.name || it.word || "",
          url: it.url || it.link || "",
          hot: it.hot ?? it.score ?? it.num ?? null,
        }));
      },
    },
  ],
  douyin: [
    {
      name: "douyin-official",
      base: "https://www.iesdouyin.com",
      path: "/web/api/v2/hotsearch/billboard/word/",
      parse(json) {
        // 官方热词榜: { status_code: 0, word_list: [{ word, hot_value, label }] }
        const list = json?.word_list || [];
        // label 含义参考: 1=新 2=热 3=爆 4=首发（保守映射，未知值不显示）
        const LABELS = { 1: "新", 2: "热", 3: "爆", 4: "首发" };
        return list.map((it) => ({
          title: it.word || "",
          url: it.word
            ? `https://www.douyin.com/search/${encodeURIComponent(it.word)}`
            : "",
          hot: it.hot_value ?? null,
          label: LABELS[it.label] || null,
        }));
      },
      headers: {
        ...BROWSER_HEADERS,
        Referer: "https://www.douyin.com/",
      },
    },
    {
      name: "aipromptnav",
      base: "https://w-hotdata.aipromptnav.com",
      path: "/api/hot-data/douyinhot",
      parse(json) {
        // aipromptnav: { list: [{ word, hotindex, label }] }，label 映射同抖音官方
        const list = json?.list || [];
        const LABELS = { 1: "新", 2: "热", 3: "爆", 4: "首发" };
        return list.map((it) => ({
          title: it.word || "",
          url: it.word
            ? `https://www.douyin.com/search/${encodeURIComponent(it.word)}`
            : "",
          hot: it.hotindex ?? null,
          label: LABELS[it.label] || null,
        }));
      },
      headers: { "X-API-Key": APN_KEY },
    },
    {
      name: "imsyy",
      base: "https://api-hot.imsyy.top",
      path: "/douyin",
      parse(json) {
        const list = json?.data || [];
        return list.map((it) => ({
          title: it.title || it.word || it.note || "",
          url: it.url || it.link || "",
          hot: it.hot ?? it.view_count ?? it.score ?? it.num ?? null,
          cover: it.cover || "",
        }));
      },
    },
    {
      name: "vvhan",
      base: "https://api.vvhan.com",
      path: "/api/hotlist?type=douyinHot",
      parse(json) {
        const list = json?.data || [];
        return list.map((it) => ({
          title: it.title || it.name || it.word || "",
          url: it.url || it.link || "",
          hot: it.hot ?? it.score ?? it.num ?? null,
        }));
      },
    },
  ],
  xhs: [
    // UAPI 小红书热榜（新规 §4.1 指定主要结构化数据源）
    {
      name: "uapi-xiaohongshu",
      base: "https://uapis.cn",
      path: "/api/v1/misc/hotboard?type=xiaohongshu",
      parse(json) {
        // UAPI: { code, msg, data: { data: [ { index,title,hot_value,url,extra,... } ], update_time } }
        const data = json?.data?.data ?? json?.data ?? [];
        const updateTime = json?.data?.update_time ?? json?.update_time ?? "";
        const list = Array.isArray(data) ? data : [];
        return list.map((it, i) => ({
          title: it.title || it.name || it.word || "",
          url:
            it.url ||
            (it.title
              ? `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(it.title)}`
              : ""),
          hot: it.hot ?? it.hot_value ?? it.hotValue ?? null,
          desc: it.extra?.label || it.label || "",
          cover: it.extra?.cover || it.cover || "",
          rank: it.index ?? i + 1,
          sourceUpdatedAt: updateTime,
          rawExtra: it.extra || {},
        })).filter((it) => it.title);
      },
    },
    ...(JUSTONE_TOKEN
      ? [
          {
            name: "justone-hotlist",
            base: JUSTONE_BASE,
            path: `/api/xiaohongshu/hot-list/v1?token=${encodeURIComponent(JUSTONE_TOKEN)}`,
            timeout: 90_000, // JustOneAPI 官方建议 60-120s
            parse(json) {
              // JustOneAPI: { code: 0, data: ... }，data 结构可能随版本变化，
              // 用宽松策略抽取列表
              return normalizeUnknownList(json?.data);
            },
          },
          {
            name: "justone-hotsearch",
            base: JUSTONE_BASE,
            path: `/api/xiaohongshu/hot-search/v1?token=${encodeURIComponent(JUSTONE_TOKEN)}&nd=DAY_3`,
            timeout: 90_000,
            parse(json) {
              return normalizeUnknownList(json?.data);
            },
          },
        ]
      : []),
    {
      name: "vvhan",
      base: "https://api.vvhan.com",
      path: "/api/hotlist?type=xiaohongshuHot",
      parse(json) {
        const list = json?.data || [];
        return list.map((it) => ({
          title: it.title || it.name || it.word || "",
          url: it.url || it.link || "",
          hot: it.hot ?? it.score ?? it.num ?? null,
          desc: it.desc || "",
          cover: it.cover || it.icon || "",
        }));
      },
    },
  ],
};

/** 从未知结构中宽松抽取热榜条目列表（用于 JustOneAPI 等结构可能变化的源） */
function normalizeUnknownList(data) {
  if (!data) return [];
  // 直接是数组
  let list = Array.isArray(data) ? data : null;
  // 常见包裹字段
  if (!list) {
    for (const key of ["list", "items", "records", "rows", "hotList", "data", "result"]) {
      if (Array.isArray(data[key])) {
        list = data[key];
        break;
      }
    }
  }
  // 分页结构 { pageInfo/list }
  if (!list && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        list = value;
        break;
      }
    }
  }
  if (!list) return [];

  return list.map((it) => {
    const obj = it || {};
    const title =
      obj.title || obj.name || obj.word || obj.keyword || obj.searchWord ||
      obj.topic || obj.subject || "";
    const url =
      obj.url || obj.link || obj.note_url || obj.noteUrl ||
      (obj.keyword
        ? `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(obj.keyword)}`
        : "");
    // 热度值：优先取语义最接近"热度"的字段
    const hot =
      obj.hot ?? obj.hotValue ?? obj.view ?? obj.views ?? obj.view_count ??
      obj.imp_num ?? obj.premium_imp_num ?? obj.premium_read_num ??
      obj.premium_engage_num ?? obj.premium_like_num ?? obj.score ??
      obj.num ?? obj.rank_num ?? null;
    return {
      title,
      url,
      hot: typeof hot === "number" ? hot : parseNumish(hot),
      desc: obj.desc || obj.description || obj.evidence || "",
      cover: obj.cover || obj.icon || "",
    };
  }).filter((it) => it.title);
}

function parseNumish(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const PLATFORMS = [
  { key: "webwide", label: "\u5168\u7f51\u70ed\u70b9" },
  { key: "weibo",  label: "微博" },
  { key: "douyin", label: "抖音" },
  { key: "xhs",    label: "小红书" },
];

// ---- 工具函数 ----

async function fetchWithTimeout(url, opts = {}, timeout = FETCH_TIMEOUT) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function getCSTTimeInfo() {
  const now = new Date();
  const cstOffset = 8 * 60 * 60 * 1000;
  const cstDate = new Date(now.getTime() + cstOffset);
  const dateStr = cstDate.toISOString().slice(0, 10);
  const hh = String(cstDate.getUTCHours()).padStart(2, "0");
  const mm = String(cstDate.getUTCMinutes()).padStart(2, "0");
  const timeStr = `${hh}${mm}`;
  return { dateStr, timeStr, fullISO: cstDate.toISOString() };
}

async function safeWriteFile(filePath, data) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(filePath, data, "utf-8");
  console.log(`  ✓ 写入 ${filePath}`);
}

/** 依次尝试某平台的所有数据源，返回第一个成功的标准化结果 */
async function fetchPlatform(platform) {
  const sources = SOURCES[platform.key] || [];
  for (const src of sources) {
    const url = src.base + src.path;
    try {
      console.log(`  ↳ 尝试 ${src.name}: ${src.base}${src.path.split("?")[0]}${src.path.includes("?") ? "?…" : ""}`);
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": "hotspot-radar-bot/1.0 (+github-actions)",
            Accept: "application/json,text/plain,*/*",
            ...(src.headers || {}),
          },
        },
        src.timeout || FETCH_TIMEOUT
      );
      if (!res.ok) {
        console.log(`    HTTP ${res.status}，跳过`);
        continue;
      }
      const json = await res.json();
      // JustOneAPI 业务码：code !== 0 视为失败
      if (json && typeof json.code === "number" && json.code !== 0) {
        console.log(`    业务错误 code=${json.code} (${json.message || "无消息"})，跳过`);
        continue;
      }
      const items = src.parse(json);
      if (!Array.isArray(items) || items.length < MIN_ITEMS) {
        console.log(`    解析后条目过少 (${items?.length ?? 0})，跳过`);
        continue;
      }
      console.log(`    成功，${items.length} 条数据`);
      return {
        source: src.name,
        base: src.base,
        path: src.path,
        items,
        raw: json,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.log(`    请求失败: ${err.message}，跳过`);
    }
  }
  return null;
}

// ---- 主流程 ----

async function main() {
  const { dateStr, timeStr, fullISO } = getCSTTimeInfo();
  console.log(`\n=== 热点雷达数据抓取 ===`);
  console.log(`CST 时间: ${dateStr} ${timeStr.slice(0, 2)}:${timeStr.slice(2)}`);
  console.log(`JustOneAPI token: ${JUSTONE_TOKEN ? "已配置" : "未配置（小红书将走 vvhan 兜底）"}`);
  console.log();

  const results = {};
  let successCount = 0;

  for (const platform of PLATFORMS) {
    console.log(`[${platform.label}] 抓取中...`);
    const data = await fetchPlatform(platform);
    if (data) {
      results[platform.key] = data;
      successCount++;
    } else {
      console.log(`  ✗ 所有数据源均失败，跳过 ${platform.label}`);
      results[platform.key] = null;
    }
    console.log();
  }

  if (successCount === 0) {
    console.error("✗ 所有平台抓取失败，退出。");
    process.exit(1);
  }

  // 1. 写入原始快照存档（保留数据源原始 JSON，方便回溯）
  console.log("--- 写入原始快照 ---");
  const rawDir = join(ROOT, "data", "raw", dateStr);
  for (const platform of PLATFORMS) {
    const data = results[platform.key];
    if (!data) continue;
    const filePath = join(rawDir, `${platform.key}-${timeStr}.json`);
    await safeWriteFile(filePath, JSON.stringify(data.raw, null, 2));
  }

  // 2. 写入合并数据供前端加载
  console.log("\n--- 写入 latest.json ---");
  const latest = {
    generatedAt: fullISO,
    date: dateStr,
    time: timeStr,
    sources: {},
    platforms: {},
  };

  for (const platform of PLATFORMS) {
    const data = results[platform.key];
    if (!data) {
      latest.platforms[platform.key] = { error: "fetch_failed", data: [] };
      continue;
    }
    latest.sources[platform.key] = { name: data.source, base: data.base };
    latest.platforms[platform.key] = {
      label: platform.label,
      fetchedAt: data.fetchedAt,
      count: data.items.length,
      items: data.items,
    };
  }

  const latestPath = join(ROOT, "public", "data", "latest.json");
  await safeWriteFile(latestPath, JSON.stringify(latest, null, 2));

  // 3. 元数据
  const metaPath = join(ROOT, "public", "data", "meta.json");
  const meta = {
    lastUpdate: fullISO,
    date: dateStr,
    time: timeStr,
    platforms: Object.fromEntries(
      PLATFORMS.map((p) => [p.key, results[p.key] ? results[p.key].items.length : 0])
    ),
    sources: Object.fromEntries(
      PLATFORMS.map((p) => [p.key, results[p.key] ? results[p.key].source : null])
    ),
  };
  await safeWriteFile(metaPath, JSON.stringify(meta, null, 2));

  console.log(`\n=== 完成 (${successCount}/${PLATFORMS.length} 平台成功) ===\n`);
}

main().catch((err) => {
  console.error("致命错误:", err);
  process.exit(1);
});
