#!/bin/bash
# ============================================================
# push-github.sh — 稳健的 GitHub push（热点雷达部署核心链路）
# ------------------------------------------------------------
# 背景：WSL2 + git 2.34.1(GnuTLS) 在 HTTP/2 下与 GitHub 存在
#   GnuTLS recv error (-110) / Operation too slow / Auth 偶发失败。
# 本脚本固化所有调参（HTTP/1.1 + 低速放宽）并做指数退避重试，
# 推送成功后 GitHub Actions 会自动把 public/ 部署到 gh-pages，
# jsDelivr 随之刷新 — 这是当前正确的部署链路（Netlify 额度已用尽）。
#
# 用法：
#   scripts/push-github.sh "commit message"    # 提交并推送
#   scripts/push-github.sh --no-commit         # 仅推送已有提交
# ============================================================

set -uo pipefail

REPO_DIR="/root/.joyclaw/workspace/hotspot-radar-updated"
cd "$REPO_DIR" || { echo "❌ 无法进入仓库目录 $REPO_DIR"; exit 1; }

# ---- 稳健 git 参数（固化历史手工调参）----
# HTTP/1.1：规避 GnuTLS/HTTP2 的 TLS 非正常终止问题
# 低速放宽：默认 1000bytes/60s 太严，WSL2 网络抖动易触发
GIT_FLAGS=(
  -c http.version=HTTP/1.1
  -c http.lowSpeedLimit=1
  -c http.lowSpeedTime=300
  -c http.postBuffer=524288000
)

MAX_ATTEMPTS=6          # 重试次数
RETRY_BASE=20           # 首次等待秒数（指数退避）
COMMIT_MSG="${1:-daily update $(date '+%Y-%m-%d %H%M')}"
NO_COMMIT="${2:-}"

# 提交（如需）
if [ "$NO_COMMIT" != "--no-commit" ]; then
  git add -A
  if git diff --cached --quiet; then
    echo "ℹ️ 无新增改动，跳过 commit（仍尝试 push 确保同步）"
  else
    git -c user.name="Hotspot Radar Bot" -c user.email="bot@users.noreply.github.com" \
        commit -m "$COMMIT_MSG" || { echo "❌ commit 失败"; exit 1; }
  fi
fi

# 2) 稳健推送（指数退避重试）
echo "==> 开始推送 origin main（HTTP/1.1，最多 $MAX_ATTEMPTS 次）"
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "--- 第 $attempt/$MAX_ATTEMPTS 次推送 ---"
  if git "${GIT_FLAGS[@]}" push origin main 2>&1; then
    echo "✅ push 成功（第 $attempt 次）"
    exit 0
  fi
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    wait=$(( RETRY_BASE * 2 ** (attempt - 1) ))
    echo "⚠️ 第 $attempt 次失败，等待 ${wait}s 后重试..."
    sleep "$wait"
  fi
done

echo "❌ 推送失败：已达最大重试次数"
echo "   诊断建议："
echo "   - 检查网络: curl -sI https://github.com"
echo "   - 检查认证: git ls-remote origin HEAD"
exit 1