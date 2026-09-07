#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiUrl = process.env.DIANDIAN_API_URL || "";
const apiToken = process.env.DIANDIAN_API_TOKEN || "";
const now = new Date();
const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const date = cst.toISOString().slice(0, 10);
const hour = cst.getUTCHours();
const period = process.env.DIANDIAN_PERIOD || (hour < 12 ? "morning" : "afternoon");
const question = period === "morning"
  ? "昨天在小红书站内大家都在搜什么、讨论什么"
  : "今天在小红书站内大家都在搜什么、讨论什么";
const prompt = `${question}？请只根据小红书站内可观察信息回答，区分搜索和讨论趋势。返回 JSON：{"summary":"一句话总结","topics":[{"topic":"话题","direction":"大家在搜什么或讨论什么","evidence":"可核验线索"}]}。不要编造排名、热度值或实时性。`;

function extractPayload(value) {
  if (value && Array.isArray(value.topics)) return value;
  const text = value?.answer ?? value?.text ?? value?.content ?? value?.data?.answer ?? value?.data?.content ?? "";
  if (typeof text !== "string") return { summary: "", topics: [], answer: "" };
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text;
  try {
    const parsed = JSON.parse(fenced.trim());
    return { ...parsed, answer: text };
  } catch {
    return { summary: text.slice(0, 180), topics: [], answer: text };
  }
}

async function save(result) {
  const historyDir = join(root, "public", "data", "history");
  await mkdir(historyDir, { recursive: true });
  const body = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile(join(historyDir, `${date}-${period}-xhs-diandian.json`), body, "utf8");
  await writeFile(join(root, "public", "data", "xhs-diandian-latest.json"), body, "utf8");
}

let result = {
  date,
  period,
  question,
  source: "小红书问点点",
  summary: "",
  topics: [],
  answer: "",
  realtime: false,
  scorable: false,
  status: "capture_unavailable",
  capturedAt: now.toISOString()
};

if (!apiUrl) {
  result.summary = "未配置问点点接口，本次未发起提问；不沿用旧内容。";
  await save(result);
  console.log(result.summary);
  process.exit(0);
}

try {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
    },
    body: JSON.stringify({ question, prompt, period, date })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  const raw = contentType.includes("application/json") ? await response.json() : { answer: await response.text() };
  const parsed = extractPayload(raw);
  result = {
    ...result,
    summary: parsed.summary || "问点点回答已归档。",
    topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
    answer: parsed.answer || raw.answer || "",
    status: "ok"
  };
} catch (error) {
  result.summary = `问点点提问失败：${error.message}；不沿用旧内容。`;
}

await save(result);
console.log(`问点点 ${period} 提问完成：${result.status}，${result.topics.length} 个话题。`);