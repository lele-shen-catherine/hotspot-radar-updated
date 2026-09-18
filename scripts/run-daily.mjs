#!/usr/bin/env node
/**
 * ============================================================
 * hotspot-radar 每日全流程编排（一条命令跑通，带强制质量门禁）
 * ============================================================
 * 职责：把「抓取→过滤→评分→AI深度分析→修补radar→合成业务→
 *       质量门禁→注入dashboard→校验→(可选)部署」串成唯一入口，
 *       并在关键产出点做硬校验；任一 AI 深度思考字段缺失/占位
 *       → 直接失败，禁止部署。
 *
 * 用法：
 *   node scripts/run-daily.mjs            # 全流程（不部署）
 *   node scripts/run-daily.mjs --deploy   # 全流程 + Netlify 部署
 *   node scripts/run-daily.mjs --check    # 只做最终质量门禁检查
 * ============================================================
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const DO_DEPLOY = args.includes('--deploy');
const DO_CHECK  = args.includes('--check');

// ---------- 工具 ----------
function run(cmd, label) {
  console.log(`\n━━━ [${label}] ━━━`);
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(out);
  } catch (e) {
    console.error(`❌ ${label} 失败 (exit ${e.status})`);
    console.error(e.stdout || '');
    console.error(e.stderr || '');
    process.exit(1);
  }
}

function readJson(rel) {
  const p = path.join(root, rel);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

// ---------- 六大 AI 深度思考字段（核心规则，不许出错） ----------
const AI_FIELDS = ['explanation', 'whyHot', 'risk']; // 事件解释 / 为什么热度高 / 风险提醒
const PLACEHOLDERS = ['当前数据源暂不可用', '数据源暂不可用', '暂无', '待补充', '低风险，发布前复核事实'];

function checkAI(ai) {
  const analyses = ai.analyses || {};
  const titles = Object.keys(analyses);
  let issues = 0, positives = 0;

  if (!titles.length) { console.error('❌ ai-analysis.json 无任何分析'); return false; }

  for (const t of titles) {
    const a = analyses[t];
    for (const f of AI_FIELDS) {
      const v = (a[f] || '').trim();
      if (!v) { console.error(`❌ ${t}.${f} 为空`); issues++; continue; }
      if (PLACEHOLDERS.some(p => v.includes(p))) { console.error(`❌ ${t}.${f} 是占位符`); issues++; }
    }
    const biz = Array.isArray(a.business) ? a.business : [];
    if (!biz.length) { console.error(`❌ ${t}.business 为空`); issues++; }
  }

  // 热度值排行榜必须真实评分（非硬编码示例）
  const radar = readJson('public/data/radar.json');
  if (radar && Array.isArray(radar.hotspots)) {
    for (const h of radar.hotspots) {
      const s = h.totalScore;
      if (typeof s !== 'number' || s <= 0) { console.error(`❌ ${h.title}.totalScore 无效`); issues++; }
      else positives++;
    }
  } else { console.error('❌ 无法读取 radar.json 校验热度榜'); issues++; }

  console.log(`[门禁] ${titles.length} 条热点 × ${AI_FIELDS.length} 字段 + business 非空，热度榜 ${positives} 条有效。`);
  return issues === 0;
}

// ---------- 主流程 ----------
console.log('========================================');
console.log(`  热点雷达 每日全流程  ${new Date().toLocaleString('zh-CN')}`);
console.log(`  deploy=${DO_DEPLOY}  check=${DO_CHECK}`);
console.log('========================================');

if (DO_CHECK) {
  const ai = readJson('public/data/ai-analysis.json');
  if (!ai) { console.error('❌ 缺少 ai-analysis.json，无法 --check'); process.exit(1); }
  const ok = checkAI(ai);
  console.log(ok ? '✅ 质量门禁通过' : '❌ 质量门禁未通过');
  process.exit(ok ? 0 : 1);
}

// 1. 抓取 + 过滤 + 评分
run('node scripts/fetch-hotspot.mjs && node scripts/filter-hotspots.mjs && node scripts/analyze-hotspots.mjs', '1.抓取/过滤/评分');

// 2. AI 深度分析（关键步骤，绝不能跳过）
run('node scripts/generate-ai-analysis.mjs', '2.AI深度分析');

// 3. 用 AI 深度分析修补 radar.json（事件解释/为什么热/风险提醒 ← AI 内容）
run('node scripts/patch-radar-with-ai.mjs', '3.修补radar(注入AI字段)');

// 4. 合成本地生活业务建议
run('node scripts/gen-daily-content.mjs', '4.合成业务建议');

// 5. 质量门禁（硬校验，不过则退出不部署）
const ai = readJson('public/data/ai-analysis.json');
if (!checkAI(ai)) {
  console.error('❌ 质量门禁未通过，禁止部署');
  process.exit(1);
}

// 6. 注入 dashboard.html 渲染
run('node scripts/inject-dashboard-data.mjs', '5.注入dashboard');

// 6.5 历史页归档（每天成品页存进 /history/<date>.html + 重建 manifest，保留最近7天）
run('node scripts/archive-history.mjs', '5.5历史归档(保留7天)');

// 7. 模板校验
run('npm run validate', '6.模板校验');

// 8. 部署
if (DO_DEPLOY) {
  console.log('\n━━ 部署到 Netlify v2 (hotspot-radar-kaikai-v2) ━━');
  const secretsPath = '/root/.joyclaw/workspace/.secrets/netlify.env';
  let env = {};
  if (existsSync(secretsPath)) {
    for (const line of readFileSync(secretsPath, 'utf-8').split('\n')) {
      // 兼容两种格式: "export KEY=value" 或 "KEY=value"
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  if (!env.NETLIFY_AUTH_TOKEN) {
    console.error('❌ 缺少 NETLIFY_AUTH_TOKEN');
    process.exit(1);
  }
  const siteId = '2cba2afb-bba5-4aba-afc8-30be956e2168'; // hotspot-radar-kaikai-v2
  run(`NETLIFY_AUTH_TOKEN="${env.NETLIFY_AUTH_TOKEN}" npx netlify deploy --dir public --site ${siteId} --prod`, '7.部署');
}

console.log('\n✅ 每日全流程完成。');
console.log('产物:');
console.log('  radar.json        →', path.join(root, 'public/data/radar.json'));
console.log('  ai-analysis.json  →', path.join(root, 'public/data/ai-analysis.json'));
console.log('  dashboard.html    →', path.join(root, 'public/dashboard.html'));