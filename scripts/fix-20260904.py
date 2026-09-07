#!/usr/bin/env python3
"""Apply 2026-09-04 user-required rule: remove 胚胎案 (sensitive ethics) from graded list.
Move to watchlist as observation-only. Keep 井柏然 A."""
import json, copy

files = [
    "/root/.joyclaw/workspace/hotspot-radar-updated/public/data/radar.json",
    "/root/.joyclaw/workspace/hotspot-radar-updated/public/data/history/2026-09-04-radar.json",
]

ETHICS_TITLE = "胚胎案原配称男方想回归家庭不可能"

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    hotspots = data.get("hotspots", [])
    graded = [h for h in hotspots if h.get("level") not in (None, "", "observe", "watch", "S", "A", "B")]
    # find the ethics item in graded list
    moved = None
    keep = []
    for h in hotspots:
        if h.get("title") == ETHICS_TITLE:
            moved = h
        else:
            keep.append(h)

    # demote moved item to observe
    if moved is not None:
        moved["level"] = "observe"
        moved["worthLeveraging"] = False
        moved["riskLevel"] = "high"
        moved["reason"] = "敏感伦理/个体家庭争议事件，不可借势。即使热度达标也不进入S/A/B分级，仅作中立观察，不建议借势。"
        moved["excluded"] = True
        moved["exclusionReason"] = "敏感伦理个体事件，禁止进入可借势分级"

    data["hotspots"] = keep

    # add to watchlist if not present
    wl = data.get("watchlist", [])
    existing_titles = {w.get("title") for w in wl}
    if moved is not None and ETHICS_TITLE not in existing_titles:
        wl.insert(0, moved)
    data["watchlist"] = wl

    # update summary
    summary = data.get("summary", {})
    summary["analyzed"] = summary.get("analyzed", 0)
    summary["selected"] = len([h for h in keep if h.get("level") in ("S", "A", "B")])
    summary["rejected"] = summary.get("rejected", 0)
    data["summary"] = summary

    # remove heatReasons entry for ethics
    hr = data.get("heatReasons", {})
    if ETHICS_TITLE in hr:
        del hr[ETHICS_TITLE]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    levels = [h.get("level") for h in keep]
    print(os.path.basename(path), "-> hotspots levels:", levels, "| summary:", summary)