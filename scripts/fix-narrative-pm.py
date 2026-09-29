#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""人工重写 2026-09-29 下午热点雷达的叙事解释 + 纯动因（修正张冠李戴/模板套话）"""
import json, io, sys

BASE = "/root/.joyclaw/workspace/hotspot-radar-updated/public/data"

# ============ 人工核对的真实叙事（事件解释）+ 纯动因（为什么热度高）============
# 依据 2026-09-29 web_search 核对到的真实事件背景
NARRATIVE = {
    "林诗栋夺冠": {
        "eventSummary": "9月28日，2026名古屋亚运会乒乓球男单决赛，21岁的林诗栋以4-0横扫卫冕冠军王楚钦，全程仅用时32分钟，夺得金牌。凭借这枚男单金牌，他本届亚运会收获混双、男双、男单三金外加男团银牌，成为首次参赛就交出3金1银的“三冠王”，也被视为国乒新生代的希望。",
        "propagation": "亚运前国乒男队刚经历多站赛事0冠的低谷，舆论本就紧绷；林诗栋以黑马姿态32分钟速胜卫冕冠军、达成三金一银，赛果与励志蜕变的双重反差制造强戏剧性。竞技对抗自带代入感，观赛情绪、胜负讨论在多个平台同步发酵，传播窗口短而集中。",
    },
    "国乒男团无缘亚运九连冠": {
        "eventSummary": "9月24日，2026名古屋亚运会乒乓球男团决赛，由王楚钦、林诗栋、温瑞博出战的中国队历经五盘鏖战，以2-3惜败东道主日本队，无缘亚运男团九连冠。这是自1974年中国队参赛以来首次在亚运男团负于日本，日本队则时隔60年再夺该项目金牌。队长王楚钦赛后坦言失利“很大一部分原因在我”。",
        "propagation": "国乒男团连续八届夺冠的统治地位被东道主日本终结，历史纪录改写自带话题爆发力；“狼来了”的悬念与比赛过程的胶着强化了看点和情绪，胜负之外又叠加阵容深度、青黄不接的舆论讨论，跨圈层持续发酵。",
    },
    "这个长假我与世界平分秋色": {
        "eventSummary": "2026年中秋节（9月25-27日）与国庆节（10月1-7日）之间仅隔3个工作日，网友只需请3天年假即可拼出长达13天的超长假期，“请3休13”拼假攻略随之刷屏，带动“我的长长长假”等话题登上热榜，主打松弛、慢生活的度假方式受到追捧。",
        "propagation": "拼假公式贴近每个打工人的真实休假诉求，信息增量强、人人可参与计算；假期将至的时间节点推高了讨论，社交平台上的“别人的长假”分享形成羡慕与围观效应，话题黏性高、覆盖面广。",
    },
    "英语才是普通人的终极杠杆": {
        "eventSummary": "这是一条观点话题热榜：源自《纳瓦尔宝典》的“杠杆理论”在社交平台广泛传播，主张对普通人而言，代码与媒体等边际成本为零的杠杆最易获得，而英语等通用能力被视为撬动机会、放大个人价值的“终极杠杆”，引发大量转发与讨论。",
        "propagation": "观点自带认知增量，用“终极杠杆”这类强主张制造反差与共鸣；它既谈努力又谈方法，切中打工人对成长与翻身的普遍焦虑，容易激发转发、评论和二次创作，话题延展性强。",
    },
    "荣耀Magic9系列发布会": {
        "eventSummary": "9月28日，荣耀在北京举办“荣耀Magic盛典暨Magic9系列新品发布会”，正式发布Magic9 Pro Max、Magic9、Magic9超能版三款旗舰，起售价4499元，当日开售。该系列携手百年影像品牌阿莱（ARRI）打造双2亿影像系统，定位“掌中电影机”，代言人肖战出席并引发关注。",
        "propagation": "年度旗舰新品自带“首发即热度”，联手阿莱的影像升级与“掌中电影机”卖点制造新鲜感；代言人肖战的流量带动粉丝围观，科技媒体的开箱与对比评测进一步扩散，跨平台讨论集中爆发。",
    },
    "豆包公关负责人辟谣裁员": {
        "eventSummary": "9月24日，针对自媒体“豆包裁员”“对话团队砍掉一半”的传闻，豆包公关负责人刘星发文回应称信息不实，实际只是分工组织调整：豆包通用Session团队部分职能拆到交易与工作团队，人员随职能迁移，团队不到50人，涉及11人、其中3人离职。",
        "propagation": "裁员传闻自带敏感性与传播力，涉及头部AI产品与团队变动，极易被放大；官方澄清与传闻形成“先传后辟”的拉扯，公众对真实性、口径和后续动向持续关注，争议与求证带动话题热度。",
    },
}

def load(p):
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)

def dump(p, obj):
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

# ---------- 1. 修正 radar.json ----------
radar_path = f"{BASE}/radar.json"
radar = load(radar_path)
fixed = 0
for h in radar["hotspots"]:
    t = h.get("title")
    if t in NARRATIVE:
        h["eventSummary"] = NARRATIVE[t]["eventSummary"]
        h["propagation"] = NARRATIVE[t]["propagation"]
        fixed += 1
dump(radar_path, radar)
print(f"[radar.json] 修正 {fixed} 个热点的 eventSummary/propagation")

# ---------- 2. 修正 ai-analysis.json（保持解释一致性）----------
ai_path = f"{BASE}/ai-analysis.json"
ai = load(ai_path)
fixed2 = 0
for k, v in ai["analyses"].items():
    if k in NARRATIVE:
        v["explanation"] = NARRATIVE[k]["eventSummary"]
        v["whyHot"] = NARRATIVE[k]["propagation"]
        fixed2 += 1
dump(ai_path, ai)
print(f"[ai-analysis.json] 修正 {fixed2} 个热点的 explanation/whyHot")

print("=== 完成，抽查 ===")
radar = load(radar_path)
for h in radar["hotspots"]:
    print(f"### {h['title']}")
    print("  事件解释:", h["eventSummary"][:60], "...")
    print("  为什么热:", h["propagation"][:50], "...")