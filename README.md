# 热点雷达

每天自动抓取全网、微博与抖音热点，通过可审计的本地规则判断业务相关性、时效性、创意空间与风险，生成可借势热点数据。GitHub Actions 将结果提交回仓库；已连接本仓库的 Netlify 会在 push 后自动部署。整个流程不依赖 AI API 或密钥。

## 自动链路

```text
GitHub Actions 定时/手动触发
  → scripts/fetch-hotspot.mjs       抓取并标准化榜单
  → scripts/filter-hotspots.mjs      关键词、榜位、热度、跨平台规则初筛
  → scripts/analyze-hotspots.mjs     本地评分与风险审核
  → git commit + push                提交数据结果
  → Netlify Git Deploy               自动构建并更新站点
```

运行时间为北京时间每天 08:15、15:00，也支持在 GitHub Actions 页面手动运行。

## 首次配置

1. 在 Netlify 导入该 GitHub 仓库，Production branch 选择 `main`。仓库根目录的 `netlify.toml` 已配置发布 `public` 目录。
2. 在 GitHub 仓库 `Settings → Actions → General` 确认 Workflow permissions 允许 Read and write；工作流自身也声明了 `contents: write`。
3. 在 Actions 中手动运行一次 `Update Hotspot Radar`，确认生成 `public/data/radar.json` 并成功 push。

自动评分不需要任何模型 API 密钥。`JUSTONE_API_TOKEN` 仍为可选项；未配置时，小红书数据源会自动使用公开兜底源。

## 本地运行

要求 Node.js 22.13+：

```bash
npm install
node scripts/fetch-hotspot.mjs
node scripts/filter-hotspots.mjs
npm run radar:analyze
npm run build
```

也可以用 `npm run radar:update` 连续执行完整数据流程。规则配置位于 `config/hotspot-rules.json`，展示与业务边界位于 `HOTSPOT_RULES.md`。

## 关键产物

- `public/data/latest.json`：标准化平台榜单
- `data/processed/candidates.json`：规则初筛结果及排除原因
- `public/data/radar.json`：本地评分的最终决策，供首页读取
- `public/data/history/YYYY-MM-DD-radar.json`：历史决策

当抓取或处理失败时，工作流会停止，不提交半成品；Netlify 因此继续展示上一份完整结果。
