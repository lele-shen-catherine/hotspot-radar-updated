#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2026-09-24 早间数据合规修正：
1. 删除政治类热点（中美元首互访/习近平国事访问/华盛顿会晤/特朗普）——四类不展示内容，抓到即删、不上页面
2. 重写 radar.json：保留真实可展示非政治热点（亚运会/泰囚禁性侵/林诗栋/中秋庐山），重算 S/A/B 分
3. 重写 ai-analysis.json：explanation=纯叙事、whyHot=纯动因、无模板占位、无借势尾巴
4. 重写 business-advice.json：借势只借真实热点(亚运会/中秋庐山/林诗栋)，泰囚禁性侵写"不建议借势"，无可借业务写常规运营；每业务 action 先写"借xxx热点："、comms 不重复热点名
5. 重建 gen-daily-content.json
6. 重新注入 dashboard.html
"""
import json, os, datetime

root = "/root/.joyclaw/workspace/hotspot-radar-updated"
pub = os.path.join(root, "public/data")
date = "2026-09-24"
now = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

# ---------- 1. radar.json ----------
hotspots = [
    {
        "title": "日本爱知・名古屋亚运会",
        "level": "S",
        "platform": "知微",
        "hot": 10271,
        "totalScore": 85.2,
        "rank": "知微总榜TOP4",
        "trend": "持续高位（在榜11小时）",
        "source": "知微事件榜",
        "summary": "爱知・名古屋亚运会开幕，中国代表团各项目陆续登场，乒乓球等优势项目表现受关注。"
    },
    {
        "title": "3名中国女子在泰遭诱骗囚禁性侵",
        "level": "A",
        "platform": "知微",
        "hot": 2651,
        "totalScore": 76.8,
        "rank": "知微总榜TOP3",
        "trend": "持续高位（在榜11小时）",
        "source": "知微事件榜",
        "summary": "3名中国女子在泰国被诱骗囚禁并遭性侵，事件引发公众对跨境人身安全与维权的高度关注。"
    },
    {
        "title": "林诗栋 打疯了",
        "level": "B",
        "platform": "微博",
        "hot": 3020000,
        "totalScore": 62.4,
        "rank": "微博实时TOP7",
        "trend": "上升中",
        "source": "微博官方热榜",
        "summary": "乒乓球选手林诗栋在亚运赛场表现强势、状态火热，相关话题登上热搜。"
    },
    {
        "title": "中秋来庐山看千里江山",
        "level": "B",
        "platform": "抖音",
        "hot": 39500000,
        "totalScore": 60.8,
        "rank": "抖音总榜TOP2",
        "trend": "上升中",
        "source": "抖音官方热榜",
        "summary": "中秋假期临近，庐山千里江山主题玩法与赏月内容走红，带动中秋出行讨论。"
    }
]
radar = {
    "date": date,
    "updatedAt": now,
    "hotspots": hotspots,
    "meta": {
        "note": "2026-09-24 早间：已剔除政治类（中美元首互访/习近平国事访问/华盛顿会晤/特朗普等，属四类不展示内容直接删除不上页面）。"
    }
}

# ---------- 2. ai-analysis.json ----------
analyses = {
    "日本爱知・名古屋亚运会": {
        "explanation": "爱知・名古屋亚运会正式开幕，中国队多支队伍陆续投入比赛，乒乓球等优势项目的出场与表现成为国内观众关注的焦点。",
        "whyHot": "大型综合体育赛事自带高关注度，加上中国代表团在乒乓球等传统优势项目上有夺金预期，赛事进程天然牵动观众情绪，讨论随赛程持续升温。",
        "risk": "风险等级：低。属健康正向体育话题，可自然关联本地生活消费场景。",
        "business": []
    },
    "3名中国女子在泰遭诱骗囚禁性侵": {
        "explanation": "3名中国女子在泰国被诱骗、囚禁并遭性侵，事件被曝光后引发对跨境人身安全、防骗与维权途径的广泛讨论。",
        "whyHot": "涉及中国公民海外人身安全与恶性犯罪，自带强关切与共情，公众既想了解事件进展，也关注如何防范同类风险，情绪黏性高。",
        "risk": "风险等级：高。属恶性犯罪/受害事件，不建议任何业务借势，仅作热点信息展示。",
        "business": []
    },
    "林诗栋 打疯了": {
        "explanation": "乒乓球选手林诗栋在亚运会赛场状态出色、发挥强势，凭精彩表现登上热搜，外界对其后续比赛充满期待。",
        "whyHot": "实力新星的超常发挥自带观赏性与话题性，精彩球瞬间易在短视频平台扩散，加上亚运热度叠加，讨论快速放大。",
        "risk": "风险等级：低。属正向体育表现话题，可自然关联观赛/聚餐场景。",
        "business": []
    },
    "中秋来庐山看千里江山": {
        "explanation": "中秋假期临近，庐山结合\"千里江山\"主题推出赏月与游玩玩法，相关内容在短视频平台走红，带动中秋出游讨论。",
        "whyHot": "时令节点（中秋）+ 热门目的地 + 视觉冲击强的短视频内容叠加，契合公众假期出行与赏月需求，易于传播。",
        "risk": "风险等级：低。属假期出行正向话题，可关联旅行/美食/到家等本地生活场景。",
        "business": []
    }
}
# 修复 business 列表（真实借势逻辑）
def mk_bus(business, connection, action, comms, risk="中低风险"):
    return {"business": business, "connection": connection, "action": action, "comms": comms, "risk": risk}

analyses["日本爱知・名古屋亚运会"]["business"] = [
    mk_bus("京东旅行", "借「日本爱知・名古屋亚运会」：亚运观赛/赴日观赛与出行", "借「日本爱知・名古屋亚运会」热点：上线亚运观赛主题的机酒打包与周边游套餐，突出直飞名古屋、观赛门票联动。", "围绕亚运观赛场景，用\"去名古屋看亚运\"的轻量化图文与短视频触达出行人群，强调可履约的真实机酒组合与退改保障。"),
    mk_bus("七鲜美食MALL", "借「日本爱知・名古屋亚运会」：观赛聚餐、日式美食", "借「日本爱知・名古屋亚运会」热点：结合观赛夜推出日式主题餐与家庭聚餐套餐，承接亚运观赛人群到店。", "围绕\"看亚运边吃边聚\"场景，主打门店真实菜品与分量呈现，突出日式美食氛围，不做空泛借势。"),
]
analyses["3名中国女子在泰遭诱骗囚禁性侵"]["business"] = [
    mk_bus("京东旅行", "恶性犯罪/受害事件，不建议借势", "不建议借势。此热点属恶性犯罪事件，与本地生活业务无健康结合点，仅作信息展示。", "不建议借势。", "高风险"),
]
analyses["林诗栋 打疯了"]["business"] = [
    mk_bus("京东外卖", "借「林诗栋 打疯了」：观赛宅家点外卖", "借「林诗栋 打疯了」热点：亚运乒乓观赛夜推出\"看球配外卖\"的夜宵档，把观赛热情转化为即时餐饮需求。", "围绕\"边看亚运乒乓边点外卖\"场景，主打真实可履约的夜宵爆品与准时送达，轻量化高频触达观赛人群。"),
    mk_bus("京东秒送（即时零售）", "借「林诗栋 打疯了」：观赛零食/饮料即时送达", "借「林诗栋 打疯了」热点：观赛场景下的零食饮料、冰镇饮品即时送达，强调\"球还没打完，货已到桌\"。", "围绕\"即时满足观赛嘴馋\"场景，突出3+N品类与极速履约，把\"即时\"讲成解决观赛实际问题。"),
]
analyses["中秋来庐山看千里江山"]["business"] = [
    mk_bus("京东旅行", "借「中秋来庐山看千里江山」：中秋赏月出行", "借「中秋来庐山看千里江山」热点：中秋赏月主题的庐山/周边游线路与机酒套餐，突出真实余位与可履约。", "围绕\"中秋去庐山看千里江山赏月\"场景，用有画面感的图文触达出行人群，强调真实余位与退改条件。"),
    mk_bus("七鲜小厨", "借「中秋来庐山看千里江山」：中秋团圆餐桌", "借「中秋来庐山看千里江山」热点：中秋团圆宴、时令食材套餐，承接赏月团圆场景的家庭餐饮需求。", "围绕\"中秋团圆一桌好菜\"场景，主打新鲜现炒与时令食材公示，突出真实门店菜品。"),
    mk_bus("七鲜美食MALL", "借「中秋来庐山看千里江山」：中秋家庭聚会", "借「中秋来庐山看千里江山」热点：中秋到店家庭聚会套餐与门店节日活动，承接团圆聚餐场景。", "围绕\"中秋举家到店团聚\"场景，主打真实门店活动与节日氛围，突出可预约可履约。"),
    mk_bus("京东本地生活（整体）", "借「中秋来庐山看千里江山」：中秋品质生活整合", "借「中秋来庐山看千里江山」热点：以\"中秋品质生活\"为主线整合赏月出行、团圆餐饮、即时零售与到家服务。", "围绕\"中秋团圆一站式\"主线，把旅行、美食、到家服务串成一条中秋生活场景，强化本地生活整体心智。"),
]

ai = {
    "updatedAt": now,
    "generatedBy": "manual-compliance-fix-20260924 (剔除政治+重写叙事+真实借势)",
    "date": date,
    "note": "已剔除政治类热点；explanation 纯叙事、whyHot 纯动因、无模板占位；business 按真实热点借势，恶性事件写不建议借势。",
    "analyses": analyses,
    "businessAdvice": []
}
for key in ["日本爱知・名古屋亚运会", "林诗栋 打疯了", "中秋来庐山看千里江山", "3名中国女子在泰遭诱骗囚禁性侵"]:
    for b in analyses[key]["business"]:
        ai["businessAdvice"].append({"business": b["business"], "action": b["action"], "comms": b["comms"]})

# ---------- 3. business-advice.json ----------
businesses = {}
# 按业务组织：action 先写"借xxx热点："，comms 沿用同一热点不重复热点名
businesses["京东外卖"] = {"action": "借「林诗栋 打疯了」热点：亚运乒乓观赛夜推出\"看球配外卖\"夜宵档，把观赛热情转化为即时餐饮需求。", "comms": "围绕\"边看亚运乒乓边点外卖\"场景，主打真实可履约的夜宵爆品与准时送达，轻量化高频触达观赛人群。"}
businesses["京东秒送（即时零售）"] = {"action": "借「林诗栋 打疯了」热点：观赛场景零食饮料、冰镇饮品即时送达，强调\"球还没打完，货已到桌\"。", "comms": "围绕\"即时满足观赛嘴馋\"场景，突出3+N品类与极速履约，把\"即时\"讲成解决观赛实际问题。"}
businesses["京东家政"] = {"action": "借「中秋来庐山看千里江山」热点：中秋团圆前做一次深度保洁，承接节前大扫除的家庭服务需求。", "comms": "围绕\"中秋团圆干净整洁的家\"场景，主打标准化服务与节日保障，突出真实可预约可履约。"}
businesses["七鲜小厨"] = {"action": "借「中秋来庐山看千里江山」热点：中秋团圆宴与时令食材套餐，承接赏月团圆场景的家庭餐饮需求。", "comms": "围绕\"中秋团圆一桌好菜\"场景，主打新鲜现炒与时令食材公示，突出真实门店菜品。"}
businesses["七鲜咖啡"] = {"action": "借「中秋来庐山看千里江山」热点：中秋赏月配一杯时令特调，承接假期放松场景的到店/外带需求。", "comms": "围绕\"中秋赏月喝杯咖啡\"场景，主打门店真实风味与节日限定，突出真实门店活动。"}
businesses["京东旅行"] = {"action": "借「日本爱知・名古屋亚运会」热点：上线亚运观赛主题机酒打包与周边游套餐，突出直飞名古屋、观赛门票联动；同时借「中秋来庐山看千里江山」上中秋赏月出行线路。", "comms": "围绕亚运观赛与中秋赏月两大出行场景，用有画面感的图文短视频触达出行人群，强调真实余位与退改保障。"}
businesses["七鲜美食MALL"] = {"action": "借「日本爱知・名古屋亚运会」热点：结合观赛夜推出日式主题餐与家庭聚餐套餐，承接亚运观赛人群到店。", "comms": "围绕\"看亚运边吃边聚\"场景，主打门店真实菜品与分量呈现，突出日式美食氛围，不做空泛借势。"}
businesses["京东本地生活（整体）"] = {"action": "借「中秋来庐山看千里江山」热点：以\"中秋品质生活\"为主线整合赏月出行、团圆餐饮、即时零售与到家服务。", "comms": "围绕\"中秋团圆一站式\"主线，把旅行、美食、到家服务串成一条中秋生活场景，强化本地生活整体心智。"}

business_advice = {
    "date": date,
    "basis": "借势热点必须真实可结合业务（亚运会/林诗栋→观赛餐饮即时零售；中秋庐山→团圆出行餐饮家政）；恶性事件「3名中国女子在泰遭诱骗囚禁性侵」不建议借势，仅作信息展示。",
    "coreThemes": ["日本爱知・名古屋亚运会", "林诗栋 打疯了", "中秋来庐山看千里江山"],
    "businesses": businesses,
}

# ---------- 4. gen-daily-content.json ----------
gen = {
    "updatedAt": now,
    "collectedAt": now,
    "date": date,
    "events": [
        {"title": h["title"], "level": h["level"], "score": h["totalScore"], "explanation": analyses[h["title"]]["explanation"], "whyHot": analyses[h["title"]]["whyHot"]}
        for h in hotspots
    ],
    "businessAdvice": [
        {"business": b, "action": v["action"], "comms": v["comms"]}
        for b, v in businesses.items()
    ],
    "meta": {
        "webwide": {"count": 10, "source": "zhiwei-event-rank"},
        "weibo": {"count": 52, "source": "weibo-official"},
        "douyin": {"count": 50, "source": "douyin-official"},
        "xhs": {"count": 20, "source": "xhs"},
    }
}

# ---------- 写入 ----------
def w(p, data):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("✅", p)

w(os.path.join(pub, "radar.json"), radar)
w(os.path.join(pub, "ai-analysis.json"), ai)
w(os.path.join(pub, "business-advice.json"), business_advice)
w(os.path.join(pub, "gen-daily-content.json"), gen)

print("done. radar hotspots:", len(hotspots), "| business:", len(businesses))