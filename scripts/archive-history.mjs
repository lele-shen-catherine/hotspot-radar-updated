#!/usr/bin/env node
/**
 * ============================================================
 * hotspot-radar 历史页面归档（结构不变，纯增量）
 * ============================================================
 * 职责：把当天注入后的 dashboard 成品页复制为 /history/<date>.html，
 *       并重建 manifest.json —— 只保留「最近 7 天 + 文件确实存在」的条目。
 *
 * 规则（对应需求）：
 *   1. 每天跑完自动把当天页面存进 public/history/<date>.html（自包含成品，与旧历史页同构）
 *   2. manifest.json 只保留最近 7 天条目，按日期倒序，当天标 current:true
 *   3. 清空看不了的：manifest 里没有对应 html 文件的条目一律剔除（如旧的 09-07 缺文件）
 *   4. 超过 7 天的旧 html 文件会被删除（结构上历史下拉只有 7 天）
 *
 * 用法：
 *   node scripts/archive-history.mjs            # 归档今天（读取 public/dashboard.html）
 *   node scripts/archive-history.mjs --init     # 初始化：清理过期文件 + 重建 manifest（不归档）
 * ============================================================
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const historyDir = path.join(root, 'public', 'history');
const manifestPath = path.join(historyDir, 'manifest.json');
const dashboardPath = path.join(root, 'public', 'dashboard.html');

const args = process.argv.slice(2);
const DO_INIT = args.includes('--init');

// 今天日期（Asia/Shanghai，YYYY-MM-DD）
function todayStr() {
  const now = new Date();
  // 用本地时间即可（环境时区已为 Asia/Shanghai）
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 计算 N 天前的日期
function daysAgoStr(n) {
  const dt = new Date();
  dt.setDate(dt.getDate() - n);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 读取现有 manifest
function readManifest() {
  if (!existsSync(manifestPath)) return { updatedAt: null, entries: [] };
  try { return JSON.parse(readFileSync(manifestPath, 'utf-8')); } catch { return { updatedAt: null, entries: [] }; }
}

function main() {
  mkdirSync(historyDir, { recursive: true });

  const today = todayStr();
  const cutoff = daysAgoStr(6); // 今天 + 前6天 = 7天窗口
  console.log(`[archive] 今天=${today}  7天窗口起点=${cutoff}`);

  // ---- 1. 归档今天（非 --init 时） ----
  if (!DO_INIT) {
    if (!existsSync(dashboardPath)) {
      console.error('❌ 缺少 public/dashboard.html，无法归档今天。请先运行 run-daily.mjs。');
      process.exit(1);
    }
    const dest = path.join(historyDir, `${today}.html`);
    copyFileSync(dashboardPath, dest);
    console.log(`✅ 已归档今天页面 → ${path.relative(root, dest)}`);
  }

  // ---- 2. 清空看不了的：删除超过7天 + 无 manifest 记录但文件存在的过期 html ----
  const existing = readdirSync(historyDir).filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f));
  let removed = 0;
  for (const f of existing) {
    const date = f.replace('.html', '');
    // 只保留 7 天窗口内（>= cutoff）
    if (date < cutoff) {
      unlinkSync(path.join(historyDir, f));
      console.log(`🗑  删除过期历史页 ${f}（超出7天窗口）`);
      removed++;
    }
  }

  // ---- 3. 重建 manifest：只保留 7 天窗口内 + 文件确实存在的条目，按日期倒序 ----
  const newEntries = [];
  for (let i = 0; i < 7; i++) {
    const date = daysAgoStr(i);
    if (existsSync(path.join(historyDir, `${date}.html`))) {
      newEntries.push({ date, current: date === today });
    }
  }
  // 倒序（最新在前）
  newEntries.sort((a, b) => (a.date < b.date ? 1 : -1));

  const manifest = { updatedAt: new Date().toISOString(), entries: newEntries };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ manifest.json 重建：${newEntries.length} 天`);
  newEntries.forEach(e => console.log(`  - ${e.date}${e.current ? '（当前）' : ''}`));

  // ---- 4. 同步 dashboard.html 里的 embeddedEntries（本地 file:// 打开时的兜底） ----
  if (existsSync(dashboardPath)) {
    const dhtml = readFileSync(dashboardPath, 'utf-8');
    const embeddedJson = JSON.stringify(newEntries);
    const newBlock = `var embeddedEntries = ${embeddedJson};`;
    const re = /var embeddedEntries = \[[\s\S]*?\];/;
    if (re.test(dhtml)) {
      writeFileSync(dashboardPath, dhtml.replace(re, newBlock));
      console.log(`✅ dashboard.html embeddedEntries 已同步（${newEntries.length} 天兜底）`);
    }
  }

  console.log(`\n[archive] 完成：已归档=${DO_INIT ? '否(仅清理)' : '是'}，删除过期=${removed}，保留=${newEntries.length} 天`);
}

main();