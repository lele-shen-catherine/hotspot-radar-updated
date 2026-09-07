#!/usr/bin/env bash
# ============================================================
# hotspot-radar 每日自动更新 + 部署脚本
# 用法: bash deploy-daily.sh
# 流程: 抓取数据 → 过滤 → 分析 → 校验 → 部署到 Netlify
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

# 1. 抓取 + 过滤 + 分析
echo "--- 步骤1: 抓取/过滤/分析 ---"
npm run radar:update 2>&1 || { echo "❌ radar:update 失败"; exit 1; }

# 2. 校验
echo "--- 步骤2: 校验 ---"
npm run validate 2>&1 || { echo "⚠️ validate 警告（继续部署）"; }

# 3. 部署到 v2（唯一正式站点）
echo "--- 步骤3: 部署到 v2 (hotspot-radar-kaikai-v2) ---"
NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" \
  npx netlify deploy --dir public --site "$NETLIFY_SITE_ID_V2" --prod 2>&1

echo ""
echo "=== ✅ 每日更新完成 $(date '+%Y-%m-%d %H:%M') ==="