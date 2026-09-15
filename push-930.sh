#!/bin/bash
# ⚠️ 本文件已废弃（2026-09-15）。
# 旧版 09:30 推送脚本，内容为硬编码过期热点，且不含完整 git/推送逻辑。
# 现在 09:30 / 15:30 的推送由 cron 系统事件触发，走 OpenClaw 消息通道（joychat），
# 数据由 deploy-daily.sh 生成并 push 到 GitHub（GitHub Actions 部署 gh-pages）。
# 本脚本保留为空壳以避免误触发，不再执行任何推送。
exit 0