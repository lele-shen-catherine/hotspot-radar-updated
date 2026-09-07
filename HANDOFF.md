# 热点雷达 整改 + 今日重生成 —— 交接状态（2026-09-07 19:36）

## 背景
用户（沈雯 shenwen.8）对"热点雷达"项目按**新规 v2** 做架构整改。项目目录：
/root/.joyclaw/workspace/hotspot-radar-updated

## 已经完成并提交（git 已 commit，浏览器实测通过）
1. 小红书问点点 → **UAPI 小红书热榜**（uapis.cn/api/v1/misc/hotboard?type=xiaohongshu），已修复解析 bug（json.list 而非 json.data），数据源正常接入
2. 趋势图彻底删除（CSS/JS/文字/__TREND_DATA__/inject 生成块），修复 chartRiskDouyin undefined 报错
3. S/A/B 分级重写：新公式 热度值=峰值榜位35%+平台热度20%+在榜时长25%+跨平台20%；S:85/A:70/B:60；纯客观分级，取消业务相关性门槛；四类硬性排除改为语义复核
4. chart-bar 排行榜柱状图保留（用户确认）
5. 业务建议注入修复（8 业务正确渲染）
6. workflow cron 调至 08:50/14:30（给 Agent 09:00/14:40 分析备数据）
7. UAPI 抓取成功：微博52/抖音50/小红书20/全网10；filter/analyze 跑通，客观分级产出 **6 个 B 级热点**（当前无 S/A）

## 6 个 B 级热点（2026-09-07 下午轮，已抓取）
- 华为芯片（抖音热榜第1）
- 燕麦卫衣（抖音第2）
- 青春华章（抖音第3）
- 郑钦文（抖音第4）
- 中国女篮（抖音第5）
- 郭德纲事件处罚通报（微博置顶；**用户确认保留展示**，仅公共信息、不建议娱乐化/商业化/玩梗）

## 待办（本次会话因工具输出被压缩无法推进，需新会话接手）
1. 确认并修复 `scripts/gen-daily-content.mjs` 两处**手滑写入的语法错误**：
   - `const today = ts.slice(0, 10差分);` → 应为 `ts.slice(0, 10)`
   - `const pendingReview = lastPendingReview || <td>;` → 这一行应删除/修正
2. **新增要求：每次最多保留 6 个热点（top6）** —— 按热度值取前 6，写进脚本防溢出
3. 跑通 gen-daily-content.mjs 生成 → 注入页面 → **真实浏览器实测**（dashboard 200、无 JS 报错）
4. 给用户完整预览，**等"OK"** 才推送+部署（新规确认机制）

## 关键文件
- 脚本：`scripts/fetch-hotspot.mjs`、`scripts/analyze-hotspots.mjs`、`scripts/gen-daily-content.mjs`（新写，待修）、`scripts/inject-dashboard-data.mjs`
- 数据：`public/data/radar.json`、`meme-topics.json`、`business-advice.json`
- 页面：`index.html`、`history/`（历史页，用户已确认不改）

## 交接说明
- 新会话开场先 read 本文件，再 `git log -1` 确认提交状态
- 修复语法错误用 edit（精确匹配原文，不需读整个文件）
- 输出如仍被压缩，尝试开**新会话**（新会话 context 干净，工具输出通常正常）