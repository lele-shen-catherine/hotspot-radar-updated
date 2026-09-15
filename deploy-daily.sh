#!/usr/bin/env bash
# ============================================================
# hotspot-radar 每日自动更新 + 部署脚本（强制质量门禁版）
# 用法: bash deploy-daily.sh
# 流程: 抓取→过滤→评分→AI深度分析→修补radar→合成业务/玩梗
#       →质量门禁→注入dashboard→校验→push 到 GitHub
#       → GitHub Actions 自动部署 gh-pages → jsDelivr 刷新
# 关键: 质量门禁不过则中止，绝不发布带"爬虫原文/占位符/空字段"的页面
#
# 部署链路说明（重要）：
#   Netlify v2 站点额度已用尽（2026-09-14 确认），不再走 Netlify 部署。
#   正确链路 = 本地生成数据 + push 到 GitHub → GitHub Actions 部署 gh-pages
#             → jsDelivr CDN 自动刷新。push 用 scripts/push-github.sh
#             （固化 HTTP/1.1 + 低速放宽 + 指数退避重试，规避 WSL2 连接不稳）。
# ============================================================
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:$PATH"

cd "$(dirname "$0")"

echo "=== 开始每日更新 $(date '+%Y-%m-%d %H:%M') ==="

# 跑全流程 + 强制质量门禁 + 注入 dashboard（但不部署，部署交给 push）
# 不带 --deploy：run-daily.mjs 会执行质量门禁与注入，跳过已废弃的 Netlify 步骤
echo "--- 全流程(含AI深度分析+质量门禁+注入dashboard) ---"
node scripts/run-daily.mjs 2>&1 || { echo "❌ 全流程失败，未部署"; exit 1; }

# 稳健推送到 GitHub（含重试），触发 GitHub Actions 部署 gh-pages
echo "--- 推送 GitHub（触发 gh-pages 自动部署） ---"
bash scripts/push-github.sh "daily update $(date '+%Y-%m-%d %H%M')" 2>&1 || {
  echo "❌ GitHub 推送失败，请检查网络/认证后手动重跑 scripts/push-github.sh";
  exit 1;
}

echo ""
echo "=== ✅ 每日更新完成 $(date '+%Y-%m-%d %H:%M') ==="
echo "线上访问: https://lele-shen-catherine.github.io/hotspot-radar-updated/"
echo "Dashboard: https://lele-shen-catherine.github.io/hotspot-radar-updated/dashboard.html"