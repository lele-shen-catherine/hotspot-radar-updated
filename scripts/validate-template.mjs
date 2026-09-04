#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";

const required = [
  "public/dashboard.html",
  "public/history-view.html",
  "public/data/latest.json",
  "public/data/radar.json",
  "config/hotspot-rules.json",
  ".github/workflows/update-hotspot.yml"
];

for (const path of required) await access(path);

for (const path of [
  "public/data/latest.json",
  "public/data/radar.json",
  "config/hotspot-rules.json"
]) {
  JSON.parse(await readFile(path, "utf8"));
}

const dashboard = await readFile("public/dashboard.html", "utf8");
for (const marker of ["事件详情与热度走势", "本地生活业务建议", "小红书等平台热榜预览"]) {
  if (!dashboard.includes(marker)) throw new Error(`Dashboard module missing: ${marker}`);
}

console.log("Hotspot radar template validation passed.");
