#!/usr/bin/env bash
# ============================================================
# hotspot-radar 每日自动更新 + 部署脚本（强制质量门禁版）
# 用法: bash deploy-daily.sh
# 流程: 抓取→过滤→评分→AI深度分析→修补radar→合成业务/玩梗
#       →质量门禁→注入dashboard→校验→部署到 Netlify v2
# 关键: 质量门禁不过则中止，绝不发布带"爬虫原文/占位符/空字段"的页面
# ============================================================
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:$PATH"

cd "$(dirname "$0")"

# 加载 Netlify Token（.secrets 在本工作区根目录）
SECRETS_DIR="/root/.joyclaw/workspace/.secrets"
if [ -f "$SECRETS_DIR/netlify.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$SECRETS_DIR/netlify.env"
  set +a
fi

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "❌ 缺少 NETLIFY_AUTH_TOKEN，请在 .secrets/netlify.env 配置" >&2
  exit 1
fi

# 仅维护 v2 站点（用户指定，v1 不再更新）
NETLIFY_SITE_ID_V2="2cba2afb-bba5-4aba-afc8-30be956e2168"  # hotspot-radar-kaikai-v2 (唯一正式站点)

echo "=== 开始每日更新 $(date '+%Y-%m-%d %H:%M') ==="

# 跑全流程 + 强制质量门禁 + 部署（一条命令，门禁不过则自动中止不部署）
echo "--- 全流程(含AI深度分析+质量门禁+部署) ---"
node scripts/run-daily.mjs --deploy 2>&1 || { echo "❌ 全流程失败，未部署"; exit 1; }

echo ""
echo "=== ✅ 每日更新完成 $(date '+%Y-%m-%d %H:%M') ==="
echo "正式站点: https://hotspot-radar-kaikai-v2.netlify.app"