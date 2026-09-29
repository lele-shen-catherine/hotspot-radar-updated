#!/usr/bin/env python3
"""同步 ai-analysis.json 的 businessAdvice 为修正后的单热点借势版本（对齐 business-advice.json）"""
import json, os

BASE = "/root/.joyclaw/workspace/hotspot-radar-updated/public/data"

# 读取已修正的 business-advice.json
with open(os.path.join(BASE, "business-advice.json"), encoding="utf-8") as f:
    adv = json.load(f)
businesses = adv["businesses"]  # dict: business -> {action, comms}

# 读取 ai-analysis.json
ai_path = os.path.join(BASE, "ai-analysis.json")
with open(ai_path, encoding="utf-8") as f:
    ai = json.load(f)

# 重建 businessAdvice 列表（保留原 business 名，替换 action/comms）
new_advice = []
for item in ai.get("businessAdvice", []):
    bname = item.get("business", "")
    if bname in businesses:
        new_advice.append({
            "business": bname,
            "action": businesses[bname]["action"],
            "comms": businesses[bname]["comms"],
        })
    else:
        new_advice.append(item)

ai["businessAdvice"] = new_advice

with open(ai_path, "w", encoding="utf-8") as f:
    json.dump(ai, f, ensure_ascii=False, indent=2)

# 验证
s = json.dumps(ai, ensure_ascii=False)
print("同步完成。businessAdvice 条数:", len(new_advice))
print("『节日节点』残留次数:", s.count("节日节点"))
print("『借哪个热点』点名:", [i.get("business","")+"->"+(i.get("action","")[:18]) for i in new_advice])